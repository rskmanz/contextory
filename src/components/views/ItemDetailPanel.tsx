'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ObjectItem, ObjectType, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface ItemDetailPanelProps {
  item: ObjectItem;
  object: ObjectType;
  onClose: () => void;
}

interface TreeNode extends ContextNode {
  children: TreeNode[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item, object, onClose }) => {
  const updateItem = useStore((state) => state.updateItem);
  const createSubWorkspace = useStore((state) => state.createSubWorkspace);
  const workspaces = useStore((state) => state.workspaces);

  const [nodes, setNodes] = useState<ContextNode[]>(item.contextData?.nodes || []);
  const [markdown, setMarkdown] = useState('');
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Check if item already has a sub-workspace
  const existingSubWorkspace = workspaces.find((w) => w.parentItemId === item.id);

  // Load markdown if markdownId exists
  useEffect(() => {
    if (item.markdownId) {
      setIsLoadingMarkdown(true);
      fetch(`/api/markdown?id=${item.markdownId}&type=items`)
        .then((res) => res.json())
        .then((data) => setMarkdown(data.content || ''))
        .finally(() => setIsLoadingMarkdown(false));
    }
  }, [item.markdownId]);

  // Build tree from flat nodes
  const tree = React.useMemo(() => {
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
  }, [nodes]);

  // Save contextData to item
  const saveNodes = useCallback(
    async (newNodes: ContextNode[]) => {
      setNodes(newNodes);
      await updateItem(item.id, { contextData: { nodes: newNodes } });
    },
    [item.id, updateItem]
  );

  // Save markdown
  const saveMarkdown = useCallback(
    async (content: string) => {
      const markdownId = item.markdownId || item.id;
      await fetch('/api/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: markdownId, type: 'items', content }),
      });
      if (!item.markdownId) {
        await updateItem(item.id, { markdownId });
      }
    },
    [item.id, item.markdownId, updateItem]
  );

  const handleAddNode = useCallback(
    async (parentId: string | null) => {
      const newNode: ContextNode = {
        id: generateId(),
        content: 'New item',
        parentId,
      };
      await saveNodes([...nodes, newNode]);
      if (parentId) {
        setExpandedNodes((prev) => new Set([...prev, parentId]));
      }
    },
    [nodes, saveNodes]
  );

  const handleUpdateNode = useCallback(
    async (nodeId: string, content: string) => {
      const newNodes = nodes.map((n) => (n.id === nodeId ? { ...n, content } : n));
      await saveNodes(newNodes);
    },
    [nodes, saveNodes]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      // Delete node and all descendants
      const toDelete = new Set<string>();
      const findDescendants = (id: string) => {
        toDelete.add(id);
        nodes.filter((n) => n.parentId === id).forEach((n) => findDescendants(n.id));
      };
      findDescendants(nodeId);
      const newNodes = nodes.filter((n) => !toDelete.has(n.id));
      await saveNodes(newNodes);
    },
    [nodes, saveNodes]
  );

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

  // Expand/collapse all nodes
  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedNodes(new Set());
      setAllExpanded(false);
    } else {
      const allNodeIds = nodes.map((n) => n.id);
      setExpandedNodes(new Set(allNodeIds));
      setAllExpanded(true);
    }
  }, [allExpanded, nodes]);

  // Create sub-workspace from this item
  const handleCreateSubWorkspace = useCallback(async () => {
    if (isCreatingWorkspace) return;
    setIsCreatingWorkspace(true);
    try {
      const workspaceId = await createSubWorkspace(item.id, object.projectId, `${item.name} Workspace`);
      // Navigate to the new workspace (optional - user can manually navigate)
      window.location.href = `/${object.projectId}/${workspaceId}`;
    } finally {
      setIsCreatingWorkspace(false);
    }
  }, [createSubWorkspace, item.id, item.name, object.projectId, isCreatingWorkspace]);

  const renderNode = useCallback(
    (node: TreeNode, depth: number = 0, isLast: boolean = true) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const isEditing = editingNodeId === node.id;

      return (
        <div key={node.id} className="relative">
          {/* Vertical indent line for non-root nodes */}
          {depth > 0 && (
            <div
              className="absolute top-0 bottom-0 border-l border-zinc-200"
              style={{ left: `${(depth - 1) * 20 + 14}px` }}
            />
          )}

          <div
            className="group flex items-center gap-1 py-1.5 px-2 rounded hover:bg-zinc-100 relative"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
          >
            {/* Horizontal branch line for non-root nodes */}
            {depth > 0 && (
              <div
                className="absolute border-t border-zinc-200"
                style={{
                  left: `${(depth - 1) * 20 + 14}px`,
                  width: '12px',
                  top: '50%',
                }}
              />
            )}

            <button
              className={`w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors ${
                !hasChildren ? 'invisible' : ''
              }`}
              onClick={() => toggleExpand(node.id)}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {!hasChildren && (
              <span className="w-5 h-5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
              </span>
            )}

            {isEditing ? (
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={() => {
                  if (editContent.trim()) {
                    handleUpdateNode(node.id, editContent.trim());
                  }
                  setEditingNodeId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editContent.trim()) {
                      handleUpdateNode(node.id, editContent.trim());
                    }
                    setEditingNodeId(null);
                  }
                  if (e.key === 'Escape') {
                    setEditingNodeId(null);
                  }
                }}
                className="flex-1 px-2 py-0.5 text-sm border border-blue-400 rounded outline-none bg-white"
                autoFocus
              />
            ) : (
              <span
                className="flex-1 text-sm text-zinc-700 cursor-pointer hover:text-zinc-900"
                onDoubleClick={() => {
                  setEditingNodeId(node.id);
                  setEditContent(node.content);
                }}
              >
                {node.content}
              </span>
            )}

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded text-xs transition-colors"
                onClick={() => handleAddNode(node.id)}
                title="Add child"
              >
                +
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
                onClick={() => handleDeleteNode(node.id)}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="relative">
              {node.children.map((child, idx) =>
                renderNode(child, depth + 1, idx === node.children.length - 1)
              )}
            </div>
          )}
        </div>
      );
    },
    [expandedNodes, editingNodeId, editContent, handleAddNode, handleUpdateNode, handleDeleteNode, toggleExpand]
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{object.icon}</span>
            <h2 className="text-lg font-semibold text-zinc-800">{item.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {existingSubWorkspace ? (
              <a
                href={`/${object.projectId}/${existingSubWorkspace.id}`}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Open Workspace →
              </a>
            ) : (
              <button
                onClick={handleCreateSubWorkspace}
                disabled={isCreatingWorkspace}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {isCreatingWorkspace ? 'Creating...' : '+ Create Workspace'}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Context Data Tree */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-zinc-600">Context</h3>
              <div className="flex items-center gap-2">
                {nodes.length > 0 && (
                  <button
                    onClick={toggleExpandAll}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    {allExpanded ? '− Collapse all' : '+ Expand all'}
                  </button>
                )}
                <button
                  onClick={() => handleAddNode(null)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  + Add item
                </button>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-2 min-h-[100px]">
              {tree.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">No context items yet</p>
              ) : (
                tree.map((node) => renderNode(node))
              )}
            </div>
          </div>

          {/* Markdown Summary */}
          <div>
            <h3 className="text-sm font-medium text-zinc-600 mb-2">Summary</h3>
            {isLoadingMarkdown ? (
              <p className="text-sm text-zinc-400">Loading...</p>
            ) : (
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onBlur={() => saveMarkdown(markdown)}
                placeholder="Add notes, description, or any markdown content..."
                className="w-full h-40 p-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 resize-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
