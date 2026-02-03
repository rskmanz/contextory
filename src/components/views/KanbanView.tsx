'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface KanbanViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ context, isItemContext, itemId }) => {
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
    ? (node: { content: string; parentId: string | null }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null }) => addContextNode(context.id, node);

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
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(new Map());

  const edges = context.data?.edges || [];

  // Separate columns (parentId = null) from cards (parentId = columnId)
  const { columns, cardsByColumn } = useMemo(() => {
    const nodes = context.data?.nodes || [];
    const cols = nodes.filter((n) => n.parentId === null);
    const cards: Record<string, ContextNode[]> = {};

    cols.forEach((col) => {
      cards[col.id] = nodes.filter((n) => n.parentId === col.id);
    });

    return { columns: cols, cardsByColumn: cards };
  }, [context.data?.nodes]);

  // Update card positions for edge rendering
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPositions = new Map<string, CardPosition>();

      cardRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        newPositions.set(id, {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      });

      setCardPositions(newPositions);
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    const timer = setTimeout(updatePositions, 100);
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [columns, cardsByColumn, context.id, isItemContext, itemId]);

  const handleDoubleClick = useCallback((node: ContextNode) => {
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

  const handleAddColumn = useCallback(async () => {
    await addNode({
      content: 'New Column',
      parentId: null,
    });
  }, [addNode]);

  const handleAddCard = useCallback(
    async (columnId: string) => {
      await addNode({
        content: 'New card',
        parentId: columnId,
      });
    },
    [addNode]
  );

  const handleDelete = useCallback(
    async (nodeId: string) => {
      await deleteNode(nodeId);
    },
    [deleteNode]
  );

  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: string) => {
    if (draggedCard) {
      await updateNode(draggedCard, { parentId: columnId });
      setDraggedCard(null);
    }
  };

  // Edge handling
  const handleCardClick = useCallback(
    async (e: React.MouseEvent, nodeId: string) => {
      if (e.shiftKey) {
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
    [edgeSource, edges, addEdge]
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
      if (e.key === 'Escape' && edgeSource) {
        setEdgeSource(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [edgeSource]);

  const renderEdges = () => {
    return edges.map((edge) => {
      const source = cardPositions.get(edge.sourceId);
      const target = cardPositions.get(edge.targetId);
      if (!source || !target) return null;

      const midX = (source.x + target.x) / 2;

      return (
        <g key={edge.id}>
          <path
            d={`M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="cursor-pointer hover:stroke-red-500"
            onClick={() => handleEdgeClick(edge.id)}
          />
          <circle cx={target.x} cy={target.y} r="4" fill="#3b82f6" />
        </g>
      );
    });
  };

  return (
    <div ref={containerRef} className="h-full overflow-x-auto p-4 relative">
      {/* SVG layer for edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
        <g className="pointer-events-auto">{renderEdges()}</g>
      </svg>

      {/* Edge mode indicator */}
      {edgeSource && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm z-50">
          Shift+click another card to connect (Esc to cancel)
        </div>
      )}

      <div className="flex gap-4 h-full min-w-max">
        {columns.map((column) => (
          <div
            key={column.id}
            className="w-72 flex-shrink-0 bg-zinc-100 rounded-xl p-3 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              {editingNodeId === column.id ? (
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={handleEditSubmit}
                  onKeyDown={handleEditKeyDown}
                  className="flex-1 px-2 py-1 text-sm font-semibold border border-blue-400 rounded outline-none bg-white"
                  autoFocus
                />
              ) : (
                <h3
                  className="font-semibold text-zinc-700 cursor-pointer"
                  onDoubleClick={() => handleDoubleClick(column)}
                >
                  {column.content}
                </h3>
              )}
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">
                  {cardsByColumn[column.id]?.length || 0}
                </span>
                <button
                  className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded"
                  onClick={() => handleDelete(column.id)}
                  title="Delete column"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {(cardsByColumn[column.id] || []).map((card) => {
                const isEdgeSource = edgeSource === card.id;

                return (
                  <div
                    key={card.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(card.id, el);
                    }}
                    draggable
                    onDragStart={() => handleDragStart(card.id)}
                    onClick={(e) => handleCardClick(e, card.id)}
                    className={`group bg-white rounded-lg p-3 shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                      draggedCard === card.id ? 'opacity-50' : ''
                    } ${isEdgeSource ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {editingNodeId === card.id ? (
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={handleEditSubmit}
                        onKeyDown={handleEditKeyDown}
                        className="w-full px-2 py-1 text-sm border border-blue-400 rounded outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-start justify-between">
                        <p
                          className="text-sm text-zinc-800 cursor-pointer flex-1"
                          onDoubleClick={() => handleDoubleClick(card)}
                        >
                          {card.content}
                        </p>
                        <button
                          className="w-5 h-5 flex items-center justify-center text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(card.id);
                          }}
                          title="Delete card"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Card Button */}
            <button
              onClick={() => handleAddCard(column.id)}
              className="mt-2 w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              + Add card
            </button>
          </div>
        ))}

        {/* Add Column Button */}
        <button
          onClick={handleAddColumn}
          className="w-72 flex-shrink-0 h-fit bg-zinc-100 hover:bg-zinc-200 rounded-xl p-4 text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          + Add column
        </button>
      </div>
    </div>
  );
};
