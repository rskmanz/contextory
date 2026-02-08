'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ObjectType, ObjectItem, FieldDefinition, FieldValue } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { DAY_WIDTH, ROW_HEIGHT, formatDate, parseDate, getDaysBetween, addDays } from '@/lib/date-utils';

interface ObjectGanttViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
  onItemClick?: (itemId: string) => void;
}

export const ObjectGanttView: React.FC<ObjectGanttViewProps> = ({
  object,
  items,
  workspaceId,
  onItemClick,
}) => {
  const addItem = useStore((state) => state.addItem);
  const updateItemFieldValue = useStore((state) => state.updateItemFieldValue);
  const deleteItem = useStore((state) => state.deleteItem);
  const addObjectField = useStore((state) => state.addObjectField);

  // Find date and number fields for mapping
  const dateFields = useMemo(
    () => (object.fields || []).filter((f) => f.type === 'date'),
    [object.fields]
  );
  const numberFields = useMemo(
    () => (object.fields || []).filter((f) => f.type === 'number'),
    [object.fields]
  );

  const [startFieldId, setStartFieldId] = useState<string>(() => dateFields[0]?.id || '');
  const [endFieldId, setEndFieldId] = useState<string>(() => dateFields[1]?.id || dateFields[0]?.id || '');
  const [progressFieldId, setProgressFieldId] = useState<string>('');
  const [dragging, setDragging] = useState<{
    itemId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    origStart: string;
    origEnd: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute date range from items
  const { timelineStart, timelineEnd, today } = useMemo(() => {
    const now = new Date();
    const todayStr = formatDate(now);
    let minDate = now;
    let maxDate = addDays(now, 30);

    items.forEach((item) => {
      const s = item.fieldValues?.[startFieldId];
      const e = item.fieldValues?.[endFieldId];
      if (typeof s === 'string' && s) {
        const d = parseDate(s);
        if (d < minDate) minDate = d;
      }
      if (typeof e === 'string' && e) {
        const d = parseDate(e);
        if (d > maxDate) maxDate = d;
      }
    });

    return {
      timelineStart: addDays(minDate, -7),
      timelineEnd: addDays(maxDate, 14),
      today: todayStr,
    };
  }, [items, startFieldId, endFieldId]);

  const totalDays = getDaysBetween(timelineStart, timelineEnd);

  // Day headers
  const dayHeaders = useMemo(() => {
    const days: { date: Date; label: string; isToday: boolean; isWeekend: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(timelineStart, i);
      const dow = date.getDay();
      days.push({
        date,
        label: date.getDate().toString(),
        isToday: formatDate(date) === today,
        isWeekend: dow === 0 || dow === 6,
      });
    }
    return days;
  }, [timelineStart, totalDays, today]);

  // Month headers
  const monthHeaders = useMemo(() => {
    const months: { label: string; days: number; startIndex: number }[] = [];
    let curMonth = '';
    let curCount = 0;
    let curStart = 0;

    dayHeaders.forEach((day, idx) => {
      const label = day.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (label !== curMonth) {
        if (curMonth) months.push({ label: curMonth, days: curCount, startIndex: curStart });
        curMonth = label;
        curCount = 1;
        curStart = idx;
      } else {
        curCount++;
      }
    });
    if (curMonth) months.push({ label: curMonth, days: curCount, startIndex: curStart });
    return months;
  }, [dayHeaders]);

  // Bar positioning for an item
  const getBarStyle = useCallback(
    (item: ObjectItem) => {
      const sVal = item.fieldValues?.[startFieldId];
      const eVal = item.fieldValues?.[endFieldId];
      const s = typeof sVal === 'string' && sVal ? parseDate(sVal) : null;
      const e = typeof eVal === 'string' && eVal ? parseDate(eVal) : null;
      if (!s || !e) return null;
      const startOffset = getDaysBetween(timelineStart, s);
      const duration = getDaysBetween(s, e) + 1;
      return { left: startOffset * DAY_WIDTH, width: duration * DAY_WIDTH - 4 };
    },
    [startFieldId, endFieldId, timelineStart]
  );

  const getProgress = useCallback(
    (item: ObjectItem): number => {
      if (!progressFieldId) return 0;
      const val = item.fieldValues?.[progressFieldId];
      return typeof val === 'number' ? Math.max(0, Math.min(100, val)) : 0;
    },
    [progressFieldId]
  );

  const getBarColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress > 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-zinc-400';
  };

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string, type: 'move' | 'resize-start' | 'resize-end') => {
      e.preventDefault();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const sVal = item.fieldValues?.[startFieldId];
      const eVal = item.fieldValues?.[endFieldId];
      setDragging({
        itemId,
        type,
        startX: e.clientX,
        origStart: typeof sVal === 'string' ? sVal : formatDate(new Date()),
        origEnd: typeof eVal === 'string' ? eVal : formatDate(addDays(new Date(), 7)),
      });
    },
    [items, startFieldId, endFieldId]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const deltaX = e.clientX - dragging.startX;
      const deltaDays = Math.round(deltaX / DAY_WIDTH);
      if (deltaDays === 0) return;

      let newStart = dragging.origStart;
      let newEnd = dragging.origEnd;

      if (dragging.type === 'move') {
        newStart = formatDate(addDays(parseDate(dragging.origStart), deltaDays));
        newEnd = formatDate(addDays(parseDate(dragging.origEnd), deltaDays));
      } else if (dragging.type === 'resize-start') {
        newStart = formatDate(addDays(parseDate(dragging.origStart), deltaDays));
        if (parseDate(newStart) >= parseDate(newEnd)) {
          newStart = formatDate(addDays(parseDate(newEnd), -1));
        }
      } else if (dragging.type === 'resize-end') {
        newEnd = formatDate(addDays(parseDate(dragging.origEnd), deltaDays));
        if (parseDate(newEnd) <= parseDate(newStart)) {
          newEnd = formatDate(addDays(parseDate(newStart), 1));
        }
      }

      updateItemFieldValue(dragging.itemId, startFieldId, newStart);
      updateItemFieldValue(dragging.itemId, endFieldId, newEnd);
    },
    [dragging, startFieldId, endFieldId, updateItemFieldValue]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleAddTask = useCallback(async () => {
    const todayDate = formatDate(new Date());
    const nextWeek = formatDate(addDays(new Date(), 7));
    const fieldValues: Record<string, FieldValue> = {};
    if (startFieldId) fieldValues[startFieldId] = todayDate;
    if (endFieldId) fieldValues[endFieldId] = nextWeek;
    await addItem({
      name: 'New item',
      objectId: object.id,
      projectId: workspaceId,
      fieldValues,
    });
  }, [addItem, object.id, workspaceId, startFieldId, endFieldId]);

  const handleProgressChange = useCallback(
    async (itemId: string, value: number) => {
      if (!progressFieldId) return;
      await updateItemFieldValue(itemId, progressFieldId, Math.max(0, Math.min(100, value)));
    },
    [progressFieldId, updateItemFieldValue]
  );

  const handleCreateDateFields = useCallback(async () => {
    const startId = generateId();
    const endId = generateId();
    await addObjectField(object.id, { id: startId, name: 'Start Date', type: 'date' });
    await addObjectField(object.id, { id: endId, name: 'End Date', type: 'date' });
    setStartFieldId(startId);
    setEndFieldId(endId);
  }, [addObjectField, object.id]);

  // No early return — always show items. Bars appear only when date fields are mapped.

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Toolbar: field selectors or create prompt */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-4 py-2 flex items-center gap-4 flex-wrap">
        {dateFields.length > 0 ? (
          <>
            <FieldSelector label="Start" fields={dateFields} value={startFieldId} onChange={setStartFieldId} />
            <FieldSelector label="End" fields={dateFields} value={endFieldId} onChange={setEndFieldId} />
          </>
        ) : (
          <button
            onClick={handleCreateDateFields}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            + Create Date fields
          </button>
        )}
        {numberFields.length > 0 && (
          <FieldSelector
            label="Progress"
            fields={numberFields}
            value={progressFieldId}
            onChange={setProgressFieldId}
            allowEmpty
          />
        )}
        <div className="flex-1" />
        <button
          onClick={handleAddTask}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Item
        </button>
        <span className="text-xs text-zinc-400">{items.length} items</span>
      </div>

      <div className="flex">
        {/* Left sidebar - Item names */}
        <div className="sticky left-0 z-10 bg-white border-r border-zinc-200 min-w-[200px]">
          <div className="h-[60px] border-b border-zinc-200 bg-zinc-50 flex items-end px-3 pb-2">
            <span className="text-xs font-medium text-zinc-500">Item</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="h-10 border-b border-zinc-100 flex items-center px-3 group hover:bg-zinc-50"
            >
              <span
                className="flex-1 text-sm truncate cursor-pointer hover:text-blue-600"
                onClick={() => onItemClick?.(item.id)}
              >
                {item.name}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-1 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="h-20 flex items-center justify-center text-zinc-400 text-sm">
              No items yet
            </div>
          )}
        </div>

        {/* Right side - Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Month headers */}
          <div className="flex h-[30px] border-b border-zinc-200 bg-zinc-50">
            {monthHeaders.map((month, i) => (
              <div
                key={i}
                style={{ width: month.days * DAY_WIDTH }}
                className="text-xs font-medium text-zinc-600 px-2 flex items-center border-r border-zinc-200"
              >
                {month.label}
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="flex h-[30px] border-b border-zinc-200 bg-zinc-50">
            {dayHeaders.map((day, i) => (
              <div
                key={i}
                style={{ width: DAY_WIDTH }}
                className={`text-xs text-center flex items-center justify-center border-r border-zinc-100 ${
                  day.isToday
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : day.isWeekend
                    ? 'bg-zinc-100 text-zinc-400'
                    : 'text-zinc-500'
                }`}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Item bars */}
          <div className="relative" style={{ width: totalDays * DAY_WIDTH }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {dayHeaders.map((day, i) => (
                <div
                  key={i}
                  style={{ width: DAY_WIDTH }}
                  className={`border-r border-zinc-100 ${day.isWeekend ? 'bg-zinc-50/50' : ''} ${
                    day.isToday ? 'bg-blue-50/50' : ''
                  }`}
                />
              ))}
            </div>

            {/* Today marker */}
            {dayHeaders.findIndex((d) => d.isToday) >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                style={{ left: (dayHeaders.findIndex((d) => d.isToday) + 0.5) * DAY_WIDTH }}
              />
            )}

            {/* Item rows */}
            {items.map((item) => {
              const barStyle = getBarStyle(item);
              const progress = getProgress(item);
              const barColor = getBarColor(progress);

              return (
                <div key={item.id} className="relative" style={{ height: ROW_HEIGHT }}>
                  {barStyle && (
                    <>
                      {/* Task bar */}
                      <div
                        className={`absolute top-1.5 h-7 ${barColor} rounded cursor-move group flex items-center`}
                        style={{ left: barStyle.left, width: barStyle.width }}
                        onMouseDown={(e) => handleMouseDown(e, item.id, 'move')}
                      >
                        {/* Resize handle - start */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, item.id, 'resize-start');
                          }}
                        />

                        {/* Progress fill */}
                        {progress > 0 && (
                          <div
                            className="absolute inset-0 bg-white/30 rounded-l"
                            style={{ width: `${progress}%` }}
                          />
                        )}

                        {/* Progress text */}
                        <span className="relative z-10 text-xs text-white font-medium px-2 truncate">
                          {barStyle.width > 60 ? `${progress}%` : ''}
                        </span>

                        {/* Resize handle - end */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, item.id, 'resize-end');
                          }}
                        />
                      </div>

                      {/* Progress slider (on hover) */}
                      {progressFieldId && (
                        <div
                          className="absolute top-10 opacity-0 hover:opacity-100 transition-opacity z-20"
                          style={{ left: barStyle.left, width: barStyle.width }}
                        >
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => handleProgressChange(item.id, parseInt(e.target.value))}
                            className="w-full h-1 appearance-none bg-zinc-200 rounded cursor-pointer"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {!barStyle && (
                    <div className="absolute top-2 left-4 text-xs text-zinc-400 italic">
                      No dates set
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Small dropdown for selecting a date/number field */
function FieldSelector({
  label,
  fields,
  value,
  onChange,
  allowEmpty = false,
}: {
  label: string;
  fields: FieldDefinition[];
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-zinc-200 rounded-md px-2 py-1 bg-white text-zinc-700 outline-none focus:border-zinc-400"
      >
        {allowEmpty && <option value="">None</option>}
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
