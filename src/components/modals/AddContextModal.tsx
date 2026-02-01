'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { CONTEXT_TYPES, ContextType, DEFAULT_VIEW_STYLE } from '@/types';

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const TYPE_INFO: Record<ContextType, { label: string; icon: string; description: string }> = {
  tree: { label: 'Tree', icon: '🌳', description: 'Unlimited nested hierarchy' },
  board: { label: 'Board', icon: '📋', description: 'Groups and cards with flow' },
  canvas: { label: 'Canvas', icon: '🎨', description: 'Free-form positioning' },
};

const ICON_OPTIONS = ['📝', '📊', '🎯', '💡', '🔧', '📁', '🗂️', '📌', '🏷️', '⭐'];

export const AddContextModal: React.FC<AddContextModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
}) => {
  const addContext = useStore((state) => state.addContext);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [type, setType] = useState<ContextType>('tree');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addContext({
        name: name.trim(),
        icon,
        type,
        viewStyle: DEFAULT_VIEW_STYLE[type],
        workspaceId,
        data: { nodes: [], edges: [] },
      });
      setName('');
      setIcon('📝');
      setType('tree');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">New Context</h2>

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

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Type</label>
            <div className="space-y-2">
              {CONTEXT_TYPES.map((t) => {
                const info = TYPE_INFO[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                      type === t
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div className="font-medium text-zinc-900">{info.label}</div>
                      <div className="text-xs text-zinc-500">{info.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
