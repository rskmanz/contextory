import { useMemo } from 'react';
import { type Node, type Edge, Position } from '@xyflow/react';
import { ContextNode } from '@/types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 44;
const HORIZONTAL_GAP = 180;
const VERTICAL_GAP = 16;
const ROOT_MARGIN = 60;

export type LayoutDirection = 'LR' | 'TB' | 'RL' | 'BT';

export type NodeStyle = 'dot' | 'card' | 'text';

export interface MindmapNodeData {
  content: string;
  parentId: string | null;
  collapsed: boolean;
  childCount: number;
  hasChildren: boolean;
  color?: string;
  icon?: string;
  nodeStyle?: NodeStyle;
  defaultNodeStyle?: NodeStyle;
  [key: string]: unknown;
}

interface TreeNode {
  id: string;
  children: TreeNode[];
  subtreeHeight: number;
}

// Get all descendant IDs of a node (for collapse filtering)
function getDescendantIds(nodeId: string, nodes: ContextNode[]): Set<string> {
  const descendants = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const node of nodes) {
      if (node.parentId === current && !descendants.has(node.id)) {
        descendants.add(node.id);
        stack.push(node.id);
      }
    }
  }
  return descendants;
}

// Calculate subtree height recursively
function calcSubtreeHeight(treeNode: TreeNode): number {
  if (treeNode.children.length === 0) return NODE_HEIGHT;
  const childrenHeight = treeNode.children.reduce(
    (sum, child) => sum + calcSubtreeHeight(child),
    0
  );
  return childrenHeight + (treeNode.children.length - 1) * VERTICAL_GAP;
}

// Calculate subtree width for TB layout
function calcSubtreeWidth(treeNode: TreeNode): number {
  if (treeNode.children.length === 0) return NODE_WIDTH;
  const childrenWidth = treeNode.children.reduce(
    (sum, child) => sum + calcSubtreeWidth(child),
    0
  );
  return childrenWidth + (treeNode.children.length - 1) * HORIZONTAL_GAP;
}

// Custom hierarchical tree layout (supports LR and TB directions)
function layoutTree(
  rfNodes: Node<MindmapNodeData>[],
  rfEdges: Edge[],
  direction: LayoutDirection = 'LR'
): { nodes: Node<MindmapNodeData>[]; edges: Edge[] } {
  if (rfNodes.length === 0) return { nodes: [], edges: [] };

  // Build tree structure
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const n of rfNodes) {
    nodeMap.set(n.id, { id: n.id, children: [], subtreeHeight: NODE_HEIGHT });
  }

  for (const n of rfNodes) {
    const parentId = n.data.parentId;
    const treeNode = nodeMap.get(n.id)!;
    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  const TB_VERTICAL_GAP = 80;
  const RL_ROOT_X = 1200;
  const BT_ROOT_Y = 800;

  if (direction === 'TB') {
    // Top-to-bottom layout: X = spread horizontally, Y = depth (downward)
    for (const root of roots) {
      root.subtreeHeight = calcSubtreeWidth(root); // reuse field for width
    }

    function layoutNodeTB(treeNode: TreeNode, xCenter: number, y: number) {
      positions.set(treeNode.id, {
        x: xCenter - NODE_WIDTH / 2,
        y,
      });

      if (treeNode.children.length === 0) return;

      const totalWidth = treeNode.subtreeHeight; // subtreeHeight stores width for TB
      let currentX = xCenter - totalWidth / 2;

      for (const child of treeNode.children) {
        child.subtreeHeight = calcSubtreeWidth(child);
        const childCenterX = currentX + child.subtreeHeight / 2;
        layoutNodeTB(child, childCenterX, y + NODE_HEIGHT + TB_VERTICAL_GAP);
        currentX += child.subtreeHeight + HORIZONTAL_GAP;
      }
    }

    let currentX = ROOT_MARGIN;
    for (const root of roots) {
      const rootCenterX = currentX + root.subtreeHeight / 2;
      layoutNodeTB(root, rootCenterX, ROOT_MARGIN);
      currentX += root.subtreeHeight + ROOT_MARGIN;
    }
  } else if (direction === 'BT') {
    // Bottom-to-top layout: X = spread horizontally, Y = depth (upward)
    for (const root of roots) {
      root.subtreeHeight = calcSubtreeWidth(root);
    }

    function layoutNodeBT(treeNode: TreeNode, xCenter: number, y: number) {
      positions.set(treeNode.id, {
        x: xCenter - NODE_WIDTH / 2,
        y,
      });

      if (treeNode.children.length === 0) return;

      const totalWidth = treeNode.subtreeHeight;
      let currentX = xCenter - totalWidth / 2;

      for (const child of treeNode.children) {
        child.subtreeHeight = calcSubtreeWidth(child);
        const childCenterX = currentX + child.subtreeHeight / 2;
        layoutNodeBT(child, childCenterX, y - NODE_HEIGHT - TB_VERTICAL_GAP);
        currentX += child.subtreeHeight + HORIZONTAL_GAP;
      }
    }

    let currentX = ROOT_MARGIN;
    for (const root of roots) {
      const rootCenterX = currentX + root.subtreeHeight / 2;
      layoutNodeBT(root, rootCenterX, BT_ROOT_Y);
      currentX += root.subtreeHeight + ROOT_MARGIN;
    }
  } else if (direction === 'RL') {
    // Right-to-left layout: mirror of LR — root starts at large X, children go left
    for (const root of roots) {
      root.subtreeHeight = calcSubtreeHeight(root);
    }

    function layoutNodeRL(treeNode: TreeNode, x: number, yCenter: number) {
      positions.set(treeNode.id, {
        x,
        y: yCenter - NODE_HEIGHT / 2,
      });

      if (treeNode.children.length === 0) return;

      const totalHeight = treeNode.subtreeHeight;
      let currentY = yCenter - totalHeight / 2;

      for (const child of treeNode.children) {
        child.subtreeHeight = calcSubtreeHeight(child);
        const childCenterY = currentY + child.subtreeHeight / 2;
        layoutNodeRL(child, x - HORIZONTAL_GAP, childCenterY);
        currentY += child.subtreeHeight + VERTICAL_GAP;
      }
    }

    let currentY = ROOT_MARGIN;
    for (const root of roots) {
      const rootCenterY = currentY + root.subtreeHeight / 2;
      layoutNodeRL(root, RL_ROOT_X, rootCenterY);
      currentY += root.subtreeHeight + ROOT_MARGIN;
    }
  } else {
    // Left-to-right layout (default LR)
    for (const root of roots) {
      root.subtreeHeight = calcSubtreeHeight(root);
    }

    function layoutNodeLR(treeNode: TreeNode, x: number, yCenter: number) {
      positions.set(treeNode.id, {
        x,
        y: yCenter - NODE_HEIGHT / 2,
      });

      if (treeNode.children.length === 0) return;

      const totalHeight = treeNode.subtreeHeight;
      let currentY = yCenter - totalHeight / 2;

      for (const child of treeNode.children) {
        child.subtreeHeight = calcSubtreeHeight(child);
        const childCenterY = currentY + child.subtreeHeight / 2;
        layoutNodeLR(child, x + HORIZONTAL_GAP, childCenterY);
        currentY += child.subtreeHeight + VERTICAL_GAP;
      }
    }

    let currentY = ROOT_MARGIN;
    for (const root of roots) {
      const rootCenterY = currentY + root.subtreeHeight / 2;
      layoutNodeLR(root, ROOT_MARGIN, rootCenterY);
      currentY += root.subtreeHeight + ROOT_MARGIN;
    }
  }

  // Apply positions with direction-appropriate handles
  const handlePositions: Record<LayoutDirection, [Position, Position]> = {
    LR: [Position.Left, Position.Right],
    RL: [Position.Right, Position.Left],
    TB: [Position.Top, Position.Bottom],
    BT: [Position.Bottom, Position.Top],
  };
  const [targetPos, sourcePos] = handlePositions[direction];

  const layoutedNodes = rfNodes.map((node) => {
    const pos = positions.get(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      position: pos,
      targetPosition: targetPos,
      sourcePosition: sourcePos,
    };
  });

  return { nodes: layoutedNodes, edges: rfEdges };
}

// Convert ContextNode[] to React Flow nodes + edges
export function toFlowElements(
  contextNodes: ContextNode[],
  defaultNodeStyle?: NodeStyle
): { rfNodes: Node<MindmapNodeData>[]; rfEdges: Edge[] } {
  // Find collapsed nodes and collect all hidden descendant IDs
  const hiddenIds = new Set<string>();
  for (const node of contextNodes) {
    if (node.metadata?.collapsed) {
      const descendants = getDescendantIds(node.id, contextNodes);
      descendants.forEach((id) => hiddenIds.add(id));
    }
  }

  // Count direct children for each node (before filtering)
  const childCountMap = new Map<string, number>();
  for (const node of contextNodes) {
    if (node.parentId) {
      childCountMap.set(node.parentId, (childCountMap.get(node.parentId) || 0) + 1);
    }
  }

  const rfNodes: Node<MindmapNodeData>[] = [];
  const rfEdges: Edge[] = [];

  for (const node of contextNodes) {
    if (hiddenIds.has(node.id)) continue;

    const childCount = childCountMap.get(node.id) || 0;

    rfNodes.push({
      id: node.id,
      type: 'mindmap',
      data: {
        content: node.content,
        parentId: node.parentId,
        collapsed: node.metadata?.collapsed ?? false,
        childCount,
        hasChildren: childCount > 0,
        color: node.metadata?.color,
        icon: node.metadata?.icon,
        nodeStyle: node.metadata?.nodeStyle as NodeStyle | undefined,
        defaultNodeStyle,
        sourceItemId: node.metadata?.sourceItemId as string | undefined,
      },
      position: { x: 0, y: 0 },
    });

    if (node.parentId && !hiddenIds.has(node.parentId)) {
      rfEdges.push({
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        type: 'mindmap',
      });
    }
  }

  return { rfNodes, rfEdges };
}

// Hook that converts ContextNode[] to laid-out React Flow elements
export function useMindmapLayout(
  contextNodes: ContextNode[],
  direction: LayoutDirection = 'LR',
  defaultNodeStyle?: NodeStyle
) {
  return useMemo(() => {
    const { rfNodes, rfEdges } = toFlowElements(contextNodes, defaultNodeStyle);
    return layoutTree(rfNodes, rfEdges, direction);
  }, [contextNodes, direction, defaultNodeStyle]);
}
