'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ObjectItem, ObjectType, ContextNode, ItemViewLayout, FieldValue } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { TiptapEditor } from '@/components/editor';
import { FieldValueCell } from '@/components/fields';

interface ItemDetailPanelProps {
  item: ObjectItem;
  object: ObjectType;
  onClose: () => void;
}

interface TreeNode extends ContextNode {
  children: TreeNode[];
}

interface MindmapNode extends ContextNode {
  children: MindmapNode[];
  x: number;
  y: number;
  width: number;
  height: number;
}

type ContextViewMode = 'tree' | 'mindmap';

// Mindmap constants
const NODE_HEIGHT = 32;
const NODE_PADDING = 10;
const LEVEL_GAP = 120;
const SIBLING_GAP = 8;

export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item, object, onClose }) => {
  const updateItem = useStore((state) => state.updateItem);
  const updateItemFieldValue = useStore((state) => state.updateItemFieldValue);
  const createSubProject = useStore((state) => state.createSubProject);
  const projects = useStore((state) => state.projects);

  const [nodes, setNodes] = useState<ContextNode[]>(item.contextData?.nodes || []);
  const [markdown, setMarkdown] = useState('');
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [viewMode, setViewMode] = useState<ContextViewMode>('tree');
  const [selectedMindmapNode, setSelectedMindmapNode] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<ItemViewLayout>(item.viewLayout || 'visualization');
  const [activeTab, setActiveTab] = useState<'markdown' | 'visualization'>('visualization');
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);

  // Check if item already has a sub-project
  const existingSubWorkspace = projects.find((p) => p.parentItemId === item.id);

  // Get workspaceId from the item's project
  const itemProject = projects.find((p) => p.id === item.projectId);
  const projectId = item.projectId || null;
  const workspaceId = itemProject?.workspaceId || null;

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

  // Initialize layout from item
  useEffect(() => {
    if (item.viewLayout) {
      setViewLayout(item.viewLayout);
    }
  }, [item.viewLayout]);

  // Layout change handler
  const handleLayoutChange = async (layout: ItemViewLayout) => {
    setViewLayout(layout);
    await updateItem(item.id, { viewLayout: layout });
  };


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

  // Build mindmap tree with positions
  const { mindmapTree, mindmapDimensions } = useMemo(() => {
    const nodeMap = new Map<string, MindmapNode>();
    const roots: MindmapNode[] = [];

    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [], x: 0, y: 0, width: 0, height: NODE_HEIGHT });
    });

    nodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!;
      treeNode.width = Math.max(70, node.content.length * 7 + NODE_PADDING * 2);

      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    let maxX = 0;
    let maxY = 0;

    const calculatePositions = (node: MindmapNode, level: number, startY: number): number => {
      node.x = level * LEVEL_GAP + 30;

      if (node.children.length === 0) {
        node.y = startY;
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
        return startY + NODE_HEIGHT + SIBLING_GAP;
      }

      let currentY = startY;
      node.children.forEach((child) => {
        currentY = calculatePositions(child, level + 1, currentY);
      });

      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.y = (firstChild.y + lastChild.y) / 2;

      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);

      return currentY;
    };

    let currentY = 30;
    roots.forEach((root) => {
      currentY = calculatePositions(root, 0, currentY);
      currentY += 15;
    });

    return { mindmapTree: roots, mindmapDimensions: { width: maxX + 50, height: maxY + 50 } };
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

  // Create sub-project from this item
  const handleCreateSubWorkspace = useCallback(async () => {
    if (isCreatingWorkspace || !workspaceId) return;
    setIsCreatingWorkspace(true);
    try {
      const newProjectId = await createSubProject(item.id, workspaceId, `${item.name} Project`);
      // Navigate to the new project (optional - user can manually navigate)
      window.location.href = `/${workspaceId}/${newProjectId}`;
    } finally {
      setIsCreatingWorkspace(false);
    }
  }, [createSubProject, item.id, item.name, workspaceId, isCreatingWorkspace]);

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

  // Mindmap connection rendering
  const renderMindmapConnections = useCallback((node: MindmapNode): React.ReactNode => {
    return node.children.map((child) => {
      const startX = node.x + node.width;
      const startY = node.y + NODE_HEIGHT / 2;
      const endX = child.x;
      const endY = child.y + NODE_HEIGHT / 2;
      const midX = (startX + endX) / 2;

      return (
        <g key={`edge-${node.id}-${child.id}`}>
          <path
            d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
            fill="none"
            stroke="#d4d4d8"
            strokeWidth="1.5"
          />
          {renderMindmapConnections(child)}
        </g>
      );
    });
  }, []);

  // Mindmap node rendering
  const renderMindmapNode = useCallback(
    (node: MindmapNode): React.ReactNode => {
      const isSelected = selectedMindmapNode === node.id;
      const isEditing = editingNodeId === node.id;

      return (
        <g key={node.id}>
          <foreignObject x={node.x} y={node.y} width={node.width} height={NODE_HEIGHT}>
            <div
              className={`h-full px-2 flex items-center justify-center rounded-md border cursor-pointer transition-all text-xs ${
                isSelected
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-white border-zinc-200 hover:border-zinc-400'
              }`}
              onClick={() => setSelectedMindmapNode(node.id)}
              onDoubleClick={() => {
                setEditingNodeId(node.id);
                setEditContent(node.content);
              }}
            >
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
                  className="w-full text-xs text-center outline-none bg-transparent"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-zinc-700 truncate">{node.content}</span>
              )}
            </div>
          </foreignObject>

          {/* Add child button */}
          {isSelected && (
            <foreignObject x={node.x + node.width + 2} y={node.y + 2} width={24} height={24}>
              <button
                onClick={() => handleAddNode(node.id)}
                className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-white rounded-full text-xs hover:bg-zinc-600"
                title="Add child"
              >
                +
              </button>
            </foreignObject>
          )}

          {/* Delete button */}
          {isSelected && (
            <foreignObject x={node.x + node.width + 2} y={node.y + NODE_HEIGHT - 26} width={24} height={24}>
              <button
                onClick={() => handleDeleteNode(node.id)}
                className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                title="Delete"
              >
                ×
              </button>
            </foreignObject>
          )}

          {node.children.map((child) => renderMindmapNode(child))}
        </g>
      );
    },
    [selectedMindmapNode, editingNodeId, editContent, handleAddNode, handleUpdateNode, handleDeleteNode]
  );

  // Markdown panel with Tiptap editor
  const renderMarkdownPanel = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-2 border-b border-zinc-200">
        <h3 className="text-xs font-medium text-zinc-600">Notes</h3>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {isLoadingMarkdown ? (
          <p className="text-xs text-zinc-400">Loading...</p>
        ) : (
          <TiptapEditor
            content={markdown}
            onChange={(md) => setMarkdown(md)}
            onSave={() => saveMarkdown(markdown)}
            placeholder="Add notes..."
            compact
          />
        )}
      </div>
    </div>
  );

  // Visualization (tree or mindmap)
  const renderVisualization = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-zinc-600">Context</h3>
          <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('mindmap')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                viewMode === 'mindmap'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Mindmap
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'tree' && nodes.length > 0 && (
            <button
              onClick={toggleExpandAll}
              className="text-[10px] text-zinc-400 hover:text-zinc-600"
            >
              {allExpanded ? '−' : '+'}
            </button>
          )}
          <button
            onClick={() => handleAddNode(null)}
            className="text-[10px] text-blue-500 hover:underline"
          >
            + Add
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {viewMode === 'tree' ? (
          <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-2 min-h-[80px]">
            {tree.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-3">No context items yet</p>
            ) : (
              tree.map((node) => renderNode(node))
            )}
          </div>
        ) : (
          <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-auto" style={{ minHeight: '150px', maxHeight: '300px' }}>
            {mindmapTree.length === 0 ? (
              <div className="h-[150px] flex items-center justify-center">
                <p className="text-xs text-zinc-400">No context items yet</p>
              </div>
            ) : (
              <svg
                width={Math.max(mindmapDimensions.width, 300)}
                height={Math.max(mindmapDimensions.height, 150)}
                onClick={() => setSelectedMindmapNode(null)}
              >
                {mindmapTree.map((root) => renderMindmapConnections(root))}
                {mindmapTree.map((root) => renderMindmapNode(root))}
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Content based on layout
  const renderContent = () => {
    switch (viewLayout) {
      case 'side-by-side':
        return (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-zinc-200 flex-shrink-0 overflow-hidden">
              {renderMarkdownPanel()}
            </div>
            <div className="w-1/2 overflow-hidden">
              {renderVisualization()}
            </div>
          </div>
        );
      case 'tabs':
        return (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-zinc-200 px-2">
              <button
                onClick={() => setActiveTab('visualization')}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px ${
                  activeTab === 'visualization'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Context
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px ${
                  activeTab === 'markdown'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Notes
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'visualization' ? renderVisualization() : renderMarkdownPanel()}
            </div>
          </div>
        );
      case 'stacked':
        return (
          <div className="flex flex-col h-full overflow-auto">
            <div className="h-48 border-b border-zinc-200 flex-shrink-0">
              {renderMarkdownPanel()}
            </div>
            <div className="flex-1 min-h-[200px]">
              {renderVisualization()}
            </div>
          </div>
        );
      case 'markdown':
        return renderMarkdownPanel();
      default: // 'visualization'
        return renderVisualization();
    }
  };

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
            {/* Layout switcher */}
            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-md p-0.5 ml-2">
              {[
                { value: 'visualization', icon: '📊', title: 'Visualization only' },
                { value: 'markdown', icon: '📝', title: 'Notes only' },
                { value: 'side-by-side', icon: '◫', title: 'Side by side' },
                { value: 'tabs', icon: '▭', title: 'Tabs' },
                { value: 'stacked', icon: '▤', title: 'Stacked' },
              ].map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => handleLayoutChange(layout.value as ItemViewLayout)}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                    viewLayout === layout.value
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:bg-white/50'
                  }`}
                  title={layout.title}
                >
                  <span className="text-[10px]">{layout.icon}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingSubWorkspace ? (
              <a
                href={`/${projectId}/${existingSubWorkspace.id}`}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Open Workspace →
              </a>
            ) : projectId ? (
              <button
                onClick={handleCreateSubWorkspace}
                disabled={isCreatingWorkspace}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {isCreatingWorkspace ? 'Creating...' : '+ Create Workspace'}
              </button>
            ) : null}
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">
              ×
            </button>
          </div>
        </div>

        {/* Properties */}
        {object.fields && object.fields.length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-100">
            <div className="text-xs font-medium text-zinc-400 uppercase mb-2">Properties</div>
            {object.fields.map((field) => (
              <div key={field.id} className="flex items-center py-1.5 gap-3">
                <span className="text-sm text-zinc-500 w-28 shrink-0 truncate">{field.name}</span>
                <div className="flex-1 min-w-0">
                  <FieldValueCell
                    field={field}
                    value={item.fieldValues?.[field.id] ?? null}
                    onChange={(val: FieldValue) => updateItemFieldValue(item.id, field.id, val)}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
