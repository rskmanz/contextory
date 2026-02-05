'use client';

import {
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  T,
} from 'tldraw';

// Shape props
interface ObjectItemShapeProps {
  w: number;
  h: number;
  itemId: string;
  itemName: string;
  objectIcon: string;
}

// Shape util class
export class ObjectItemShapeUtil extends ShapeUtil<any> {
  static override type = 'object-item' as const;

  static override props = {
    w: T.number,
    h: T.number,
    itemId: T.string,
    itemName: T.string,
    objectIcon: T.string,
  };

  getDefaultProps(): ObjectItemShapeProps {
    return {
      w: 180,
      h: 60,
      itemId: '',
      itemName: 'Item',
      objectIcon: '📄',
    };
  }

  getGeometry(shape: any) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: any) {
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          background: 'white',
          border: '1px solid #e4e4e7',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
          pointerEvents: 'all',
        }}
      >
        <span style={{ fontSize: '24px', flexShrink: 0 }}>{shape.props.objectIcon}</span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#27272a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shape.props.itemName}
        </span>
      </HTMLContainer>
    );
  }

  indicator(shape: any) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={12}
        ry={12}
      />
    );
  }
}
