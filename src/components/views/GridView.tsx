'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Context, ContextNode, ContextEdge } from '@/types';
import { useStore } from '@/lib/store';

interface GridViewProps {
  context: Context;
}

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const GridView: React.FC<GridViewProps> = ({ context }) => {
  const addNode = useStore((state) => state.addNode);
  const updateNode = useStore((state) => state.updateNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const addEdge = useStore((state) => state.addEdge);
  const deleteEdge = useStore((state) => state.deleteEdge);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(new Map());

  const nodes = context.data?.nodes || [];
  const edges = context.data?.edges || [];

  // Organize into groups (depth 0) and cards (depth 1)
  const { groups, cards } = useMemo(() => {
    const groupNodes = nodes.filter((n) => !n.parentId);
    const cardNodes = nodes.filter((n) => n.parentId);
    return { groups: groupNodes, cards: cardNodes };
  }, [nodes]);

  const getCardsForGroup = useCallback(
    (groupId: string) => cards.filter((c) => c.parentId === groupId),
    [cards]
  );

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
    return () => window.removeEventListener('resize', updatePositions);
  }, [nodes, context.id]);

  const handleAddGroup = useCallback(async () => {
    await addNode(context.id, {
      content: 'New Group',
      parentId: null,
    });
  }, [context.id, addNode]);

  const handleAddCard = useCallback(
    async (groupId: string) => {
      await addNode(context.id, {
        content: 'New card',
        parentId: groupId,
      });
    },
    [context.id, addNode]
  );

  const handleEditSubmit = useCallback(async () => {
    if (editingNodeId && editContent.trim()) {
      await updateNode(context.id, editingNodeId, { content: editContent.trim() });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editingNodeId, editContent, context.id, updateNode]);

  const handleDelete = useCallback(
    async (nodeId: string) => {
      await deleteNode(context.id, nodeId);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [context.id, deleteNode, selectedNodeId]
  );

  const startEditing = useCallback((node: ContextNode) => {
    setEditingNodeId(node.id);
    setEditContent(node.content);
  }, []);

  // Edge handling
  const handleCardClick = useCallback(
    async (e: React.MouseEvent, nodeId: string) => {
      if (e.shiftKey) {
        // Start or complete edge
        if (!edgeSource) {
          setEdgeSource(nodeId);
        } else if (edgeSource !== nodeId) {
          // Check if edge already exists
          const exists = edges.some(
            (edge) =>
              (edge.sourceId === edgeSource && edge.targetId === nodeId) ||
              (edge.sourceId === nodeId && edge.targetId === edgeSource)
          );
          if (!exists) {
            await addEdge(context.id, { sourceId: edgeSource, targetId: nodeId });
          }
          setEdgeSource(null);
        }
      } else {
        setEdgeSource(null);
        setSelectedNodeId(nodeId);
      }
    },
    [edgeSource, edges, context.id, addEdge]
  );

  const handleEdgeClick = useCallback(
    async (edgeId: string) => {
      await deleteEdge(context.id, edgeId);
    },
    [context.id, deleteEdge]
  );

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
          {/* Arrow head */}
          <circle cx={target.x} cy={target.y} r="4" fill="#3b82f6" />
        </g>
      );
    });
  };

  const renderCard = (node: ContextNode) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const isEdgeSource = edgeSource === node.id;

    return (
      <div
        key={node.id}
        ref={(el) => {
          if (el) cardRefs.current.set(node.id, el);
        }}
        className={`group relative bg-white rounded-lg p-3 border cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-blue-400 shadow-md' : 'border-zinc-200'
        } ${isEdgeSource ? 'ring-2 ring-blue-500' : ''}`}
        onClick={(e) => handleCardClick(e, node.id)}
        onDoubleClick={() => startEditing(node)}
      >
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEditSubmit();
              }
              if (e.key === 'Escape') {
                setEditingNodeId(null);
                setEditContent('');
              }
            }}
            className="w-full text-sm outline-none resize-none bg-transparent"
            rows={2}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{node.content}</p>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(node.id);
          }}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full overflow-auto p-4 relative">
      {/* SVG layer for edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <g className="pointer-events-auto">{renderEdges()}</g>
      </svg>

      {/* Edge mode indicator */}
      {edgeSource && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm z-50">
          Shift+click another card to connect (Esc to cancel)
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
          <p>No groups yet</p>
          <button onClick={handleAddGroup} className="mt-2 text-sm text-blue-500 hover:underline">
            Add your first group
          </button>
        </div>
      ) : (
        <div className="space-y-6 relative" style={{ zIndex: 2 }}>
          {groups.map((group) => {
            const groupCards = getCardsForGroup(group.id);
            const isEditingGroup = editingNodeId === group.id;

            return (
              <div key={group.id} className="group/section">
                {/* Group Header */}
                <div className="flex items-center justify-between mb-3">
                  {isEditingGroup ? (
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
                      className="text-sm font-semibold text-zinc-800 bg-transparent border-b border-blue-400 outline-none"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="text-sm font-semibold text-zinc-800 cursor-pointer hover:text-zinc-600"
                      onDoubleClick={() => startEditing(group)}
                    >
                      {group.content}
                      <span className="ml-2 text-xs font-normal text-zinc-400">
                        {groupCards.length} items
                      </span>
                    </h3>
                  )}
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-zinc-400 hover:text-red-500 text-xs opacity-0 group-hover/section:opacity-100 transition-opacity"
                  >
                    Delete group
                  </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupCards.map(renderCard)}

                  {/* Add card placeholder */}
                  <div
                    onClick={() => handleAddCard(group.id)}
                    className="flex items-center justify-center bg-zinc-50 rounded-lg p-3 border border-dashed border-zinc-200 cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 transition-all min-h-[60px]"
                  >
                    <span className="text-zinc-400 text-xs">+ Add card</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add group button */}
          <button
            onClick={handleAddGroup}
            className="w-full py-3 text-sm text-zinc-500 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-400 transition-all"
          >
            + Add group
          </button>
        </div>
      )}
    </div>
  );
};
