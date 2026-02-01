'use client';

import React, { useState, useCallback } from 'react';
import { ObjectType, ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface ObjectGridViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
}

export const ObjectGridView: React.FC<ObjectGridViewProps> = ({ object, items, workspaceId }) => {
  const addItem = useStore((state) => state.addItem);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleAddItem = useCallback(async () => {
    await addItem({
      name: 'New item',
      objectId: object.id,
      workspaceId,
    });
  }, [addItem, object.id, workspaceId]);

  const handleDoubleClick = useCallback((item: ObjectItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (editingItemId && editName.trim()) {
      await updateItem(editingItemId, { name: editName.trim() });
    }
    setEditingItemId(null);
    setEditName('');
  }, [editingItemId, editName, updateItem]);

  const handleDelete = useCallback(
    async (itemId: string) => {
      await deleteItem(itemId);
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    },
    [deleteItem, selectedItemId]
  );

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{object.icon}</span>
          <h2 className="text-xl font-semibold text-zinc-800">{object.name}</h2>
          <span className="text-sm text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {items.length} items
          </span>
        </div>
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
        >
          + Add {object.name.slice(0, -1) || 'Item'}
        </button>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <span className="text-4xl mb-4">{object.icon}</span>
          <p className="mb-4">No {object.name.toLowerCase()} yet</p>
          <button
            onClick={handleAddItem}
            className="text-sm text-blue-500 hover:underline"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedItemId === item.id
                  ? 'border-blue-400 shadow-md'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
              onClick={() => setSelectedItemId(item.id)}
              onDoubleClick={() => handleDoubleClick(item)}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-xl mb-3">
                {object.icon}
              </div>

              {/* Name */}
              {editingItemId === item.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleEditSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') {
                      setEditingItemId(null);
                      setEditName('');
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-blue-400 rounded outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm font-medium text-zinc-800 truncate">{item.name}</p>
              )}

              {/* Delete button */}
              <button
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Item Details Panel */}
      {selectedItemId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{object.icon}</span>
                <span className="font-medium text-zinc-800">
                  {items.find((i) => i.id === selectedItemId)?.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedItemId(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
