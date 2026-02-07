'use client';

import React from 'react';
import { Context } from '@/types';
import { useStore } from '@/lib/store';
import { SmartEditor } from '@/components/editor';

interface ContextMarkdownSidebarProps {
  context: Context;
  isOpen: boolean;
  onClose: () => void;
}

export const ContextMarkdownSidebar: React.FC<ContextMarkdownSidebarProps> = ({
  context,
  isOpen,
  onClose,
}) => {
  const updateContext = useStore((state) => state.updateContext);

  if (!isOpen) return null;

  return (
    <div className="w-80 border-r border-zinc-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-200">
        <h3 className="text-sm font-medium text-zinc-700">Summary</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 text-lg"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        <SmartEditor
          markdownId={context.markdownId}
          entityId={context.id}
          markdownType="contexts"
          onMarkdownIdCreated={(id) => updateContext(context.id, { markdownId: id })}
          workspaceId={context.workspaceId || ''}
          projectId={context.projectId || undefined}
          minimal
          compact
          placeholder="Start writing a summary..."
        />
      </div>
    </div>
  );
};
