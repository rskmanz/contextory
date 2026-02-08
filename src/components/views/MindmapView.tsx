'use client';

import React from 'react';
import { Context } from '@/types';
import { MindmapFlow } from '@/components/mindmap';

interface MindmapViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
  onOpenNode?: (nodeId: string) => void;
}

export const MindmapView: React.FC<MindmapViewProps> = ({ context, isItemContext, itemId, onOpenNode }) => {
  return (
    <MindmapFlow
      context={context}
      isItemContext={isItemContext}
      itemId={itemId}
      onOpenNode={onOpenNode}
    />
  );
};
