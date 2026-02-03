'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface FlowViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

interface NodePosition {
  x: number;
  y: number;
}

export const FlowView: React.FC<FlowViewProps> = ({ context, isItemContext, itemId }) => {
  // Context functions
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);
  const addContextEdge = useStore((state) => state.addEdge);
  const deleteContextEdge = useStore((state) => state.deleteEdge);

  // Item functions
  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);
  const addItemEdge = useStore((state) => state.addItemEdge);
  const deleteItemEdge = useStore((state) => state.deleteItemEdge);

  // Use appropriate functions based on mode
  const addNode = isItemContext && itemId
    ? (node: { content: string; parentId: string | null; metadata?: Record<string, unknown> }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null; metadata?: Record<string, unknown> }) => addContextNode(context.id, node);

  const updateNode = isItemContext && itemId
    ? (nodeId: string, updates: Partial<ContextNode>) => updateItemNode(itemId, nodeId, updates)
    : (nodeId: string, updates: Partial<ContextNode>) => updateContextNode(context.id, nodeId, updates);

  const deleteNode = isItemContext && itemId
    ? (nodeId: string) => deleteItemNode(itemId, nodeId)
    : (nodeId: string) => deleteContextNode(context.id, nodeId);

  const addEdge = isItemContext && itemId
    ? (edge: { sourceId: string; targetId: string }) => addItemEdge(itemId, edge)
    : (edge: { sourceId: string; targetId: string }) => addContextEdge(context.id, edge);

  const deleteEdge = isItemContext && itemId
    ? (edgeId: string) => deleteItemEdge(itemId, edgeId)
    : (edgeId: string) => deleteContextEdge(context.id, edgeId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [connectMode, setConnectMode] = useState(false);

  const nodes = context.data?.nodes || [];
  const edges = context.data?.edges || [];

  // Calculate node positions for edge rendering
  useEffect(() => {
    const positions = new Map<string, NodePosition>();
    nodes.forEach((node) => {
      positions.set(node.id, {
        x: (node.metadata?.x as number) || 100,
        y: (node.metadata?.y as number) || 100,
      });
    });
    setNodePositions(positions);
  }, [nodes]);

  const handleAddNode = useCallback(
    async (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.flow-node')) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);

      await addNode({
        content: 'New node',
        parentId: null,
        metadata: { x, y },
      });
    },
    [addNode]
  );

  const handleDoubleClick = useCallback((node: ContextNode, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = useCallback(
    async (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteNode(nodeId);
    },
    [deleteNode]
  );

  const handleDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - ((node.metadata?.x as number) || 0),
      y: e.clientY - ((node.metadata?.y as number) || 0),
    });
  }, [nodes]);

  const handleDrag = useCallback(
    async (e: React.MouseEvent) => {
      if (!draggedNode) return;

      const newX = Math.max(0, e.clientX - dragOffset.x);
      const newY = Math.max(0, e.clientY - dragOffset.y);

      await updateNode(draggedNode, {
        metadata: { x: newX, y: newY },
      });
    },
    [draggedNode, dragOffset, updateNode]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
  }, []);

  // Add node at center of viewport (for toolbar button)
  const handleAddNodeCenter = useCallback(async () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (containerRef.current?.scrollLeft || 0) + rect.width / 2 - NODE_WIDTH / 2;
    const y = (containerRef.current?.scrollTop || 0) + rect.height / 2 - NODE_HEIGHT / 2;

    await addNode({
      content: 'New node',
      parentId: null,
      metadata: { x, y },
    });
  }, [addNode]);

  // Edge handling - shift+click or connect mode
  const handleNodeClick = useCallback(
    async (e: React.MouseEvent, nodeId: string) => {
      if (e.shiftKey || connectMode) {
        e.stopPropagation();
        if (!edgeSource) {
          setEdgeSource(nodeId);
        } else if (edgeSource !== nodeId) {
          const exists = edges.some(
            (edge) =>
              (edge.sourceId === edgeSource && edge.targetId === nodeId) ||
              (edge.sourceId === nodeId && edge.targetId === edgeSource)
          );
          if (!exists) {
            await addEdge({ sourceId: edgeSource, targetId: nodeId });
          }
          setEdgeSource(null);
        }
      } else {
        setEdgeSource(null);
      }
    },
    [edgeSource, edges, addEdge, connectMode]
  );

  const handleEdgeClick = useCallback(
    async (edgeId: string) => {
      await deleteEdge(edgeId);
    },
    [deleteEdge]
  );

  // Cancel edge mode on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (edgeSource) setEdgeSource(null);
        if (connectMode) setConnectMode(false);
        if (editingNodeId) {
          setEditingNodeId(null);
          setEditContent('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [edgeSource, editingNodeId, connectMode]);

  // Render edges as bezier curves
  const renderEdges = useMemo(() => {
    return edges.map((edge) => {
      const source = nodePositions.get(edge.sourceId);
      const target = nodePositions.get(edge.targetId);
      if (!source || !target) return null;

      // Calculate center points of nodes
      const sx = source.x + NODE_WIDTH / 2;
      const sy = source.y + NODE_HEIGHT / 2;
      const tx = target.x + NODE_WIDTH / 2;
      const ty = target.y + NODE_HEIGHT / 2;

      // Control points for bezier curve
      const midX = (sx + tx) / 2;

      return (
        <g key={edge.id} className="cursor-pointer" onClick={() => handleEdgeClick(edge.id)}>
          <path
            d={`M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="2"
            className="hover:stroke-red-500 transition-colors"
          />
          {/* Arrow at target */}
          <circle cx={tx} cy={ty} r="4" fill="#a1a1aa" className="hover:fill-red-500" />
        </g>
      );
    });
  }, [edges, nodePositions, handleEdgeClick]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-zinc-50 relative cursor-crosshair"
      style={{ minHeight: '100%', minWidth: '100%' }}
      onDoubleClick={handleAddNode}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e4e4e7 1px, transparent 1px),
            linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <button
          onClick={handleAddNodeCenter}
          className="px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 shadow-sm transition-colors flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span>
          Add Node
        </button>
        <button
          onClick={() => {
            setConnectMode(!connectMode);
            if (connectMode) setEdgeSource(null);
          }}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
            connectMode
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="12" r="3"></circle>
            <circle cx="19" cy="12" r="3"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Connect
        </button>
      </div>

      {/* SVG layer for edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <g className="pointer-events-auto">{renderEdges}</g>
      </svg>

      {/* Edge mode indicator */}
      {(edgeSource || connectMode) && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm z-50 shadow-lg">
          {edgeSource
            ? 'Click another node to connect (Esc to cancel)'
            : 'Click a node to start connecting (Esc to exit)'}
        </div>
      )}

      {/* Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 pointer-events-none">
          <div className="text-center">
            <p className="text-lg">Click &quot;Add Node&quot; or double-click to add a node</p>
            <p className="text-sm mt-2">Use &quot;Connect&quot; button or Shift+click to link nodes</p>
          </div>
        </div>
      )}

      {/* Nodes */}
      {nodes.map((node) => {
        const isEdgeSource = edgeSource === node.id;
        const x = (node.metadata?.x as number) || 100;
        const y = (node.metadata?.y as number) || 100;

        return (
          <div
            key={node.id}
            className={`flow-node absolute rounded-lg border shadow-sm bg-white cursor-move transition-all hover:shadow-md ${
              draggedNode === node.id ? 'shadow-lg z-50 border-zinc-400' : 'border-zinc-200'
            } ${isEdgeSource ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
            style={{
              left: x,
              top: y,
              width: NODE_WIDTH,
              minHeight: NODE_HEIGHT,
            }}
            onMouseDown={(e) => handleDragStart(node.id, e)}
            onDoubleClick={(e) => handleDoubleClick(node, e)}
            onClick={(e) => handleNodeClick(e, node.id)}
          >
            {/* Delete button */}
            <button
              className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-300 shadow-sm z-10 text-xs"
              onClick={(e) => handleDelete(node.id, e)}
            >
              x
            </button>

            {/* Content */}
            <div className="p-2 flex items-center justify-center h-full min-h-[60px]">
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
                  className="w-full text-sm text-center bg-transparent outline-none border-b border-blue-400"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-zinc-700 text-center break-words">{node.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
