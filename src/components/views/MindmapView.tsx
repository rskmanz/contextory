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
}

const NODE_HEIGHT = 36;
const NODE_PADDING = 12;
const LEVEL_GAP = 150;
const SIBLING_GAP = 10;

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Build tree and calculate positions
  const { tree, dimensions } = useMemo(() => {
    const nodes = context.data?.nodes || [];
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Create TreeNode objects
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [], x: 0, y: 0, width: 0, height: NODE_HEIGHT });
    });

    // Build tree
    nodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!;
      treeNode.width = Math.max(80, node.content.length * 8 + NODE_PADDING * 2);

      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    // Calculate positions (horizontal tree layout)
    let maxX = 0;
    let maxY = 0;

    const calculatePositions = (node: TreeNode, level: number, startY: number): number => {
      node.x = level * LEVEL_GAP + 50;

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

      // Center parent vertically among children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.y = (firstChild.y + lastChild.y) / 2;

      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);

      return currentY;
    };

    let currentY = 50;
    roots.forEach((root) => {
      currentY = calculatePositions(root, 0, currentY);
      currentY += 20;
    });

    return { tree: roots, dimensions: { width: maxX + 100, height: maxY + 100 } };
  }, [context.data?.nodes]);

  // Center view on mount
  useEffect(() => {
    if (containerRef.current && tree.length > 0) {
      const container = containerRef.current;
      const centerX = (container.clientWidth - dimensions.width) / 2;
      const centerY = (container.clientHeight - dimensions.height) / 2;
      setPan({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    }
  }, [tree.length, dimensions]);

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

  const renderConnections = useCallback((node: TreeNode): React.ReactNode => {
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
            strokeWidth="2"
          />
          {renderConnections(child)}
        </g>
      );
    });
  }, []);

  const renderNode = useCallback(
    (node: TreeNode): React.ReactNode => {
      const isSelected = selectedNodeId === node.id;
      const isEditing = editingNodeId === node.id;

      return (
        <g key={node.id}>
          <foreignObject x={node.x} y={node.y} width={node.width} height={NODE_HEIGHT}>
            <div
              className={`h-full px-3 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-white border-zinc-200 hover:border-zinc-400'
              }`}
              onClick={() => setSelectedNodeId(node.id)}
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
                  onBlur={handleEditSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') {
                      setEditingNodeId(null);
                      setEditContent('');
                    }
                  }}
                  className="w-full text-sm text-center outline-none bg-transparent"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm text-zinc-700 truncate">{node.content}</span>
              )}
            </div>
          </foreignObject>

          {/* Add child button */}
          {isSelected && (
            <foreignObject x={node.x + node.width + 4} y={node.y + 4} width={28} height={28}>
              <button
                onClick={() => handleAddChild(node.id)}
                className="w-7 h-7 flex items-center justify-center bg-zinc-900 text-white rounded-full text-sm hover:bg-zinc-700"
                title="Add child"
              >
                +
              </button>
            </foreignObject>
          )}

          {node.children.map((child) => renderNode(child))}
        </g>
      );
    },
    [selectedNodeId, editingNodeId, editContent, handleEditSubmit, handleAddChild]
  );

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div ref={containerRef} className="flex-1 overflow-auto bg-zinc-50">
        {tree.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <p>No nodes yet</p>
              <button
                onClick={() => handleAddChild(null)}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Add your first node
              </button>
            </div>
          </div>
        ) : (
          <svg
            width={Math.max(dimensions.width, 800)}
            height={Math.max(dimensions.height, 600)}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            {tree.map((root) => renderConnections(root))}
            {tree.map((root) => renderNode(root))}
          </svg>
        )}
      </div>
    </div>
  );
};
