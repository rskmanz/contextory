'use client';

import React, { useState, useCallback } from 'react';
import { ObjectType, ObjectItem } from '@/types';
import { useStore } from '@/lib/store';
import { CopyItemModal } from '@/components/modals/CopyItemModal';

interface ObjectGridViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
  onItemClick?: (itemId: string) => void;
}

export const ObjectGridView: React.FC<ObjectGridViewProps> = ({ object, items, workspaceId, onItemClick }) => {
  const addItem = useStore((state) => state.addItem);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [copyingItem, setCopyingItem] = useState<ObjectItem | null>(null);

  const handleAddItem = useCallback(async () => {
    const id = await addItem({
      name: 'New item',
      objectId: object.id,
      projectId: workspaceId,
    });
    onItemClick?.(id);
  }, [addItem, object.id, workspaceId, onItemClick]);

  const handleItemClick = useCallback((itemId: string) => {
    onItemClick?.(itemId);
  }, [onItemClick]);

  const handleDoubleClick = useCallback((item: ObjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const requestDeleteItem = useCallback((itemId: string) => {
    setDeletingItemId(itemId);
  }, []);

  const confirmDeleteItem = useCallback(
    async (itemId: string) => {
      await deleteItem(itemId);
      setDeletingItemId(null);
    },
    [deleteItem]
  );

  const cancelDeleteItem = useCallback(() => {
    setDeletingItemId(null);
  }, []);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md hover:border-zinc-300 cursor-pointer transition-all"
            onClick={() => handleItemClick(item.id)}
            onDoubleClick={(e) => handleDoubleClick(item, e)}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">{object.icon}</span>
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
                  className="w-full px-2 py-1 text-sm text-center border border-blue-400 rounded outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm text-zinc-700 text-center truncate w-full">{item.name}</span>
              )}
            </div>
            {/* Action buttons */}
            {deletingItemId === item.id ? (
              <div className="absolute top-1 right-1 flex items-center gap-1 bg-white rounded-lg shadow-sm border border-zinc-200 px-2 py-1">
                <span className="text-xs text-zinc-600">Delete?</span>
                <button
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeleteItem(item.id);
                  }}
                >
                  Yes
                </button>
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelDeleteItem();
                  }}
                >
                  No
                </button>
              </div>
            ) : (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCopyingItem(item);
                  }}
                  title="Copy to..."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                </button>
                <button
                  className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDeleteItem(item.id);
                  }}
                  title="Delete"
                >
                  x
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add item card */}
        <button
          onClick={handleAddItem}
          className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:bg-zinc-100 transition-all flex flex-col items-center justify-center gap-2 min-h-[100px]"
        >
          <span className="text-2xl text-zinc-400">+</span>
          <span className="text-sm text-zinc-500">Add item</span>
        </button>
      </div>

      {/* Copy Item Modal */}
      <CopyItemModal
        isOpen={!!copyingItem}
        onClose={() => setCopyingItem(null)}
        item={copyingItem}
      />
    </div>
  );
};
