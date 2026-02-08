'use client';

import React, { useState, useCallback } from 'react';
import { ObjectType, ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface ObjectListViewProps {
  object: ObjectType;
  items: ObjectItem[];
  workspaceId: string;
  onItemClick?: (itemId: string) => void;
}

export const ObjectListView: React.FC<ObjectListViewProps> = ({ object, items, workspaceId, onItemClick }) => {
  const addItem = useStore((state) => state.addItem);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const wsId = useStore((state) => state.projects.find(p => p.id === workspaceId)?.workspaceId || null);

  const [newItemName, setNewItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleOpen = useCallback((itemId: string) => {
    onItemClick?.(itemId);
  }, [onItemClick]);

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) return;
    await addItem({
      name: newItemName.trim(),
      objectId: object.id,
      projectId: workspaceId,
      workspaceId: wsId,
    });
    setNewItemName('');
    setIsAddingItem(false);
  }, [addItem, newItemName, object.id, workspaceId, wsId]);

  const startEdit = useCallback((item: ObjectItem) => {
    setEditingId(item.id);
    setEditName(item.name);
  }, []);

  const commitEdit = useCallback(async () => {
    if (editingId && editName.trim()) {
      await updateItem(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, updateItem]);

  return (
    <div className="py-2">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 rounded-md transition-colors"
          >
            <span className="text-zinc-300 text-sm">•</span>

            {editingId === item.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                }}
                className="flex-1 text-sm text-zinc-800 bg-transparent border-none outline-none caret-blue-500"
                autoFocus
              />
            ) : (
              <span
                className="text-sm text-zinc-800 truncate flex-1 cursor-text"
                onClick={() => startEdit(item)}
              >
                {item.name}
              </span>
            )}

            {/* Open button */}
            <button
              onClick={() => handleOpen(item.id)}
              className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-xs text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
              title="Open"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>

            {/* Delete button */}
            <button
              onClick={() => deleteItem(item.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all text-xs"
              title="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* Add item */}
      <div className="mt-1 px-3">
        {isAddingItem ? (
          <div className="flex items-center gap-2 py-1">
            <span className="text-zinc-300 text-sm">•</span>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={() => {
                if (newItemName.trim()) handleAddItem();
                else setIsAddingItem(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') { setIsAddingItem(false); setNewItemName(''); }
              }}
              placeholder="Item name..."
              className="flex-1 px-2 py-0.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-sm text-zinc-400 hover:text-zinc-600 py-1 transition-colors"
          >
            + New item
          </button>
        )}
      </div>

      {items.length === 0 && !isAddingItem && (
        <div className="text-center py-8 text-zinc-400">
          <p className="text-sm mb-1">No items yet</p>
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
