'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Context, VIEW_STYLES, ViewStyle } from '@/types';

interface EditContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: Context | null;
}

const ICON_OPTIONS = ['📝', '📊', '🎯', '💡', '🔧', '📁', '🗂️', '📌', '🏷️', '⭐'];

export const EditContextModal: React.FC<EditContextModalProps> = ({
  isOpen,
  onClose,
  context,
}) => {
  const updateContext = useStore((state) => state.updateContext);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [viewStyle, setViewStyle] = useState<ViewStyle>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (context) {
      setName(context.name);
      setIcon(context.icon);
      setViewStyle(context.viewStyle);
    }
  }, [context]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context || !name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateContext(context.id, {
        name: name.trim(),
        icon,
        viewStyle,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !context) return null;

  const availableStyles = VIEW_STYLES[context.type] as readonly string[];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
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

          {/* View Style (only if multiple styles available) */}
          {availableStyles.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                View Style
              </label>
              <div className="flex gap-2">
                {availableStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setViewStyle(style as ViewStyle)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 capitalize transition-colors ${
                      viewStyle === style
                        ? 'border-zinc-900 bg-zinc-100'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type display (read-only) */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
            <div className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg capitalize">
              {context.type}
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
