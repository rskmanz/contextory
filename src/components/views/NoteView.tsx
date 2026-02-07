'use client';

import React from 'react';
import { Context } from '@/types';
import { useStore } from '@/lib/store';
import { SmartEditor } from '@/components/editor';

interface NoteViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

export const NoteView: React.FC<NoteViewProps> = ({ context, isItemContext, itemId }) => {
  const updateContext = useStore((state) => state.updateContext);

  const markdownType = isItemContext ? 'items' as const : 'contexts' as const;
  const entityId = isItemContext && itemId ? itemId : context.id;
  const markdownId = context.markdownId || undefined;

  const workspaceId = context.workspaceId || '';
  const projectId = context.projectId || undefined;

  return (
    <div className="h-full flex">
      <SmartEditor
        markdownId={markdownId}
        entityId={entityId}
        markdownType={markdownType}
        onMarkdownIdCreated={(id) => {
          if (!context.markdownId) {
            updateContext(context.id, { markdownId: id });
          }
        }}
        workspaceId={workspaceId}
        projectId={projectId}
        minimal
        placeholder="Start typing your notes..."
      />
    </div>
  );
};
