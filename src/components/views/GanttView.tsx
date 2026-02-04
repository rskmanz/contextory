'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface GanttViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 40;

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper to parse date string
const parseDate = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

// Get days between two dates
const getDaysBetween = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

// Add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const GanttView: React.FC<GanttViewProps> = ({ context, isItemContext, itemId }) => {
  // Context functions
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);

  // Item functions
  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

  // Use appropriate functions based on mode
  const addNode = isItemContext && itemId
    ? (node: { content: string; parentId: string | null; metadata?: Record<string, unknown> }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null; metadata?: Record<string, unknown> }) => addContextNode(context.id, node);

  const updateNode = isItemContext && itemId
    ? (nodeId: string, updates: Partial<ContextNode>) => updateItemNode(itemId, nodeId, updates)
    : (nodeId: string, updates: Partial<ContextNode>) => updateContextNode(context.id, nodeId, updates);

  const deleteNode = isItemContext && itemId
    ? (nodeId: string) => deleteItemNode(itemId, nodeId)
    : (nodeId: string) => deleteContextNode(context.id, nodeId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [dragging, setDragging] = useState<{ nodeId: string; type: 'move' | 'resize-start' | 'resize-end'; startX: number; startDate: string; endDate: string } | null>(null);

  const nodes = context.data?.nodes || [];

  // Calculate date range
  const { startDate, endDate, today } = useMemo(() => {
    const now = new Date();
    const todayStr = formatDate(now);

    // Find min/max dates from nodes
    let minDate = now;
    let maxDate = addDays(now, 30);

    nodes.forEach(node => {
      if (node.metadata?.startDate) {
        const start = parseDate(node.metadata.startDate as string);
        if (start < minDate) minDate = start;
      }
      if (node.metadata?.endDate) {
        const end = parseDate(node.metadata.endDate as string);
        if (end > maxDate) maxDate = end;
      }
    });

    // Add padding
    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 14);

    return {
      startDate: minDate,
      endDate: maxDate,
      today: todayStr,
    };
  }, [nodes]);

  const totalDays = getDaysBetween(startDate, endDate);

  // Generate day headers
  const dayHeaders = useMemo(() => {
    const days: { date: Date; label: string; isToday: boolean; isWeekend: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      const dayOfWeek = date.getDay();
      days.push({
        date,
        label: date.getDate().toString(),
        isToday: formatDate(date) === today,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return days;
  }, [startDate, totalDays, today]);

  // Generate month headers
  const monthHeaders = useMemo(() => {
    const months: { label: string; days: number; startIndex: number }[] = [];
    let currentMonth = '';
    let currentCount = 0;
    let currentStart = 0;

    dayHeaders.forEach((day, index) => {
      const monthLabel = day.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthLabel !== currentMonth) {
        if (currentMonth) {
          months.push({ label: currentMonth, days: currentCount, startIndex: currentStart });
        }
        currentMonth = monthLabel;
        currentCount = 1;
        currentStart = index;
      } else {
        currentCount++;
      }
    });
    if (currentMonth) {
      months.push({ label: currentMonth, days: currentCount, startIndex: currentStart });
    }
    return months;
  }, [dayHeaders]);

  const handleAddTask = useCallback(async () => {
    const todayDate = formatDate(new Date());
    const nextWeek = formatDate(addDays(new Date(), 7));
    await addNode({
      content: 'New Task',
      parentId: null,
      metadata: {
        startDate: todayDate,
        endDate: nextWeek,
        progress: 0,
      },
    });
  }, [addNode]);

  const handleEditSubmit = useCallback(async () => {
    if (editingNodeId && editContent.trim()) {
      await updateNode(editingNodeId, { content: editContent.trim() });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editingNodeId, editContent, updateNode]);

  const handleDelete = useCallback(async (nodeId: string) => {
    await deleteNode(nodeId);
  }, [deleteNode]);

  const startEditing = (node: ContextNode) => {
    setEditingNodeId(node.id);
    setEditContent(node.content);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDragging({
      nodeId,
      type,
      startX: e.clientX,
      startDate: (node.metadata?.startDate as string) || formatDate(new Date()),
      endDate: (node.metadata?.endDate as string) || formatDate(addDays(new Date(), 7)),
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;

    const deltaX = e.clientX - dragging.startX;
    const deltaDays = Math.round(deltaX / DAY_WIDTH);

    if (deltaDays === 0) return;

    const node = nodes.find(n => n.id === dragging.nodeId);
    if (!node) return;

    let newStartDate = dragging.startDate;
    let newEndDate = dragging.endDate;

    if (dragging.type === 'move') {
      newStartDate = formatDate(addDays(parseDate(dragging.startDate), deltaDays));
      newEndDate = formatDate(addDays(parseDate(dragging.endDate), deltaDays));
    } else if (dragging.type === 'resize-start') {
      newStartDate = formatDate(addDays(parseDate(dragging.startDate), deltaDays));
      if (parseDate(newStartDate) >= parseDate(newEndDate)) {
        newStartDate = formatDate(addDays(parseDate(newEndDate), -1));
      }
    } else if (dragging.type === 'resize-end') {
      newEndDate = formatDate(addDays(parseDate(dragging.endDate), deltaDays));
      if (parseDate(newEndDate) <= parseDate(newStartDate)) {
        newEndDate = formatDate(addDays(parseDate(newStartDate), 1));
      }
    }

    updateNode(dragging.nodeId, {
      metadata: {
        ...node.metadata,
        startDate: newStartDate,
        endDate: newEndDate,
      },
    });
  }, [dragging, nodes, updateNode]);

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleProgressChange = async (nodeId: string, progress: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    await updateNode(nodeId, {
      metadata: {
        ...node.metadata,
        progress: Math.max(0, Math.min(100, progress)),
      },
    });
  };

  // Calculate bar position for a node
  const getBarStyle = (node: ContextNode) => {
    const nodeStartDate = node.metadata?.startDate ? parseDate(node.metadata.startDate as string) : new Date();
    const nodeEndDate = node.metadata?.endDate ? parseDate(node.metadata.endDate as string) : addDays(new Date(), 7);

    const startOffset = getDaysBetween(startDate, nodeStartDate);
    const duration = getDaysBetween(nodeStartDate, nodeEndDate) + 1;

    return {
      left: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH - 4,
    };
  };

  const getBarColor = (node: ContextNode) => {
    const progress = (node.metadata?.progress as number) || 0;
    if (progress === 100) return 'bg-green-500';
    if (progress > 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-zinc-400';
  };

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-4 py-2 flex items-center gap-2">
        <button
          onClick={handleAddTask}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Task
        </button>
        <div className="flex-1" />
        <span className="text-xs text-zinc-400">{nodes.length} tasks</span>
      </div>

      <div className="flex">
        {/* Left sidebar - Task names */}
        <div className="sticky left-0 z-10 bg-white border-r border-zinc-200 min-w-[200px]">
          {/* Header placeholder */}
          <div className="h-[60px] border-b border-zinc-200 bg-zinc-50 flex items-end px-3 pb-2">
            <span className="text-xs font-medium text-zinc-500">Task</span>
          </div>
          {/* Task rows */}
          {nodes.map((node) => {
            const isEditing = editingNodeId === node.id;
            return (
              <div
                key={node.id}
                className="h-10 border-b border-zinc-100 flex items-center px-3 group hover:bg-zinc-50"
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleEditSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit();
                      if (e.key === 'Escape') {
                        setEditingNodeId(null);
                        setEditContent('');
                      }
                    }}
                    className="flex-1 text-sm outline-none border-b border-blue-400 bg-transparent"
                    autoFocus
                  />
                ) : (
                  <>
                    <span
                      className="flex-1 text-sm truncate cursor-pointer hover:text-blue-600"
                      onDoubleClick={() => startEditing(node)}
                    >
                      {node.content}
                    </span>
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-1 transition-opacity"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })}
          {nodes.length === 0 && (
            <div className="h-20 flex items-center justify-center text-zinc-400 text-sm">
              No tasks yet
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
                  day.isToday ? 'bg-blue-100 text-blue-600 font-medium' : day.isWeekend ? 'bg-zinc-100 text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Task bars */}
          <div className="relative" style={{ width: totalDays * DAY_WIDTH }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {dayHeaders.map((day, i) => (
                <div
                  key={i}
                  style={{ width: DAY_WIDTH }}
                  className={`border-r border-zinc-100 ${day.isWeekend ? 'bg-zinc-50/50' : ''} ${day.isToday ? 'bg-blue-50/50' : ''}`}
                />
              ))}
            </div>

            {/* Today marker */}
            {dayHeaders.findIndex(d => d.isToday) >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                style={{ left: (dayHeaders.findIndex(d => d.isToday) + 0.5) * DAY_WIDTH }}
              />
            )}

            {/* Task rows */}
            {nodes.map((node) => {
              const barStyle = getBarStyle(node);
              const progress = (node.metadata?.progress as number) || 0;
              const barColor = getBarColor(node);

              return (
                <div
                  key={node.id}
                  className="relative"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Task bar */}
                  <div
                    className={`absolute top-1.5 h-7 ${barColor} rounded cursor-move group flex items-center`}
                    style={{ left: barStyle.left, width: barStyle.width }}
                    onMouseDown={(e) => handleMouseDown(e, node.id, 'move')}
                  >
                    {/* Resize handle - start */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, node.id, 'resize-start');
                      }}
                    />

                    {/* Progress fill */}
                    <div
                      className="absolute inset-0 bg-white/30 rounded-l"
                      style={{ width: `${progress}%` }}
                    />

                    {/* Progress text */}
                    <span className="relative z-10 text-xs text-white font-medium px-2 truncate">
                      {barStyle.width > 60 ? `${progress}%` : ''}
                    </span>

                    {/* Resize handle - end */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, node.id, 'resize-end');
                      }}
                    />
                  </div>

                  {/* Progress slider (on hover) */}
                  <div
                    className="absolute top-10 opacity-0 hover:opacity-100 transition-opacity z-20"
                    style={{ left: barStyle.left, width: barStyle.width }}
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => handleProgressChange(node.id, parseInt(e.target.value))}
                      className="w-full h-1 appearance-none bg-zinc-200 rounded cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
