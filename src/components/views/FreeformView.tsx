'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Tldraw, Editor, getSnapshot, loadSnapshot, TLShapeId, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import { Context } from '@/types';
import { useStore } from '@/lib/store';
import { ObjectItemShapeUtil } from './ObjectItemShape';

interface FreeformViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

// Define custom shapes array OUTSIDE component to prevent recreation
const customShapeUtils = [ObjectItemShapeUtil];

export const FreeformView: React.FC<FreeformViewProps> = ({
  context,
  isItemContext,
  itemId,
}) => {
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to avoid re-render loops — tldraw save updates context.data,
  // which would recreate callbacks and remount tldraw if used in deps
  const contextRef = useRef(context);
  contextRef.current = context;

  // Get update functions from store
  const updateContext = useStore((state) => state.updateContext);
  const updateItem = useStore((state) => state.updateItem);

  // Save snapshot with debounce — stable callback via refs
  const saveSnapshotFn = useCallback(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const snapshot = getSnapshot(editor.store);
    const snapshotJson = JSON.stringify(snapshot);
    const ctx = contextRef.current;

    if (isItemContext && itemId) {
      updateItem(itemId, {
        contextData: {
          type: 'canvas',
          viewStyle: 'freeform',
          nodes: [],
          tldrawSnapshot: snapshotJson,
        },
      });
    } else {
      updateContext(ctx.id, {
        data: {
          nodes: ctx.data?.nodes || [],
          edges: ctx.data?.edges,
          tldrawSnapshot: snapshotJson,
        },
      });
    }
  }, [isItemContext, itemId, updateContext, updateItem]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveSnapshotFn, 500);
  }, [saveSnapshotFn]);

  // Load existing snapshot on mount — stable callback
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Load saved snapshot if exists
      const snapshotData = contextRef.current.data?.tldrawSnapshot;
      if (snapshotData) {
        try {
          const parsed = JSON.parse(snapshotData);
          loadSnapshot(editor.store, parsed);
        } catch (e) {
          // Failed to load tldraw snapshot - start fresh
        }
      }

      // Subscribe to store changes for saving
      editor.store.listen(debouncedSave, {
        source: 'user',
        scope: 'document',
      });
    },
    [debouncedSave]
  );

  // Handle drop from sidebar
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data || !editorRef.current) return;

    try {
      const { itemId: droppedItemId, itemName, objectIcon } = JSON.parse(data);
      const editor = editorRef.current;

      // Get drop position in canvas coordinates
      const point = editor.screenToPage({ x: e.clientX, y: e.clientY });

      // Create the custom shape
      const shapeId: TLShapeId = createShapeId();
      editor.createShape({
        id: shapeId,
        type: 'object-item' as any,
        x: point.x - 90, // Center the shape on drop point
        y: point.y - 30,
        props: {
          w: 180,
          h: 60,
          itemId: droppedItemId,
          itemName,
          objectIcon,
        },
      } as any);

      // Select the newly created shape
      editor.select(shapeId);
    } catch (err) {
      // Failed to create shape from drop
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="h-full w-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Tldraw
        shapeUtils={customShapeUtils}
        onMount={handleMount}
      />
    </div>
  );
};
