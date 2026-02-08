'use client';

import React from 'react';
import { ObjectItem } from '@/types';
import { useStore } from '@/lib/store';
import { SmartEditor } from '@/components/editor';

interface MarkdownViewProps {
  item: ObjectItem;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ item }) => {
  const updateItem = useStore((state) => state.updateItem);
  const projects = useStore((state) => state.projects);

  const itemProject = projects.find((p) => p.id === item.projectId);
  const workspaceId = itemProject?.workspaceId || '';
  const projectId = item.projectId || undefined;

  return (
    <div className="flex-1 flex h-full bg-white">
      <SmartEditor
        markdownId={item.markdownId}
        entityId={item.id}
        markdownType="items"
        onMarkdownIdCreated={(id) => updateItem(item.id, { markdownId: id })}
        workspaceId={workspaceId}
        projectId={projectId}
        minimal
        showWordCount
        title={item.name}
        onTitleChange={(newTitle) => updateItem(item.id, { name: newTitle })}
        placeholder="Start writing... Use the toolbar above for formatting."
      />
    </div>
  );
};
