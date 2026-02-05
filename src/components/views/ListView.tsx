'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface ListViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

interface TreeNode extends ContextNode {
  children: TreeNode[];
}

export const ListView: React.FC<ListViewProps> = ({ context, isItemContext, itemId }) => {
  // Context node functions
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);

  // Item node functions
  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

  // Use appropriate functions based on mode
  const addNode = isItemContext && itemId
    ? (node: { content: string; parentId: string | null }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null }) => addContextNode(context.id, node);

  const updateNode = isItemContext && itemId
    ? (nodeId: string, updates: { content: string }) => updateItemNode(itemId, nodeId, updates)
    : (nodeId: string, updates: { content: string }) => updateContextNode(context.id, nodeId, updates);

  const deleteNode = isItemContext && itemId
    ? (nodeId: string) => deleteItemNode(itemId, nodeId)
    : (nodeId: string) => deleteContextNode(context.id, nodeId);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Build tree structure from flat nodes
  const tree = useMemo(() => {
    const nodes = context.data?.nodes || [];
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    return roots;
  }, [context.data?.nodes]);

  const handleDoubleClick = useCallback((node: TreeNode) => {
    setEditingNodeId(node.id);
    setEditContent(node.content);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (editingNodeId && editContent.trim()) {
      await updateNode(editingNodeId, { content: editContent.trim() });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editingNodeId, editContent, updateNode]);

  const handleAddChild = useCallback(
    async (parentId: string | null) => {
      await addNode({ content: 'New item', parentId });
    },
    [addNode]
  );

  const handleDelete = useCallback(
    async (nodeId: string) => {
      await deleteNode(nodeId);
    },
    [deleteNode]
  );

  const renderNode = (node: TreeNode) => (
    <li key={node.id}>
      {editingNodeId === node.id ? (
        <input
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSubmit();
            if (e.key === 'Escape') {
              setEditingNodeId(null);
              setEditContent('');
            }
          }}
          className="px-1 py-0.5 text-sm border border-blue-400 rounded outline-none"
          autoFocus
        />
      ) : (
        <span
          className="text-sm text-zinc-800 cursor-text"
          onDoubleClick={() => handleDoubleClick(node)}
        >
          {node.content}
        </span>
      )}
      {node.children.length > 0 && (
        <ul className="list-disc pl-5">{node.children.map(renderNode)}</ul>
      )}
    </li>
  );

  return (
    <div className="h-full overflow-auto p-6">
      {tree.length === 0 ? (
        <div className="text-zinc-400">
          <p>No items yet</p>
          <button
            onClick={() => handleAddChild(null)}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <ul className="list-disc pl-5 space-y-1">{tree.map(renderNode)}</ul>
      )}
    </div>
  );
};
