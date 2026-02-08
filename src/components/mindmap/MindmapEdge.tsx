'use client';

import React, { memo } from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';

interface MindmapEdgeData extends Record<string, unknown> {
  edgeStyle?: 'smoothstep' | 'bezier' | 'straight';
  edgeColor?: string;
  showArrows?: boolean;
}

type MindmapEdgeType = Edge<MindmapEdgeData, 'mindmap'>;

function MindmapEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  markerEnd,
}: EdgeProps<MindmapEdgeType>) {
  const edgeStyle = data?.edgeStyle ?? 'smoothstep';
  const edgeColor = data?.edgeColor ?? '#d4d4d8';

  let edgePath: string;

  if (edgeStyle === 'bezier') {
    [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
  } else if (edgeStyle === 'straight') {
    [edgePath] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else {
    [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 16,
    });
  }

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: edgeColor,
        strokeWidth: 2,
        ...style,
      }}
    />
  );
}

export const MindmapEdge = memo(MindmapEdgeComponent);
