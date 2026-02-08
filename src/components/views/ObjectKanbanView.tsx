'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ObjectType, ObjectItem, FieldDefinition, SelectOption, FieldValue } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';

interface ObjectKanbanViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
  onItemClick?: (itemId: string) => void;
}

const UNSET_COLUMN = '__unset__';

export const ObjectKanbanView: React.FC<ObjectKanbanViewProps> = ({
  object,
  items,
  workspaceId,
  onItemClick,
}) => {
  const addItem = useStore((state) => state.addItem);
  const updateItemFieldValue = useStore((state) => state.updateItemFieldValue);
  const deleteItem = useStore((state) => state.deleteItem);
  const addObjectField = useStore((state) => state.addObjectField);
  const wsId = useStore((state) => state.projects.find(p => p.id === workspaceId)?.workspaceId || null);

  // Find select fields that can be used for grouping
  const selectFields = useMemo(
    () => (object.fields || []).filter((f) => f.type === 'select'),
    [object.fields]
  );

  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    () => selectFields[0]?.id || ''
  );
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const selectedField = useMemo(
    () => selectFields.find((f) => f.id === selectedFieldId),
    [selectFields, selectedFieldId]
  );

  // Build columns from the selected field's options + an "Unset" column
  const columns: Array<{ id: string; label: string; color?: string }> = useMemo(() => {
    if (!selectedField) return [{ id: UNSET_COLUMN, label: 'All Items' }];
    const opts = (selectedField.options || []).map((opt) => ({
      id: opt.id,
      label: opt.label,
      color: opt.color,
    }));
    return [...opts, { id: UNSET_COLUMN, label: 'Unset' }];
  }, [selectedField]);

  // Group items by the selected field value
  const itemsByColumn = useMemo(() => {
    const grouped: Record<string, ObjectItem[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = [];
    });

    items.forEach((item) => {
      const val = item.fieldValues?.[selectedFieldId];
      // val could be the option id or the option label
      const matchedCol = columns.find(
        (c) => c.id !== UNSET_COLUMN && (c.id === val || c.label === val)
      );
      if (matchedCol) {
        grouped[matchedCol.id] = [...(grouped[matchedCol.id] || []), item];
      } else {
        grouped[UNSET_COLUMN] = [...(grouped[UNSET_COLUMN] || []), item];
      }
    });

    return grouped;
  }, [items, columns, selectedFieldId]);

  // Preview fields (non-selected fields to show on cards, max 3)
  const previewFields = useMemo(
    () => (object.fields || []).filter((f) => f.id !== selectedFieldId).slice(0, 3),
    [object.fields, selectedFieldId]
  );

  // Drag & drop handlers
  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItemId(itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (columnId: string) => {
      if (!draggedItemId || !selectedFieldId) return;
      const newValue = columnId === UNSET_COLUMN ? null : columnId;
      await updateItemFieldValue(draggedItemId, selectedFieldId, newValue as FieldValue);
      setDraggedItemId(null);
    },
    [draggedItemId, selectedFieldId, updateItemFieldValue]
  );

  const handleAddItem = useCallback(
    async (columnId: string) => {
      const fieldValues: Record<string, FieldValue> =
        columnId !== UNSET_COLUMN ? { [selectedFieldId]: columnId } : {};
      await addItem({
        name: 'New item',
        objectId: object.id,
        projectId: workspaceId,
        workspaceId: wsId,
        fieldValues,
      });
    },
    [addItem, object.id, workspaceId, wsId, selectedFieldId]
  );

  const handleDeleteItem = useCallback(
    async (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      await deleteItem(itemId);
    },
    [deleteItem]
  );

  const handleCreateStatusField = useCallback(async () => {
    const fieldId = generateId();
    const field: FieldDefinition = {
      id: fieldId,
      name: 'Status',
      type: 'select',
      options: [
        { id: generateId(), label: 'To Do', color: '#94a3b8' },
        { id: generateId(), label: 'In Progress', color: '#3b82f6' },
        { id: generateId(), label: 'Done', color: '#22c55e' },
      ],
    };
    await addObjectField(object.id, field);
    setSelectedFieldId(fieldId);
  }, [addObjectField, object.id]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar: field selector or create prompt */}
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 px-4 py-2 flex items-center gap-3">
        {selectFields.length > 0 ? (
          <>
            <label className="text-xs text-zinc-500">Group by</label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md px-2 py-1 bg-white text-zinc-700 outline-none focus:border-zinc-400"
            >
              {selectFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <button
            onClick={handleCreateStatusField}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            + Create Status field
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-zinc-400">{items.length} items</span>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const columnItems = itemsByColumn[column.id] || [];
            return (
              <div
                key={column.id}
                className="w-72 flex-shrink-0 bg-zinc-50 rounded-xl p-3 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    {column.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                    )}
                    <h3 className="font-semibold text-sm text-zinc-700">{column.label}</h3>
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">
                    {columnItems.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {columnItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item.id)}
                      onClick={() => onItemClick?.(item.id)}
                      className={`group bg-white rounded-lg p-3 shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                        draggedItemId === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-zinc-800 flex-1 truncate">
                          {item.name}
                        </span>
                        <button
                          className="w-5 h-5 flex items-center justify-center text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          title="Delete item"
                        >
                          &times;
                        </button>
                      </div>
                      {/* Preview fields */}
                      {previewFields.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {previewFields.map((field) => {
                            const val = item.fieldValues?.[field.id];
                            if (val == null || val === '') return null;
                            return (
                              <FieldPreview key={field.id} field={field} value={val} />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add item button */}
                <button
                  onClick={() => handleAddItem(column.id)}
                  className="mt-2 w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  + Add item
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Compact read-only preview of a field value on a kanban card */
function FieldPreview({ field, value }: { field: FieldDefinition; value: FieldValue }) {
  const displayValue = (() => {
    if (field.type === 'checkbox') return value ? '✓' : '✗';
    if (field.type === 'select') {
      const opt = field.options?.find((o) => o.id === value || o.label === value);
      return opt?.label ?? String(value);
    }
    if (field.type === 'multiSelect' && Array.isArray(value)) {
      return value
        .map((v) => {
          const opt = field.options?.find((o) => o.id === v || o.label === v);
          return opt?.label ?? v;
        })
        .join(', ');
    }
    return String(value);
  })();

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
      <span className="text-zinc-400 truncate max-w-[60px]">{field.name}:</span>
      <span className="truncate">{displayValue}</span>
    </div>
  );
}
