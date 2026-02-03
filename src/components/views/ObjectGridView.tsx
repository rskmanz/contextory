'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ObjectType, ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface ObjectGridViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
  onItemClick?: (itemId: string) => void;
}

export const ObjectGridView: React.FC<ObjectGridViewProps> = ({ object, items, workspaceId, onItemClick }) => {
  const router = useRouter();
  const params = useParams();
  const { project, subproject } = params as { project: string; subproject: string };

  const addItem = useStore((state) => state.addItem);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const handleAddItem = useCallback(async () => {
    const id = await addItem({
      name: 'New item',
      objectId: object.id,
      workspaceId: object.workspaceId ?? workspaceId,
    });
    // Navigate to the new item
    router.push(`/${project}/${subproject}/item/${id}`);
  }, [addItem, object.id, object.workspaceId, workspaceId, router, project, subproject]);

  const handleItemClick = useCallback((itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    } else {
      router.push(`/${project}/${subproject}/item/${itemId}`);
    }
  }, [router, project, subproject, onItemClick]);

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
            {/* Delete confirmation or button */}
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
              <button
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  requestDeleteItem(item.id);
                }}
              >
                x
              </button>
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
    </div>
  );
};
