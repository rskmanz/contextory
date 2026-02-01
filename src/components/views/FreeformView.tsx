'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface FreeformViewProps {
  context: Context;
}

const NOTE_WIDTH = 200;
const NOTE_MIN_HEIGHT = 100;

export const FreeformView: React.FC<FreeformViewProps> = ({ context }) => {
  const addNode = useStore((state) => state.addNode);
  const updateNode = useStore((state) => state.updateNode);
  const deleteNode = useStore((state) => state.deleteNode);

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

      await addNode(context.id, {
        content: 'New note',
        parentId: null,
        metadata: { x, y },
      });
    },
    [context.id, addNode]
  );

  const handleDoubleClick = useCallback((node: ContextNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditContent(node.content);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (editingNodeId && editContent.trim()) {
      await updateNode(context.id, editingNodeId, { content: editContent.trim() });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editingNodeId, editContent, context.id, updateNode]);

  const handleDelete = useCallback(
    async (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteNode(context.id, nodeId);
    },
    [context.id, deleteNode]
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

      await updateNode(context.id, draggedNode, {
        metadata: { x: newX, y: newY },
      });
    },
    [draggedNode, dragOffset, context.id, updateNode]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const getNodeColor = (index: number) => {
    const colors = [
      'bg-yellow-100 border-yellow-300',
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-pink-100 border-pink-300',
      'bg-purple-100 border-purple-300',
      'bg-orange-100 border-orange-300',
    ];
    return colors[index % colors.length];
  };

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
      {nodes.map((node, index) => (
        <div
          key={node.id}
          className={`note-card absolute rounded-xl border-2 shadow-md cursor-move transition-shadow hover:shadow-lg ${getNodeColor(index)} ${
            draggedNode === node.id ? 'shadow-xl z-50' : ''
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
