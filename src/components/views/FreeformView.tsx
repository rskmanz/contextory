'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface FreeformViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

const NOTE_WIDTH = 200;
const NOTE_MIN_HEIGHT = 100;

export const FreeformView: React.FC<FreeformViewProps> = ({ context, isItemContext, itemId }) => {
  // Context functions
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);

  // Item functions
  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

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

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const nodes = context.data?.nodes || [];

  const handleAddNote = useCallback(
    async (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.note-card')) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);

      await addNode({
        content: 'New note',
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
      x: e.clientX - (node.metadata?.x || 0),
      y: e.clientY - (node.metadata?.y || 0),
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

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-zinc-50 relative cursor-crosshair"
      style={{ minHeight: '100%', minWidth: '100%' }}
      onDoubleClick={handleAddNote}
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

      {/* Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 pointer-events-none">
          <div className="text-center">
            <p className="text-lg">Double-click anywhere to add a note</p>
            <p className="text-sm mt-2">Drag notes to reposition them</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`note-card absolute rounded-xl border border-zinc-200 shadow-md bg-white cursor-move transition-shadow hover:shadow-lg ${
            draggedNode === node.id ? 'shadow-xl z-50 border-zinc-400' : ''
          }`}
          style={{
            left: node.metadata?.x || 50,
            top: node.metadata?.y || 50,
            width: NOTE_WIDTH,
            minHeight: NOTE_MIN_HEIGHT,
          }}
          onMouseDown={(e) => handleDragStart(node.id, e)}
          onDoubleClick={(e) => handleDoubleClick(node, e)}
        >
          {/* Delete button */}
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-300 shadow-sm z-10"
            onClick={(e) => handleDelete(node.id, e)}
          >
            ×
          </button>

          {/* Content */}
          <div className="p-3">
            {editingNodeId === node.id ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingNodeId(null);
                    setEditContent('');
                  }
                  if (e.key === 'Enter' && e.metaKey) {
                    handleEditSubmit();
                  }
                }}
                className="w-full min-h-[60px] p-1 text-sm bg-transparent outline-none resize-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{node.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
