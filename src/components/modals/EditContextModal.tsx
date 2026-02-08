'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Context, ObjectType } from '@/types';

interface EditContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: Context | null;
  objects?: ObjectType[];
}

const ICON_OPTIONS = ['📝', '📊', '🎯', '💡', '🔧', '📁', '🗂️', '📌', '🏷️', '⭐'];

export const EditContextModal: React.FC<EditContextModalProps> = ({
  isOpen,
  onClose,
  context,
  objects = [],
}) => {
  const updateContext = useStore((state) => state.updateContext);
  const syncObjectsToContext = useStore((state) => state.syncObjectsToContext);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [showObjectPicker, setShowObjectPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (context) {
      setName(context.name);
      setIcon(context.icon);
      setSelectedObjectIds(context.objectIds || []);
    }
  }, [context]);

  const toggleObject = (objectId: string) => {
    setSelectedObjectIds((prev) =>
      prev.includes(objectId)
        ? prev.filter((id) => id !== objectId)
        : [...prev, objectId]
    );
  };

  const handleSync = async () => {
    if (!context || isSyncing) return;
    setIsSyncing(true);
    try {
      // Save objectIds first, then sync
      await updateContext(context.id, { objectIds: selectedObjectIds });
      await syncObjectsToContext(context.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context || !name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateContext(context.id, {
        name: name.trim(),
        icon,
        objectIds: selectedObjectIds,
      });

      // Auto-sync if objectIds changed
      const prevIds = context.objectIds || [];
      const changed = selectedObjectIds.length !== prevIds.length ||
        selectedObjectIds.some((id) => !prevIds.includes(id));
      if (changed && selectedObjectIds.length > 0) {
        await syncObjectsToContext(context.id);
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !context) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Edit Context</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Context name"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500"
              autoFocus
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-colors ${
                    icon === opt ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* View style (read-only) */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">View</label>
            <div className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg capitalize text-sm">
              {context.viewStyle || 'Not set'} ({context.type})
            </div>
          </div>

          {/* Linked Objects */}
          {objects.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowObjectPicker(!showObjectPicker)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showObjectPicker ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Linked Objects
                {selectedObjectIds.length > 0 && (
                  <span className="text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                    {selectedObjectIds.length}
                  </span>
                )}
              </button>

              {showObjectPicker && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border border-zinc-200 rounded-lg p-2">
                  {objects.map((obj) => (
                    <label
                      key={obj.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedObjectIds.includes(obj.id)}
                        onChange={() => toggleObject(obj.id)}
                        className="rounded border-zinc-300"
                      />
                      <span className="text-base">{obj.icon}</span>
                      <span className="text-sm text-zinc-700">{obj.name}</span>
                    </label>
                  ))}

                  {selectedObjectIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="mt-1 w-full py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
