import { useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ContextNode, ContextEdge } from '@/types';

interface UseContextNodesOptions {
  contextId: string;
  isItemContext?: boolean;
  itemId?: string;
}

export function useContextNodes({ contextId, isItemContext, itemId }: UseContextNodesOptions) {
  // Context-level store functions
  const addContextNode = useStore((s) => s.addNode);
  const updateContextNode = useStore((s) => s.updateNode);
  const deleteContextNode = useStore((s) => s.deleteNode);
  const addContextEdge = useStore((s) => s.addEdge);
  const deleteContextEdge = useStore((s) => s.deleteEdge);

  // Item-level store functions
  const addItemNode = useStore((s) => s.addItemNode);
  const updateItemNode = useStore((s) => s.updateItemNode);
  const deleteItemNode = useStore((s) => s.deleteItemNode);
  const addItemEdge = useStore((s) => s.addItemEdge);
  const deleteItemEdge = useStore((s) => s.deleteItemEdge);

  const isItem = isItemContext && itemId;

  const addNode = useCallback(
    (node: { content: string; parentId: string | null }) => {
      if (isItem) {
        return addItemNode(itemId, node);
      }
      return addContextNode(contextId, node);
    },
    [isItem, itemId, contextId, addItemNode, addContextNode]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<ContextNode>) => {
      if (isItem) {
        return updateItemNode(itemId, nodeId, updates);
      }
      return updateContextNode(contextId, nodeId, updates);
    },
    [isItem, itemId, contextId, updateItemNode, updateContextNode]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (isItem) {
        return deleteItemNode(itemId, nodeId);
      }
      return deleteContextNode(contextId, nodeId);
    },
    [isItem, itemId, contextId, deleteItemNode, deleteContextNode]
  );

  const addEdge = useCallback(
    (edge: { sourceId: string; targetId: string }) => {
      if (isItem) {
        return addItemEdge(itemId, edge);
      }
      return addContextEdge(contextId, edge);
    },
    [isItem, itemId, contextId, addItemEdge, addContextEdge]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      if (isItem) {
        return deleteItemEdge(itemId, edgeId);
      }
      return deleteContextEdge(contextId, edgeId);
    },
    [isItem, itemId, contextId, deleteItemEdge, deleteContextEdge]
  );

  return useMemo(
    () => ({ addNode, updateNode, deleteNode, addEdge, deleteEdge }),
    [addNode, updateNode, deleteNode, addEdge, deleteEdge]
  );
}
