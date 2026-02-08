import { useCallback, useRef } from 'react';
import { ContextNode } from '@/types';

const MAX_HISTORY = 50;

interface HistoryState {
  past: ContextNode[][];
  future: ContextNode[][];
}

export function useMindmapHistory(
  currentNodes: ContextNode[],
  onRestore: (nodes: ContextNode[]) => void,
) {
  const historyRef = useRef<HistoryState>({ past: [], future: [] });
  const lastSnapshotRef = useRef<string>('');

  // Push a snapshot of the current nodes (call before each mutation)
  const pushSnapshot = useCallback(() => {
    const serialized = JSON.stringify(currentNodes);
    // Skip if identical to last snapshot (no real change)
    if (serialized === lastSnapshotRef.current) return;
    lastSnapshotRef.current = serialized;

    const { past } = historyRef.current;
    const newPast = [...past, currentNodes.map((n) => ({ ...n, metadata: n.metadata ? { ...n.metadata } : undefined }))];
    if (newPast.length > MAX_HISTORY) {
      newPast.shift();
    }
    historyRef.current = { past: newPast, future: [] };
  }, [currentNodes]);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // Save current state to future
    const currentSnapshot = currentNodes.map((n) => ({ ...n, metadata: n.metadata ? { ...n.metadata } : undefined }));
    historyRef.current = { past: newPast, future: [currentSnapshot, ...future] };
    lastSnapshotRef.current = JSON.stringify(previous);
    onRestore(previous);
  }, [currentNodes, onRestore]);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    // Save current state to past
    const currentSnapshot = currentNodes.map((n) => ({ ...n, metadata: n.metadata ? { ...n.metadata } : undefined }));
    historyRef.current = { past: [...past, currentSnapshot], future: newFuture };
    lastSnapshotRef.current = JSON.stringify(next);
    onRestore(next);
  }, [currentNodes, onRestore]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
