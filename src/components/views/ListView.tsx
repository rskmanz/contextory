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

  const renderNode = (node: TreeNode, depth: number = 0) => (
    <div key={node.id} className="py-0.5">
      <div className="flex items-start gap-2">
        <span className="text-zinc-300 mt-0.5">•</span>
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
            className="flex-1 px-1 py-0.5 text-sm border-b border-zinc-300 outline-none bg-transparent"
            autoFocus
          />
        ) : (
          <span
            className="text-sm text-zinc-700 cursor-text"
            onDoubleClick={() => handleDoubleClick(node)}
          >
            {node.content}
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="pl-4 mt-0.5">
          {node.children.map(child => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {tree.length === 0 ? (
          <div
            onClick={() => handleAddChild(null)}
            className="text-zinc-300 cursor-pointer text-sm flex items-center gap-2"
          >
            <span>•</span>
            <span>Add item...</span>
          </div>
        ) : (
          <div>{tree.map(node => renderNode(node))}</div>
        )}
      </div>
    </div>
  );
};
