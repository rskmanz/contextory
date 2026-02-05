'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface MarkdownViewProps {
  item: ObjectItem;
}

// Obsidian-style markdown to HTML converter (light theme)
const renderMarkdown = (md: string): string => {
  if (!md) return '';

  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-zinc-100 rounded-md p-4 my-4 overflow-x-auto"><code class="text-[13px] font-mono text-zinc-800 leading-relaxed">$2</code></pre>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-zinc-800 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-zinc-800 mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-zinc-900 mt-4 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Links - purple accent
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-violet-600 hover:text-violet-700 underline decoration-violet-300 hover:decoration-violet-500 transition-colors" target="_blank">$1</a>')
    // Task lists
    .replace(/^- \[x\] (.+)$/gm, '<li class="flex items-center gap-2 text-zinc-400 line-through"><span class="w-4 h-4 rounded border border-violet-500 bg-violet-500 flex items-center justify-center text-white text-[10px]">✓</span>$1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 text-zinc-700"><span class="w-4 h-4 rounded border-2 border-zinc-300"></span>$1</li>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="text-zinc-700">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="text-zinc-700 list-decimal">$1</li>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-zinc-100 rounded text-[13px] font-mono text-rose-600">$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-[3px] border-violet-400 pl-4 my-3 text-zinc-600 italic">$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-8 border-zinc-200" />')
    // Highlights ==text==
    .replace(/==(.+?)==/g, '<mark class="bg-yellow-200 text-zinc-900 px-0.5 rounded">$1</mark>')
    // Tags #tag
    .replace(/#(\w+)/g, '<span class="text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[12px]">#$1</span>')
    // Paragraphs
    .replace(/^(?!<[hlopb]|<li|<hr|<code|<pre|<mark|<span)(.+)$/gm, '<p class="text-zinc-700 mb-3 leading-[1.8]">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p class="[^"]*"><\/p>/g, '')
    // Wrap lists
    .replace(/(<li class="text-zinc-700">.*?<\/li>\n?)+/g, '<ul class="list-disc pl-5 my-3 space-y-1">$&</ul>')
    .replace(/(<li class="text-zinc-700 list-decimal">.*?<\/li>\n?)+/g, '<ol class="list-decimal pl-5 my-3 space-y-1">$&</ol>')
    // Wrap task lists
    .replace(/(<li class="flex items-center.*?<\/li>\n?)+/g, '<ul class="my-3 space-y-2">$&</ul>');
};

export const MarkdownView: React.FC<MarkdownViewProps> = ({ item }) => {
  const updateItem = useStore((state) => state.updateItem);

  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Load markdown when item changes
  useEffect(() => {
    if (item.markdownId) {
      setIsLoading(true);
      fetch(`/api/markdown?id=${item.markdownId}&type=items`)
        .then((res) => res.json())
        .then((data) => {
          setMarkdown(data.content || '');
          setIsEditing(!data.content);
        })
        .finally(() => setIsLoading(false));
    } else {
      setMarkdown('');
      setIsEditing(true);
    }
  }, [item.id, item.markdownId]);

  // Update word count
  useEffect(() => {
    const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [markdown]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const markdownId = item.markdownId || item.id;

      await fetch('/api/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: markdownId, type: 'items', content: markdown }),
      });

      if (!item.markdownId) {
        await updateItem(item.id, { markdownId });
      }

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [item.id, item.markdownId, markdown, updateItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
      // Toggle edit mode with Ctrl+E
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsEditing(!isEditing);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleSave]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-zinc-700 font-medium">{item.name}</span>
          {isSaving && (
            <span className="text-[11px] text-zinc-400">Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-zinc-400">{wordCount} words</span>
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsEditing(true)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                isEditing
                  ? 'text-zinc-900 bg-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                !isEditing
                  ? 'text-zinc-900 bg-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {isEditing ? (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Start writing..."
              className="w-full min-h-[80vh] text-[15px] text-zinc-800 bg-transparent outline-none resize-none leading-[1.8] placeholder:text-zinc-300"
              autoFocus
            />
          ) : markdown ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="text-zinc-300 cursor-text py-4 text-[15px]"
            >
              Start writing...
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span>Markdown</span>
          <span className="text-zinc-300">·</span>
          <span>{markdown.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-3">
          <span>⌘E edit</span>
          <span>⌘S save</span>
        </div>
      </div>
    </div>
  );
};
