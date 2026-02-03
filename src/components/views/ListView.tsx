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
  depth: number;
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

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Build tree structure from flat nodes
  const tree = useMemo(() => {
    const nodes = context.data?.nodes || [];
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create TreeNode objects
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [], depth: 0 });
    });

    // Second pass: build tree
    nodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        treeNode.depth = parent.depth + 1;
        parent.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    return roots;
  }, [context.data?.nodes]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

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

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEditSubmit();
      } else if (e.key === 'Escape') {
        setEditingNodeId(null);
        setEditContent('');
      }
    },
    [handleEditSubmit]
  );

  const handleAddChild = useCallback(
    async (parentId: string | null) => {
      await addNode({
        content: 'New item',
        parentId,
      });
      if (parentId) {
        setExpandedNodes((prev) => new Set([...prev, parentId]));
      }
    },
    [addNode]
  );

  const handleDelete = useCallback(
    async (nodeId: string) => {
      await deleteNode(nodeId);
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [deleteNode, selectedNodeId]
  );

  const renderNode = useCallback(
    (node: TreeNode) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const isSelected = selectedNodeId === node.id;
      const isEditing = editingNodeId === node.id;

      return (
        <div key={node.id} className="select-none">
          <div
            className={`group flex items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
              isSelected ? 'bg-blue-100' : 'hover:bg-zinc-100'
            }`}
            style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
            onClick={() => setSelectedNodeId(node.id)}
            onDoubleClick={() => handleDoubleClick(node)}
          >
            {/* Expand/collapse button */}
            <button
              className={`w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 ${
                !hasChildren ? 'invisible' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
            >
              {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
            </button>

            {/* Bullet point for leaf nodes */}
            {!hasChildren && (
              <span className="w-5 h-5 flex items-center justify-center text-zinc-300">
                •
              </span>
            )}

            {/* Content */}
            {isEditing ? (
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={handleEditKeyDown}
                className="flex-1 px-2 py-0.5 text-sm border border-blue-400 rounded outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm text-zinc-800">{node.content}</span>
            )}

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChild(node.id);
                }}
                title="Add child"
              >
                +
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node.id);
                }}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div>{node.children.map((child) => renderNode(child))}</div>
          )}
        </div>
      );
    },
    [
      expandedNodes,
      selectedNodeId,
      editingNodeId,
      editContent,
      handleDoubleClick,
      handleEditSubmit,
      handleEditKeyDown,
      handleAddChild,
      handleDelete,
      toggleExpand,
    ]
  );

  return (
    <div className="h-full overflow-auto p-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-2">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <p>No items yet</p>
            <button
              onClick={() => handleAddChild(null)}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Add your first item
            </button>
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
};
