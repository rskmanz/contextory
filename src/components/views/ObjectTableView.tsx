'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ObjectType, ObjectItem, FieldDefinition, FieldType, FIELD_TYPES, FieldValue } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { FieldValueCell } from '@/components/fields';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text', number: 'Number', date: 'Date', checkbox: 'Checkbox',
  select: 'Select', multiSelect: 'Multi-select', url: 'URL', relation: 'Relation',
};

interface ObjectTableViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
  onItemClick?: (itemId: string) => void;
}

type SortDirection = 'asc' | 'desc';
interface SortState {
  columnId: string; // 'name' or field id
  direction: SortDirection;
}

export const ObjectTableView: React.FC<ObjectTableViewProps> = ({ object, items, workspaceId, onItemClick }) => {
  const router = useRouter();
  const params = useParams();
  const { workspace, project } = params as { workspace: string; project: string };

  const addItem = useStore((state) => state.addItem);
  const updateItem = useStore((state) => state.updateItem);
  const updateItemFieldValue = useStore((state) => state.updateItemFieldValue);
  const deleteItem = useStore((state) => state.deleteItem);
  const addObjectField = useStore((state) => state.addObjectField);

  const [sort, setSort] = useState<SortState | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');

  const fields: FieldDefinition[] = object.fields || [];

  const sortedItems = useMemo(() => {
    if (!sort) return items;

    return [...items].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (sort.columnId === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a.fieldValues?.[sort.columnId] ?? null;
        bVal = b.fieldValues?.[sort.columnId] ?? null;
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [items, sort]);

  const handleSort = useCallback((columnId: string) => {
    setSort((prev) => {
      if (prev?.columnId === columnId) {
        return prev.direction === 'asc'
          ? { columnId, direction: 'desc' }
          : null;
      }
      return { columnId, direction: 'asc' };
    });
  }, []);

  const handleItemClick = useCallback((itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    } else {
      router.push(`/${workspace}/${project}/item/${itemId}`);
    }
  }, [router, workspace, project, onItemClick]);

  const handleNameDoubleClick = useCallback((item: ObjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(item.id);
    setEditName(item.name);
  }, []);

  const commitNameEdit = useCallback(async () => {
    if (editingNameId && editName.trim()) {
      await updateItem(editingNameId, { name: editName.trim() });
    }
    setEditingNameId(null);
    setEditName('');
  }, [editingNameId, editName, updateItem]);

  const handleFieldChange = useCallback(async (itemId: string, fieldId: string, value: FieldValue) => {
    await updateItemFieldValue(itemId, fieldId, value);
  }, [updateItemFieldValue]);

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) return;
    const id = await addItem({
      name: newItemName.trim(),
      objectId: object.id,
      projectId: workspaceId,
    });
    setNewItemName('');
    setIsAddingItem(false);
  }, [addItem, newItemName, object.id, workspaceId]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    await deleteItem(itemId);
  }, [deleteItem]);

  const sortIcon = (columnId: string) => {
    if (sort?.columnId !== columnId) return null;
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
            {/* Row number */}
            <th className="w-10 px-2 py-2 text-[10px] font-medium text-zinc-400 text-center border-r border-zinc-200">
              #
            </th>
            {/* Name column - always first */}
            <th
              className="px-3 py-2 text-left text-xs font-medium text-zinc-600 border-r border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors min-w-[180px]"
              onClick={() => handleSort('name')}
            >
              Name{sortIcon('name')}
            </th>
            {/* Field columns */}
            {fields.map((field) => (
              <th
                key={field.id}
                className="px-3 py-2 text-left text-xs font-medium text-zinc-600 border-r border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors min-w-[120px]"
                onClick={() => handleSort(field.id)}
              >
                {field.name}{sortIcon(field.id)}
              </th>
            ))}
            {/* Add field column */}
            <th className="w-10 px-2 py-2 border-r border-zinc-200">
              {isAddingField ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFieldName.trim()) {
                        addObjectField(object.id, { id: generateId(), name: newFieldName.trim(), type: newFieldType });
                        setNewFieldName('');
                        setNewFieldType('text');
                        setIsAddingField(false);
                      }
                      if (e.key === 'Escape') {
                        setIsAddingField(false);
                        setNewFieldName('');
                      }
                    }}
                    placeholder="Field name"
                    className="w-24 px-1.5 py-0.5 text-xs border border-zinc-300 rounded outline-none focus:border-blue-400"
                    autoFocus
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                    className="px-1 py-0.5 text-xs border border-zinc-300 rounded outline-none"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (newFieldName.trim()) {
                        addObjectField(object.id, { id: generateId(), name: newFieldName.trim(), type: newFieldType });
                        setNewFieldName('');
                        setNewFieldType('text');
                      }
                      setIsAddingField(false);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingField(true)}
                  className="w-full text-zinc-400 hover:text-zinc-600 transition-colors text-sm font-medium"
                  title="Add property"
                >
                  +
                </button>
              )}
            </th>
            {/* Actions column */}
            <th className="w-10 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, idx) => (
            <tr
              key={item.id}
              className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors group"
            >
              {/* Row number */}
              <td className="px-2 py-1.5 text-[10px] text-zinc-400 text-center border-r border-zinc-100">
                {idx + 1}
              </td>
              {/* Name cell */}
              <td className="border-r border-zinc-100">
                {editingNameId === item.id ? (
                  <div className="px-2 py-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitNameEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitNameEdit();
                        if (e.key === 'Escape') {
                          setEditingNameId(null);
                          setEditName('');
                        }
                      }}
                      className="w-full px-1 py-0.5 text-sm border border-blue-400 rounded outline-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    className="px-3 py-1.5 text-sm text-zinc-800 cursor-pointer hover:text-blue-600 truncate"
                    onClick={() => handleItemClick(item.id)}
                    onDoubleClick={(e) => handleNameDoubleClick(item, e)}
                  >
                    <span className="mr-1.5">{object.icon}</span>
                    {item.name}
                  </div>
                )}
              </td>
              {/* Field cells */}
              {fields.map((field) => (
                <td key={field.id} className="border-r border-zinc-100">
                  <FieldValueCell
                    field={field}
                    value={item.fieldValues?.[field.id] ?? null}
                    onChange={(val) => handleFieldChange(item.id, field.id, val)}
                    compact
                  />
                </td>
              ))}
              {/* Add field spacer */}
              <td className="border-r border-zinc-100" />
              {/* Actions */}
              <td className="px-1">
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all"
                  title="Delete"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}

          {/* Add item row */}
          <tr className="border-b border-zinc-100">
            <td className="px-2 py-1.5 text-center border-r border-zinc-100">
              <span className="text-zinc-300 text-[10px]">+</span>
            </td>
            <td colSpan={fields.length + 3}>
              {isAddingItem ? (
                <div className="px-2 py-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={() => {
                      if (newItemName.trim()) {
                        handleAddItem();
                      } else {
                        setIsAddingItem(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddItem();
                      if (e.key === 'Escape') {
                        setIsAddingItem(false);
                        setNewItemName('');
                      }
                    }}
                    placeholder="Item name..."
                    className="flex-1 px-2 py-1 text-sm border border-zinc-300 rounded outline-none focus:border-blue-400"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="w-full px-3 py-1.5 text-left text-sm text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  + New item
                </button>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Empty state */}
      {items.length === 0 && !isAddingItem && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <p className="text-sm mb-2">No items yet</p>
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-sm text-blue-500 hover:underline"
          >
            Add your first item
          </button>
        </div>
      )}
    </div>
  );
};
