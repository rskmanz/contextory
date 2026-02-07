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
}) => {
  const [content, setContent] = useState('');
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
          await fetch('/api/markdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type: markdownType, content: latestContentRef.current }),
          });

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
      <SmartPanel
        content={content}
        workspaceId={workspaceId}
        projectId={projectId}
        isOpen={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
      />
      <div className="flex-1 overflow-auto min-w-0">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {title && (
            <div className="mb-8">
              <h1 className="text-xl text-zinc-800 mb-1">{title}</h1>
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
            minimal={minimal}
            compact={compact}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
};
