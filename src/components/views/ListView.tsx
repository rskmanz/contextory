'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Context } from '@/types';
import { useStore } from '@/lib/store';
import { TiptapEditor } from '@/components/editor';

interface ListViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

export const ListView: React.FC<ListViewProps> = ({ context, isItemContext, itemId }) => {
  const updateContext = useStore((state) => state.updateContext);
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef('');

  // Determine the markdown ID
  const markdownId = isItemContext && itemId
    ? `items/${itemId}`
    : `contexts/${context.id}`;

  // Load content on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/markdown/${markdownId}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data.content || '');
        }
      } catch {
        // No existing content - start empty
      }
      setIsLoaded(true);
    };
    load();
  }, [markdownId]);

  // Save content to API (debounced)
  const saveContent = useCallback(async (html: string) => {
    latestContentRef.current = html;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/markdown/${markdownId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: latestContentRef.current }),
        });

        // Ensure context has markdownId set
        if (!context.markdownId) {
          await updateContext(context.id, { markdownId });
        }
      } catch {
        // Silently fail - will retry on next edit
      }
    }, 800);
  }, [markdownId, context.id, context.markdownId, updateContext]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-zinc-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto py-6 px-4">
        <TiptapEditor
          content={content}
          onChange={saveContent}
          placeholder="Start typing your notes..."
          minimal
        />
      </div>
    </div>
  );
};
