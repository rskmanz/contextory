'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ObjectItem } from '@/types';
import { useStore } from '@/lib/store';
import { TiptapEditor } from '@/components/editor';

interface MarkdownViewProps {
  item: ObjectItem;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ item }) => {
  const updateItem = useStore((state) => state.updateItem);

  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Load markdown when item changes
  useEffect(() => {
    if (item.markdownId) {
      setIsLoading(true);
      fetch(`/api/markdown?id=${item.markdownId}&type=items`)
        .then((res) => res.json())
        .then((data) => {
          setContent(data.content || '');
        })
        .finally(() => setIsLoading(false));
    } else {
      setContent('');
    }
  }, [item.id, item.markdownId]);

  // Update word count when content changes
  useEffect(() => {
    // Strip HTML tags for word counting
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  const handleSave = useCallback(
    async (html?: string) => {
      const toSave = html !== undefined ? html : content;
      setIsSaving(true);
      try {
        const markdownId = item.markdownId || item.id;

        await fetch('/api/markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: markdownId, type: 'items', content: toSave }),
        });

        if (!item.markdownId) {
          await updateItem(item.id, { markdownId });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [item.id, item.markdownId, content, updateItem]
  );

  const handleChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  const handleBlur = useCallback(
    (html: string) => {
      handleSave(html);
    },
    [handleSave]
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <span className="text-zinc-300 animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full bg-white">
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl text-zinc-800 mb-1">{item.name}</h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>{wordCount} words</span>
              {isSaving && <span className="text-zinc-500">Saving...</span>}
              <div className="flex-1" />
              <button
                onClick={() => handleSave()}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Tiptap Editor */}
          <TiptapEditor
            content={content}
            onChange={handleChange}
            onBlur={handleBlur}
            onSave={() => handleSave()}
            placeholder="Start writing... Use the toolbar above for formatting."
          />
        </div>
      </div>
    </div>
  );
};
