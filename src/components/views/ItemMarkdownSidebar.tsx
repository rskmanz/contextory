'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface ItemMarkdownSidebarProps {
  item: ObjectItem;
  isOpen: boolean;
  onClose: () => void;
}

// Simple markdown to HTML converter
const renderMarkdown = (md: string): string => {
  if (!md) return '';

  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-zinc-800 mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-zinc-800 mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-zinc-900 mt-4 mb-2">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-zinc-600">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-sm text-zinc-600">$1</li>')
    // Code
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-zinc-100 rounded text-xs font-mono">$1</code>')
    // Paragraphs
    .replace(/^(?!<[hl]|<li)(.+)$/gm, '<p class="text-sm text-zinc-600 mb-2">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p class="[^"]*"><\/p>/g, '');
};

export const ItemMarkdownSidebar: React.FC<ItemMarkdownSidebarProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const updateItem = useStore((state) => state.updateItem);

  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load markdown when sidebar opens
  useEffect(() => {
    if (isOpen && item.markdownId) {
      setIsLoading(true);
      fetch(`/api/markdown?id=${item.markdownId}&type=items`)
        .then((res) => res.json())
        .then((data) => setMarkdown(data.content || ''))
        .finally(() => setIsLoading(false));
    } else if (isOpen && !item.markdownId) {
      setMarkdown('');
    }
  }, [isOpen, item.id, item.markdownId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const markdownId = item.markdownId || item.id;

      // Save markdown file
      await fetch('/api/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: markdownId, type: 'items', content: markdown }),
      });

      // Update item with markdownId if not already set
      if (!item.markdownId) {
        await updateItem(item.id, { markdownId });
      }

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [item.id, item.markdownId, markdown, updateItem]);

  if (!isOpen) return null;

  return (
    <div className="w-80 border-r border-zinc-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-200">
        <h3 className="text-sm font-medium text-zinc-700">Notes</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs px-2 py-1 rounded ${
              isEditing ? 'bg-blue-100 text-blue-700' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : isEditing ? (
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Notes&#10;&#10;Add notes in markdown format...&#10;&#10;- Use bullet points&#10;- **Bold** and *italic*&#10;- [Links](url)"
            className="w-full h-full min-h-[300px] p-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 resize-none font-mono"
          />
        ) : markdown ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-400 mb-2">No notes yet</p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-500 hover:underline"
            >
              Add notes
            </button>
          </div>
        )}
      </div>

      {/* Footer - only show in edit mode */}
      {isEditing && (
        <div className="p-3 border-t border-zinc-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
};
