'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface ListViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

interface TreeNode extends ContextNode {
  children: TreeNode[];
}

/** Flatten tree into an ordered list with depth info for rendering. */
function flattenTree(roots: TreeNode[]): Array<{ node: TreeNode; depth: number }> {
  const result: Array<{ node: TreeNode; depth: number }> = [];
  function walk(nodes: TreeNode[], depth: number) {
    for (const n of nodes) {
      result.push({ node: n, depth });
      walk(n.children, depth + 1);
    }
  }
  walk(roots, 0);
  return result;
}

export const ListView: React.FC<ListViewProps> = ({ context, isItemContext, itemId }) => {
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

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Build tree structure from flat nodes
  const tree = useMemo(() => {
    const nodes = context.data?.nodes || [];
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    return roots;
  }, [context.data?.nodes]);

  const flatList = useMemo(() => flattenTree(tree), [tree]);

  // Focus newly created nodes
  useEffect(() => {
    if (focusNodeId && inputRefs.current[focusNodeId]) {
      inputRefs.current[focusNodeId]?.focus();
      setFocusNodeId(null);
    }
  }, [focusNodeId, flatList]);

  const startEditing = useCallback((node: TreeNode) => {
    setEditingNodeId(node.id);
    setEditContent(node.content);
  }, []);

  const commitEdit = useCallback(async (nodeId: string) => {
    if (!nodeId) return;
    const trimmed = editContent.trim();
    if (trimmed) {
      await updateNode(nodeId, { content: trimmed });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editContent, updateNode]);

  const cancelEdit = useCallback(() => {
    setEditingNodeId(null);
    setEditContent('');
  }, []);

  /** Add a new sibling after the current node (or root if none). */
  const addSiblingAfter = useCallback(async (currentNode: TreeNode) => {
    const newId = await addNode({
      content: '',
      parentId: currentNode.parentId,
    });
    setEditingNodeId(newId);
    setEditContent('');
    setFocusNodeId(newId);
  }, [addNode]);

  /** Add a new root node at the end. */
  const addRootNode = useCallback(async () => {
    const newId = await addNode({ content: '', parentId: null });
    setEditingNodeId(newId);
    setEditContent('');
    setFocusNodeId(newId);
  }, [addNode]);

  /** Indent: make current node a child of its previous sibling. */
  const indentNode = useCallback(async (node: TreeNode) => {
    // Find siblings at the same level
    const siblings = flatList
      .filter((f) => f.node.parentId === node.parentId)
      .map((f) => f.node);
    const idx = siblings.findIndex((s) => s.id === node.id);
    if (idx <= 0) return; // Can't indent first sibling

    const newParent = siblings[idx - 1];
    if (isItemContext && itemId) {
      await useStore.getState().updateItemNode(itemId, node.id, { parentId: newParent.id });
    } else {
      await useStore.getState().updateNode(context.id, node.id, { parentId: newParent.id });
    }
  }, [flatList, isItemContext, itemId, context.id]);

  /** Un-indent: move node to be a sibling of its parent. */
  const unindentNode = useCallback(async (node: TreeNode) => {
    if (!node.parentId) return; // Already root
    // Find the parent's parentId
    const parentEntry = flatList.find((f) => f.node.id === node.parentId);
    const grandparentId = parentEntry ? parentEntry.node.parentId : null;

    if (isItemContext && itemId) {
      await useStore.getState().updateItemNode(itemId, node.id, { parentId: grandparentId } as Partial<ContextNode>);
    } else {
      await useStore.getState().updateNode(context.id, node.id, { parentId: grandparentId } as Partial<ContextNode>);
    }
  }, [flatList, isItemContext, itemId, context.id]);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>, node: TreeNode) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Commit current, then add sibling after
      if (editContent.trim() || node.content.trim()) {
        await commitEdit(node.id);
      }
      await addSiblingAfter(node);
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Backspace' && editContent === '') {
      e.preventDefault();
      // Delete this node if empty, focus previous
      const idx = flatList.findIndex((f) => f.node.id === node.id);
      const prevNode = idx > 0 ? flatList[idx - 1].node : null;
      await deleteNode(node.id);
      if (prevNode) {
        setEditingNodeId(prevNode.id);
        setEditContent(prevNode.content);
        setFocusNodeId(prevNode.id);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Commit first
      if (editContent.trim()) {
        await commitEdit(node.id);
      }
      if (e.shiftKey) {
        await unindentNode(node);
      } else {
        await indentNode(node);
      }
      // Re-enter editing on same node
      setEditingNodeId(node.id);
      setEditContent(editContent);
      setFocusNodeId(node.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (editContent.trim() || node.content.trim()) {
        await commitEdit(node.id);
      }
      const idx = flatList.findIndex((f) => f.node.id === node.id);
      if (idx > 0) {
        const prev = flatList[idx - 1].node;
        setEditingNodeId(prev.id);
        setEditContent(prev.content);
        setFocusNodeId(prev.id);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (editContent.trim() || node.content.trim()) {
        await commitEdit(node.id);
      }
      const idx = flatList.findIndex((f) => f.node.id === node.id);
      if (idx < flatList.length - 1) {
        const next = flatList[idx + 1].node;
        setEditingNodeId(next.id);
        setEditContent(next.content);
        setFocusNodeId(next.id);
      }
    }
  }, [editContent, commitEdit, cancelEdit, addSiblingAfter, deleteNode, flatList, indentNode, unindentNode]);

  const renderBullet = (node: TreeNode, depth: number) => {
    const isEditing = editingNodeId === node.id;
    const indent = depth * 24;

    return (
      <div
        key={node.id}
        className="group flex items-start min-h-[28px]"
        style={{ paddingLeft: `${indent}px` }}
      >
        <span className="text-zinc-300 select-none mt-[5px] mr-2 text-sm leading-none flex-shrink-0">
          {depth === 0 ? '\u2022' : depth === 1 ? '\u25E6' : '\u2043'}
        </span>
        {isEditing ? (
          <input
            ref={(el) => { inputRefs.current[node.id] = el; }}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={() => {
              if (editContent.trim()) {
                commitEdit(node.id);
              } else if (!node.content.trim()) {
                // Delete empty new nodes on blur
                deleteNode(node.id);
              } else {
                cancelEdit();
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, node)}
            placeholder="Type here..."
            className="flex-1 text-sm text-zinc-800 bg-transparent outline-none border-none py-[3px] placeholder:text-zinc-300"
            autoFocus
          />
        ) : (
          <div
            className="flex-1 flex items-center min-h-[28px] cursor-text"
            onClick={() => startEditing(node)}
          >
            <span className="text-sm text-zinc-700 py-[3px] leading-snug">
              {node.content || <span className="text-zinc-300 italic">Empty</span>}
            </span>
          </div>
        )}
        {/* Delete button on hover */}
        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-500 ml-1 mt-[5px] transition-opacity flex-shrink-0"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {flatList.length === 0 ? (
          <div
            onClick={addRootNode}
            className="text-zinc-300 cursor-pointer text-sm flex items-center gap-2 hover:text-zinc-400 transition-colors py-1"
          >
            <span>{'\u2022'}</span>
            <span>Click to start typing...</span>
          </div>
        ) : (
          <>
            {flatList.map(({ node, depth }) => renderBullet(node, depth))}
            {/* Add new bullet at bottom */}
            <div
              onClick={addRootNode}
              className="flex items-center min-h-[28px] text-zinc-300 hover:text-zinc-400 cursor-pointer transition-colors mt-1"
            >
              <span className="select-none mr-2 text-sm leading-none">+</span>
              <span className="text-sm">Add item</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
