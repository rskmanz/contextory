'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { TiptapEditor } from './TiptapEditor';
import { SmartPanel } from '@/components/extraction/SmartPanel';

interface SmartEditorProps {
  markdownId?: string;
  entityId: string;
  markdownType: 'items' | 'contexts';
  onMarkdownIdCreated?: (id: string) => void;
  workspaceId: string;
  projectId?: string;
  minimal?: boolean;
  compact?: boolean;
  placeholder?: string;
  showWordCount?: boolean;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
}

export const SmartEditor: React.FC<SmartEditorProps> = ({
  markdownId,
  entityId,
  markdownType,
  onMarkdownIdCreated,
  workspaceId,
  projectId,
  minimal = false,
  compact = false,
  placeholder = 'Start writing...',
  showWordCount = false,
  title,
  onTitleChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title || '');
  const [content, setContent] = useState('');

  // Sync editTitle when title prop changes (e.g. navigating items)
  useEffect(() => {
    setEditTitle(title || '');
    setIsEditingTitle(false);
  }, [title]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef('');
  const markdownIdCreatedRef = useRef(false);

  // Load markdown on mount / when ID changes
  useEffect(() => {
    markdownIdCreatedRef.current = false;
    if (markdownId) {
      setIsLoading(true);
      fetch(`/api/markdown?id=${markdownId}&type=${markdownType}`)
        .then((res) => res.json())
        .then((data) => {
          const md = data.data?.content || data.content || '';
          setContent(md);
          latestContentRef.current = md;
        })
        .catch(() => {
          setContent('');
          latestContentRef.current = '';
        })
        .finally(() => setIsLoading(false));
    } else {
      setContent('');
      latestContentRef.current = '';
    }
  }, [entityId, markdownId, markdownType]);

  // Word count
  useEffect(() => {
    if (!showWordCount) return;
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [content, showWordCount]);

  // Debounced save
  const saveContent = useCallback(
    (html: string) => {
      latestContentRef.current = html;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      setIsSaving(true);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const id = markdownId || entityId;
          const response = await fetch('/api/markdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type: markdownType, content: latestContentRef.current }),
          });

          if (!response.ok) {
            console.error('Markdown save failed:', response.status, await response.text());
            return;
          }

          if (!markdownId && !markdownIdCreatedRef.current) {
            markdownIdCreatedRef.current = true;
            onMarkdownIdCreated?.(id);
          }
        } finally {
          setIsSaving(false);
        }
      }, 800);
    },
    [entityId, markdownId, markdownType, onMarkdownIdCreated]
  );

  const handleChange = useCallback(
    (html: string) => {
      setContent(html);
      saveContent(html);
    },
    [saveContent]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Toolbar extract button toggles the panel open
  const handleExtract = useCallback(() => {
    setPanelOpen(true);
  }, []);

  if (isLoading) {
    return <p className="text-xs text-zinc-400 animate-pulse py-2">Loading...</p>;
  }

  return (
    <div className="flex h-full w-full relative">
      <div className="flex-1 overflow-auto min-w-0">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {title && (
            <div className="mb-8">
              {isEditingTitle && onTitleChange ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => {
                    const trimmed = editTitle.trim();
                    if (trimmed && trimmed !== title) onTitleChange(trimmed);
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = editTitle.trim();
                      if (trimmed && trimmed !== title) onTitleChange(trimmed);
                      setIsEditingTitle(false);
                    }
                    if (e.key === 'Escape') {
                      setEditTitle(title || '');
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-xl text-zinc-800 mb-1 w-full bg-transparent border-b border-blue-400 outline-none py-0.5"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-xl text-zinc-800 mb-1 cursor-text hover:bg-zinc-50 rounded px-1 -mx-1 transition-colors"
                  onClick={() => {
                    if (onTitleChange) {
                      setEditTitle(title || '');
                      setIsEditingTitle(true);
                    }
                  }}
                >
                  {title}
                </h1>
              )}
            </div>
          )}
          {showWordCount && (
            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-1">
              <span>{wordCount} words</span>
              {isSaving && <span className="text-zinc-500">Saving...</span>}
            </div>
          )}
          <TiptapEditor
            content={content}
            onChange={handleChange}
            onExtract={handleExtract}
            onToggleSmartPanel={() => setPanelOpen((v) => !v)}
            isSmartPanelOpen={panelOpen}
            minimal={minimal}
            compact={compact}
            placeholder={placeholder}
          />
        </div>
      </div>
      <SmartPanel
        content={content}
        workspaceId={workspaceId}
        projectId={projectId}
        isOpen={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
      />
    </div>
  );
};
