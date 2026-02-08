import { useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ContextNode } from '@/types';
import { generateId } from '@/lib/utils';

interface UseMindmapActionsProps {
  contextId: string;
  isItemContext?: boolean;
  itemId?: string;
}

export function useMindmapActions({ contextId, isItemContext, itemId }: UseMindmapActionsProps) {
  const addContextNode = useStore((s) => s.addNode);
  const updateContextNode = useStore((s) => s.updateNode);
  const deleteContextNode = useStore((s) => s.deleteNode);
  const updateContext = useStore((s) => s.updateContext);
  const updateItemContext = useStore((s) => s.updateItemContext);

  const addItemNode = useStore((s) => s.addItemNode);
  const updateItemNode = useStore((s) => s.updateItemNode);
  const deleteItemNode = useStore((s) => s.deleteItemNode);

  const isItem = isItemContext && itemId;

  const addNode = useCallback(
    async (node: { content: string; parentId: string | null; metadata?: ContextNode['metadata'] }) => {
      if (isItem) {
        return addItemNode(itemId, node);
      }
      return addContextNode(contextId, node);
    },
    [isItem, itemId, contextId, addItemNode, addContextNode]
  );

  const updateNode = useCallback(
    async (nodeId: string, updates: Partial<ContextNode>) => {
      if (isItem) {
        return updateItemNode(itemId, nodeId, updates);
      }
      return updateContextNode(contextId, nodeId, updates);
    },
    [isItem, itemId, contextId, updateItemNode, updateContextNode]
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      if (isItem) {
        return deleteItemNode(itemId, nodeId);
      }
      return deleteContextNode(contextId, nodeId);
    },
    [isItem, itemId, contextId, deleteItemNode, deleteContextNode]
  );

  const addChild = useCallback(
    async (parentId: string | null) => {
      return addNode({ content: 'New node', parentId });
    },
    [addNode]
  );

  const addSibling = useCallback(
    async (nodeId: string, nodes: ContextNode[]): Promise<string | undefined> => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return undefined;
      return addNode({ content: 'New node', parentId: node.parentId });
    },
    [addNode]
  );

  const toggleCollapse = useCallback(
    async (nodeId: string, nodes: ContextNode[]) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const collapsed = !(node.metadata?.collapsed ?? false);
      return updateNode(nodeId, {
        metadata: { ...node.metadata, collapsed },
      });
    },
    [updateNode]
  );

  const editContent = useCallback(
    async (nodeId: string, content: string) => {
      return updateNode(nodeId, { content });
    },
    [updateNode]
  );

  const reparentNode = useCallback(
    async (nodeId: string, newParentId: string | null) => {
      return updateNode(nodeId, { parentId: newParentId });
    },
    [updateNode]
  );

  // Add parent: create a new node that takes the selected node's position,
  // then reparent the selected node under the new one
  const addParent = useCallback(
    async (nodeId: string, nodes: ContextNode[]): Promise<string | undefined> => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return undefined;
      // Create new node at the same level as selected
      const newNodeId = await addNode({ content: 'New parent', parentId: node.parentId });
      if (newNodeId) {
        // Reparent selected node under the new node
        await updateNode(nodeId, { parentId: newNodeId });
      }
      return newNodeId;
    },
    [addNode, updateNode]
  );

  // Replace all nodes at once (for undo/redo)
  const setNodes = useCallback(
    async (nodes: ContextNode[]) => {
      if (isItem) {
        return updateItemContext(itemId, nodes);
      }
      const ctx = useStore.getState().contexts.find((c) => c.id === contextId);
      if (!ctx) return;
      return updateContext(contextId, {
        data: { ...ctx.data, nodes },
      });
    },
    [isItem, itemId, contextId, updateItemContext, updateContext]
  );

  // Paste multiple nodes at once (deep-cloned with new IDs)
  const pasteNodes = useCallback(
    async (clipboard: ContextNode[], targetParentId: string | null) => {
      // Build an ID mapping: old ID -> new ID
      const idMap = new Map<string, string>();
      for (const node of clipboard) {
        idMap.set(node.id, generateId());
      }

      // Create cloned nodes with new IDs and remapped parentIds
      const clonedNodes: ContextNode[] = clipboard.map((node) => ({
        ...node,
        id: idMap.get(node.id)!,
        parentId: node.parentId && idMap.has(node.parentId)
          ? idMap.get(node.parentId)!
          : targetParentId,
        metadata: node.metadata ? { ...node.metadata } : undefined,
      }));

      // Add all cloned nodes to the context
      if (isItem) {
        const item = useStore.getState().items.find((i) => i.id === itemId);
        const existingNodes = item?.contextData?.nodes || [];
        return updateItemContext(itemId, [...existingNodes, ...clonedNodes]);
      }
      const ctx = useStore.getState().contexts.find((c) => c.id === contextId);
      if (!ctx) return;
      const existingNodes = ctx.data?.nodes || [];
      return updateContext(contextId, {
        data: { ...ctx.data, nodes: [...existingNodes, ...clonedNodes] },
      });
    },
    [isItem, itemId, contextId, updateItemContext, updateContext]
  );

  return useMemo(
    () => ({
      addNode,
      updateNode,
      deleteNode,
      addChild,
      addSibling,
      addParent,
      toggleCollapse,
      editContent,
      reparentNode,
      setNodes,
      pasteNodes,
    }),
    [addNode, updateNode, deleteNode, addChild, addSibling, addParent, toggleCollapse, editContent, reparentNode, setNodes, pasteNodes]
  );
}
