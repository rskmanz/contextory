'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface MindmapViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

interface TreeNode extends ContextNode {
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  subtreeHeight: number;
}

// Improved layout constants
const NODE_MIN_WIDTH = 100;
const NODE_MAX_WIDTH = 280;
const NODE_HEIGHT = 40;
const NODE_PADDING = 16;
const HORIZONTAL_GAP = 180;
const VERTICAL_GAP = 16;
const ROOT_MARGIN = 60;

// Depth-based colors for visual hierarchy
const getNodeColors = (depth: number, isSelected: boolean, isRoot: boolean): string => {
  if (isSelected) {
    return 'bg-blue-100 border-blue-500 shadow-md';
  }
  if (isRoot) {
    return 'bg-gradient-to-r from-blue-500 to-indigo-500 border-transparent text-white shadow-lg';
  }
  const colors = [
    'bg-blue-50 border-blue-200 hover:border-blue-400',
    'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    'bg-amber-50 border-amber-200 hover:border-amber-400',
    'bg-violet-50 border-violet-200 hover:border-violet-400',
    'bg-rose-50 border-rose-200 hover:border-rose-400',
    'bg-zinc-50 border-zinc-200 hover:border-zinc-400',
  ];
  return colors[Math.min(depth - 1, colors.length - 1)] || colors[colors.length - 1];
};

// Connection line colors based on depth
const getConnectionColor = (depth: number): string => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#71717a'];
  return colors[Math.min(depth, colors.length - 1)];
};

export const MindmapView: React.FC<MindmapViewProps> = ({ context, isItemContext, itemId }) => {
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

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate node width based on content
  const calculateNodeWidth = (content: string): number => {
    const charWidth = 8;
    const estimatedWidth = content.length * charWidth + NODE_PADDING * 2;
    return Math.max(NODE_MIN_WIDTH, Math.min(NODE_MAX_WIDTH, estimatedWidth));
  };

  // Calculate subtree height recursively
  const calculateSubtreeHeight = (node: TreeNode): number => {
    if (node.children.length === 0) {
      return NODE_HEIGHT;
    }
    const childrenHeight = node.children.reduce((sum, child) => {
      return sum + calculateSubtreeHeight(child);
    }, 0);
    return childrenHeight + (node.children.length - 1) * VERTICAL_GAP;
  };

  // Build tree and calculate positions with improved layout
  const { tree, dimensions, nodeMap: treeNodeMap } = useMemo(() => {
    const nodes = context.data?.nodes || [];
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Create TreeNode objects with proper initialization
    nodes.forEach((node) => {
      const width = calculateNodeWidth(node.content);
      nodeMap.set(node.id, {
        ...node,
        children: [],
        x: 0,
        y: 0,
        width,
        height: NODE_HEIGHT,
        depth: 0,
        subtreeHeight: NODE_HEIGHT,
      });
    });

    // Build tree structure
    nodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    // Calculate depth for each node
    const setDepth = (node: TreeNode, depth: number) => {
      node.depth = depth;
      node.children.forEach((child) => setDepth(child, depth + 1));
    };
    roots.forEach((root) => setDepth(root, 0));

    // Calculate subtree heights
    const setSubtreeHeight = (node: TreeNode): number => {
      node.subtreeHeight = calculateSubtreeHeight(node);
      node.children.forEach((child) => setSubtreeHeight(child));
      return node.subtreeHeight;
    };
    roots.forEach((root) => setSubtreeHeight(root));

    // Position nodes with improved algorithm
    let maxX = 0;
    let maxY = 0;

    const layoutNode = (node: TreeNode, x: number, yCenter: number) => {
      node.x = x;
      node.y = yCenter - NODE_HEIGHT / 2;

      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + NODE_HEIGHT);

      if (node.children.length === 0) return;

      // Calculate starting Y for children
      const totalChildrenHeight = node.subtreeHeight;
      let currentY = yCenter - totalChildrenHeight / 2;

      node.children.forEach((child) => {
        const childCenterY = currentY + child.subtreeHeight / 2;
        layoutNode(child, x + HORIZONTAL_GAP, childCenterY);
        currentY += child.subtreeHeight + VERTICAL_GAP;
      });
    };

    // Layout all roots
    let currentY = ROOT_MARGIN;
    roots.forEach((root) => {
      const rootCenterY = currentY + root.subtreeHeight / 2;
      layoutNode(root, ROOT_MARGIN, rootCenterY);
      currentY += root.subtreeHeight + ROOT_MARGIN;
    });

    return {
      tree: roots,
      dimensions: { width: maxX + ROOT_MARGIN * 2, height: maxY + ROOT_MARGIN },
      nodeMap,
    };
  }, [context.data?.nodes]);

  // Center view on mount or when tree changes
  useEffect(() => {
    if (containerRef.current && tree.length > 0) {
      const container = containerRef.current;
      const centerX = (container.clientWidth - dimensions.width * zoom) / 2;
      const centerY = (container.clientHeight - dimensions.height * zoom) / 2;
      setPan({ x: Math.max(20, centerX), y: Math.max(20, centerY) });
    }
  }, [tree.length, dimensions, zoom]);

  // Fit to view function
  const handleFitToView = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scaleX = (container.clientWidth - 80) / dimensions.width;
    const scaleY = (container.clientHeight - 80) / dimensions.height;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(Math.max(0.25, Math.min(1.5, newZoom)));
    setPan({
      x: (container.clientWidth - dimensions.width * newZoom) / 2,
      y: (container.clientHeight - dimensions.height * newZoom) / 2,
    });
  }, [dimensions]);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.min(2, Math.max(0.25, prev * delta)));
    }
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !editingNodeId) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, editingNodeId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleAddChild = useCallback(
    async (parentId: string | null) => {
      await addNode({
        content: 'New node',
        parentId,
      });
    },
    [addNode]
  );

  const handleEditSubmit = useCallback(async () => {
    if (editingNodeId && editContent.trim()) {
      await updateNode(editingNodeId, { content: editContent.trim() });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editingNodeId, editContent, updateNode]);

  const handleDelete = useCallback(
    async (nodeId: string) => {
      await deleteNode(nodeId);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [deleteNode, selectedNodeId]
  );

  // Render curved connections with depth-based colors
  const renderConnections = useCallback((node: TreeNode): React.ReactNode => {
    return node.children.map((child) => {
      const startX = node.x + node.width;
      const startY = node.y + NODE_HEIGHT / 2;
      const endX = child.x;
      const endY = child.y + NODE_HEIGHT / 2;
      const midX = startX + (endX - startX) * 0.5;

      const color = getConnectionColor(node.depth);

      return (
        <g key={`edge-${node.id}-${child.id}`}>
          <path
            d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          {renderConnections(child)}
        </g>
      );
    });
  }, []);

  // Render node with depth-based styling
  const renderNode = useCallback(
    (node: TreeNode): React.ReactNode => {
      const isSelected = selectedNodeId === node.id;
      const isEditing = editingNodeId === node.id;
      const isRoot = node.depth === 0;
      const nodeColors = getNodeColors(node.depth, isSelected, isRoot);

      return (
        <g key={node.id}>
          <foreignObject x={node.x} y={node.y} width={node.width} height={NODE_HEIGHT}>
            <div
              className={`h-full px-4 flex items-center justify-center rounded-xl border-2 cursor-pointer transition-all duration-150 ${nodeColors} ${
                isRoot ? 'font-semibold text-sm' : 'text-sm'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingNodeId(node.id);
                setEditContent(node.content);
              }}
            >
              {isEditing ? (
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
                  className="w-full text-center outline-none bg-transparent"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`truncate ${isRoot ? 'text-white' : 'text-zinc-700'}`}>
                  {node.content}
                </span>
              )}
            </div>
          </foreignObject>

          {/* Action buttons when selected */}
          {isSelected && !isEditing && (
            <>
              {/* Add child button */}
              <foreignObject x={node.x + node.width + 6} y={node.y + 6} width={28} height={28}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild(node.id);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-emerald-500 text-white rounded-full text-sm hover:bg-emerald-600 shadow-md transition-colors"
                  title="Add child (Tab)"
                >
                  +
                </button>
              </foreignObject>

              {/* Delete button */}
              <foreignObject x={node.x + node.width + 6} y={node.y + NODE_HEIGHT - 6} width={28} height={28}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.id);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-600 shadow-md transition-colors"
                  title="Delete (Del)"
                >
                  ×
                </button>
              </foreignObject>
            </>
          )}

          {node.children.map((child) => renderNode(child))}
        </g>
      );
    },
    [selectedNodeId, editingNodeId, editContent, handleEditSubmit, handleAddChild, handleDelete]
  );

  return (
    <div className="h-full overflow-hidden flex flex-col relative">
      {/* Canvas */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-zinc-100 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tree.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-200 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
                </svg>
              </div>
              <p className="text-lg font-medium text-zinc-600">Start your mindmap</p>
              <p className="text-sm text-zinc-400 mt-1">Click below to add your first node</p>
              <button
                onClick={() => handleAddChild(null)}
                className="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-500/25"
              >
                Add root node
              </button>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            onClick={() => setSelectedNodeId(null)}
          >
            {tree.map((root) => renderConnections(root))}
            {tree.map((root) => renderNode(root))}
          </svg>
        )}
      </div>

      {/* Zoom controls */}
      {tree.length > 0 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-xl shadow-lg border border-zinc-200 p-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="w-14 text-center text-xs text-zinc-500 font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className="w-px h-6 bg-zinc-200 mx-1" />
          <button
            onClick={handleFitToView}
            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Fit to view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      )}

      {/* Add root button when tree exists */}
      {tree.length > 0 && (
        <button
          onClick={() => handleAddChild(null)}
          className="absolute bottom-4 left-4 px-4 py-2 bg-white text-zinc-700 rounded-xl shadow-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm font-medium flex items-center gap-2"
          title="Add another root node"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add root
        </button>
      )}

      {/* Help tooltip */}
      <div className="absolute top-4 right-4 text-xs text-zinc-400 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-zinc-200">
        Ctrl+Scroll to zoom • Drag to pan
      </div>
    </div>
  );
};
