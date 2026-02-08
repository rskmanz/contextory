'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';
import { MindmapNode } from './MindmapNode';
import { MindmapEdge } from './MindmapEdge';
import { MindmapContextMenu } from './MindmapContextMenu';
import { useMindmapLayout } from './use-mindmap-layout';
import { useMindmapActions } from './use-mindmap-actions';
import { useMindmapHistory } from './use-mindmap-history';
import {
  MindmapSettingsPanel,
  type MindmapSettingsState,
  loadSettings,
  saveSettings,
  backgroundVariantFromStyle,
} from './MindmapSettings';

const nodeTypes = { mindmap: MindmapNode };
const edgeTypes = { mindmap: MindmapEdge };

interface MindmapFlowProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
  onOpenNode?: (nodeId: string) => void;
}

interface ContextMenuState {
  nodeId: string;
  top: number;
  left: number;
}

// Collect a node and all its descendants from the nodes array
function collectSubtree(nodeId: string, allNodes: ContextNode[]): ContextNode[] {
  const result: ContextNode[] = [];
  const root = allNodes.find((n) => n.id === nodeId);
  if (!root) return result;
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push({
      ...current,
      metadata: current.metadata ? { ...current.metadata } : undefined,
    });
    const children = allNodes.filter((n) => n.parentId === current.id);
    queue.push(...children);
  }
  return result;
}

function MindmapFlowInner({ context, isItemContext, itemId, onOpenNode }: MindmapFlowProps) {
  const { fitView, getNodes } = useReactFlow();
  const contextNodes: ContextNode[] = context.data?.nodes || [];
  const addNodeForItem = useStore((state) => state.addNodeForItem);

  // Settings state (persisted to localStorage)
  const [settings, setSettings] = useState<MindmapSettingsState>(loadSettings);
  const handleSettingsChange = useCallback((next: MindmapSettingsState) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMindmapLayout(contextNodes, settings.layoutDirection, settings.defaultNodeStyle);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const flowWrapperRef = useRef<HTMLDivElement>(null);

  const actions = useMindmapActions({
    contextId: context.id,
    isItemContext,
    itemId,
  });

  // Undo/Redo history
  const onRestoreNodes = useCallback(
    (restoredNodes: ContextNode[]) => {
      actions.setNodes(restoredNodes);
    },
    [actions]
  );
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useMindmapHistory(
    contextNodes,
    onRestoreNodes,
  );

  // Copy/paste clipboard
  const clipboardRef = useRef<ContextNode[]>([]);

  // Sync layout when context nodes change
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Fit view when nodes change significantly
  const prevNodeCount = useRef(contextNodes.length);
  useEffect(() => {
    if (contextNodes.length !== prevNodeCount.current) {
      prevNodeCount.current = contextNodes.length;
      if (settings.autoFitOnChange) {
        setTimeout(() => fitView({ padding: 0.2, duration: settings.animationDuration }), 50);
      }
    }
  }, [contextNodes.length, fitView, settings.autoFitOnChange, settings.animationDuration]);

  // Auto-fit on initial mount with smooth animation
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
    }
  }, [fitView]);

  // Re-fit when layout direction changes
  const prevDirection = useRef(settings.layoutDirection);
  useEffect(() => {
    if (prevDirection.current !== settings.layoutDirection) {
      prevDirection.current = settings.layoutDirection;
      setTimeout(() => fitView({ padding: 0.2, duration: settings.animationDuration }), 100);
    }
  }, [settings.layoutDirection, fitView, settings.animationDuration]);

  // Listen for custom events from MindmapNode
  useEffect(() => {
    const handleEdit = (e: Event) => {
      const { nodeId, content } = (e as CustomEvent).detail;
      pushSnapshot();
      actions.editContent(nodeId, content);
    };
    const handleAddChild = async (e: Event) => {
      const { parentId } = (e as CustomEvent).detail;
      pushSnapshot();
      const newId = await actions.addChild(parentId);
      if (newId) setSelectedNodeId(newId);
    };
    const handleAddSibling = async (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      pushSnapshot();
      const newId = await actions.addSibling(nodeId, contextNodes);
      if (newId) setSelectedNodeId(newId);
    };
    const handleDelete = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      pushSnapshot();
      actions.deleteNode(nodeId);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    };
    const handleAddParent = async (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      pushSnapshot();
      const newId = await actions.addParent(nodeId, contextNodes);
      if (newId) setSelectedNodeId(newId);
    };
    const handleToggleCollapse = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      pushSnapshot();
      actions.toggleCollapse(nodeId, contextNodes);
    };
    const handleSetColor = (e: Event) => {
      const { nodeId, color } = (e as CustomEvent).detail;
      pushSnapshot();
      const node = contextNodes.find((n) => n.id === nodeId);
      if (node) {
        actions.updateNode(nodeId, {
          metadata: { ...node.metadata, color: color || undefined },
        });
      }
    };
    const handleSetIcon = (e: Event) => {
      const { nodeId, icon } = (e as CustomEvent).detail;
      pushSnapshot();
      const node = contextNodes.find((n) => n.id === nodeId);
      if (node) {
        actions.updateNode(nodeId, {
          metadata: { ...node.metadata, icon: icon || undefined },
        });
      }
    };
    const handleSetStyle = (e: Event) => {
      const { nodeId, style } = (e as CustomEvent).detail;
      pushSnapshot();
      const node = contextNodes.find((n) => n.id === nodeId);
      if (node) {
        actions.updateNode(nodeId, {
          metadata: { ...node.metadata, nodeStyle: style || undefined },
        });
      }
    };

    const handleOpenNode = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      if (onOpenNode) onOpenNode(nodeId);
    };

    window.addEventListener('mindmap:edit', handleEdit);
    window.addEventListener('mindmap:add-child', handleAddChild);
    window.addEventListener('mindmap:add-sibling', handleAddSibling);
    window.addEventListener('mindmap:add-parent', handleAddParent);
    window.addEventListener('mindmap:delete', handleDelete);
    window.addEventListener('mindmap:toggle-collapse', handleToggleCollapse);
    window.addEventListener('mindmap:set-color', handleSetColor);
    window.addEventListener('mindmap:set-icon', handleSetIcon);
    window.addEventListener('mindmap:set-style', handleSetStyle);
    window.addEventListener('mindmap:open-node', handleOpenNode);

    return () => {
      window.removeEventListener('mindmap:edit', handleEdit);
      window.removeEventListener('mindmap:add-child', handleAddChild);
      window.removeEventListener('mindmap:add-sibling', handleAddSibling);
      window.removeEventListener('mindmap:add-parent', handleAddParent);
      window.removeEventListener('mindmap:delete', handleDelete);
      window.removeEventListener('mindmap:toggle-collapse', handleToggleCollapse);
      window.removeEventListener('mindmap:set-color', handleSetColor);
      window.removeEventListener('mindmap:set-icon', handleSetIcon);
      window.removeEventListener('mindmap:set-style', handleSetStyle);
      window.removeEventListener('mindmap:open-node', handleOpenNode);
    };
  }, [actions, contextNodes, selectedNodeId, pushSnapshot, onOpenNode]);

  // Listen for start-edit events
  useEffect(() => {
    const handleStartEdit = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      setSelectedNodeId(nodeId);
    };
    window.addEventListener('mindmap:start-edit', handleStartEdit);
    return () => window.removeEventListener('mindmap:start-edit', handleStartEdit);
  }, []);

  // Track selected node
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length === 1) {
        setSelectedNodeId(selectedNodes[0].id);
      } else if (selectedNodes.length === 0) {
        setSelectedNodeId(null);
      }
    },
    []
  );

  // Context menu on right-click
  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      setContextMenu({
        nodeId: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    []
  );

  // Close context menu on pane click
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Sidebar item drop handler
  const handleItemDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (isItemContext) return;
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { itemId } = JSON.parse(raw);
      if (!itemId) return;
      const alreadyExists = contextNodes.some(n => n.metadata?.sourceItemId === itemId);
      if (!alreadyExists) {
        await addNodeForItem(context.id, itemId, null);
      }
    } catch { /* ignore */ }
  }, [isItemContext, context.id, contextNodes, addNodeForItem]);

  const handleItemDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Drag to reparent: on drag stop, check overlap with other nodes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      const allNodes = getNodes();
      const draggedRect = {
        x: draggedNode.position.x,
        y: draggedNode.position.y,
        width: 200,
        height: 44,
      };

      for (const target of allNodes) {
        if (target.id === draggedNode.id) continue;
        if (isDescendant(target.id, draggedNode.id, contextNodes)) continue;

        const targetRect = {
          x: target.position.x,
          y: target.position.y,
          width: 200,
          height: 44,
        };

        if (rectsOverlap(draggedRect, targetRect)) {
          const currentParentId = contextNodes.find((n) => n.id === draggedNode.id)?.parentId;
          if (currentParentId !== target.id) {
            pushSnapshot();
            actions.reparentNode(draggedNode.id, target.id);
          }
          return;
        }
      }

      // No overlap - snap back by re-setting layout
      setNodes(layoutedNodes);
    },
    [getNodes, contextNodes, actions, layoutedNodes, setNodes, pushSnapshot]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'Z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      // Also support Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Don't handle if editing an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedNodeId) {
          e.preventDefault();
          clipboardRef.current = collectSubtree(selectedNodeId, contextNodes);
        }
        return;
      }

      // Paste: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboardRef.current.length > 0) {
          e.preventDefault();
          pushSnapshot();
          await actions.pasteNodes(clipboardRef.current, selectedNodeId);
        }
        return;
      }

      const selected = selectedNodeId;

      switch (e.key) {
        case 'Tab': {
          e.preventDefault();
          pushSnapshot();
          let newId: string | undefined;
          if (e.shiftKey && selected) {
            newId = await actions.addSibling(selected, contextNodes);
          } else if (selected) {
            newId = await actions.addChild(selected);
          } else if (contextNodes.length === 0) {
            newId = await actions.addChild(null);
          }
          if (newId) setSelectedNodeId(newId);
          break;
        }

        case 'Enter': {
          e.preventDefault();
          if (e.shiftKey && selected) {
            pushSnapshot();
            const newId = await actions.addParent(selected, contextNodes);
            if (newId) setSelectedNodeId(newId);
          } else if (selected) {
            window.dispatchEvent(
              new CustomEvent('mindmap:start-edit', { detail: { nodeId: selected } })
            );
          }
          break;
        }

        case 'Delete':
        case 'Backspace':
          if (selected) {
            e.preventDefault();
            pushSnapshot();
            actions.deleteNode(selected);
            setSelectedNodeId(null);
          }
          break;

        case 'Escape':
          setSelectedNodeId(null);
          break;

        case ' ':
          if (selected) {
            e.preventDefault();
            pushSnapshot();
            actions.toggleCollapse(selected, contextNodes);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (selected) {
            const children = contextNodes.filter((n) => n.parentId === selected);
            if (children.length > 0) setSelectedNodeId(children[0].id);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (selected) {
            const node = contextNodes.find((n) => n.id === selected);
            if (node?.parentId) setSelectedNodeId(node.parentId);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (selected) {
            const node = contextNodes.find((n) => n.id === selected);
            const siblings = contextNodes.filter((n) => n.parentId === node?.parentId);
            const idx = siblings.findIndex((n) => n.id === selected);
            if (idx < siblings.length - 1) setSelectedNodeId(siblings[idx + 1].id);
          } else if (contextNodes.length > 0) {
            const roots = contextNodes.filter((n) => !n.parentId);
            if (roots.length > 0) setSelectedNodeId(roots[0].id);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (selected) {
            const node = contextNodes.find((n) => n.id === selected);
            const siblings = contextNodes.filter((n) => n.parentId === node?.parentId);
            const idx = siblings.findIndex((n) => n.id === selected);
            if (idx > 0) setSelectedNodeId(siblings[idx - 1].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, contextNodes, actions, undo, redo, pushSnapshot]);

  // Apply selection state to nodes
  const nodesWithSelection = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      })),
    [nodes, selectedNodeId]
  );

  // Get context menu node data
  const contextMenuNode = contextMenu
    ? contextNodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  // Background variant from settings
  const bgVariant = backgroundVariantFromStyle(settings.backgroundStyle);

  // Build default edge options from settings (edge style, color, arrows, animation)
  const defaultEdgeOptions = useMemo(() => ({
    data: {
      edgeStyle: settings.edgeStyle,
      edgeColor: settings.edgeColor,
      showArrows: settings.showArrows,
    },
    animated: settings.edgeAnimated,
    markerEnd: settings.showArrows
      ? { type: MarkerType.ArrowClosed, color: settings.edgeColor }
      : undefined,
  }), [settings.edgeStyle, settings.edgeColor, settings.showArrows, settings.edgeAnimated]);

  return (
    <div ref={flowWrapperRef} className="h-full w-full relative" onDragOver={handleItemDragOver} onDrop={handleItemDrop}>
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        deleteKeyCode={null}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Control"
        panOnScroll={settings.panOnScroll}
        snapToGrid={settings.snapToGrid}
        snapGrid={[settings.snapGridSize, settings.snapGridSize]}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-50"
      >
        {settings.showControls && (
          <Controls
            showInteractive={false}
            className="!bg-white !border-zinc-200 !shadow-lg !rounded-lg"
          />
        )}
        {settings.showMinimap && (
          <MiniMap
            className="!bg-white !border-zinc-200 !shadow-lg !rounded-lg"
            nodeColor="#e4e4e7"
            maskColor="rgba(0, 0, 0, 0.08)"
            pannable
            zoomable
          />
        )}
        {bgVariant && <Background variant={bgVariant} gap={20} size={1} color="#e4e4e7" />}

        {/* Toolbar: Undo/Redo, Settings */}
        <Panel position="top-left">
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="px-2 py-1.5 bg-white text-zinc-600 rounded-lg border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="px-2 py-1.5 bg-white text-zinc-600 rounded-lg border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </button>
            <MindmapSettingsPanel settings={settings} onChange={handleSettingsChange} />
          </div>
        </Panel>

        {/* Empty state */}
        {contextNodes.length === 0 && (
          <Panel position="top-center">
            <div className="mt-20 text-center text-zinc-400">
              <p className="text-sm">No nodes yet</p>
              <p className="text-xs mt-1">
                Press <kbd className="px-1 bg-zinc-200 rounded text-[10px]">Tab</kbd> or click below
              </p>
              <button
                onClick={() => actions.addChild(null)}
                className="mt-3 text-sm text-blue-500 hover:underline"
              >
                Add your first node
              </button>
            </div>
          </Panel>
        )}

        {/* Add root button */}
        {contextNodes.length > 0 && (
          <Panel position="bottom-left">
            <button
              onClick={() => actions.addChild(null)}
              className="px-4 py-2 bg-white text-zinc-700 rounded-xl shadow-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm font-medium flex items-center gap-2"
              title="Add another root node"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add root
            </button>
          </Panel>
        )}

        {/* Keyboard shortcuts panel */}
        {settings.showShortcuts && (
          <Panel position="top-right">
            <div className="text-xs text-zinc-500 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-zinc-200 shadow-sm">
              <div className="font-medium text-zinc-700 mb-1">Shortcuts</div>
              <div className="space-y-0.5">
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Tab</kbd> Add child</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Shift+Tab</kbd> Add sibling</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Shift+Enter</kbd> Add parent</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Enter</kbd> Edit</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Del</kbd> Delete</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Space</kbd> Collapse/Expand</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Arrows</kbd> Navigate</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Ctrl+Z</kbd> Undo</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Ctrl+Shift+Z</kbd> Redo</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Ctrl+C</kbd> Copy subtree</div>
                <div><kbd className="px-1 bg-zinc-100 rounded text-[10px]">Ctrl+V</kbd> Paste</div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && contextMenuNode && (
        <MindmapContextMenu
          nodeId={contextMenu.nodeId}
          top={contextMenu.top}
          left={contextMenu.left}
          onClose={() => setContextMenu(null)}
          onAddParent={(id) => actions.addParent(id, contextNodes)}
          onAddChild={(id) => actions.addChild(id)}
          onAddSibling={(id) => actions.addSibling(id, contextNodes)}
          onEdit={(id) => {
            window.dispatchEvent(
              new CustomEvent('mindmap:start-edit', { detail: { nodeId: id } })
            );
          }}
          onDelete={(id) => {
            pushSnapshot();
            actions.deleteNode(id);
            if (selectedNodeId === id) setSelectedNodeId(null);
          }}
          onToggleCollapse={(id) => actions.toggleCollapse(id, contextNodes)}
          isCollapsed={contextMenuNode.metadata?.collapsed ?? false}
          hasChildren={contextNodes.some((n) => n.parentId === contextMenuNode.id)}
          currentColor={contextMenuNode.metadata?.color}
          currentStyle={contextMenuNode.metadata?.nodeStyle as string | undefined}
        />
      )}
    </div>
  );
}

// Wrap with ReactFlowProvider
export function MindmapFlow(props: MindmapFlowProps) {
  return (
    <ReactFlowProvider>
      <MindmapFlowInner {...props} />
    </ReactFlowProvider>
  );
}

// Helpers
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function isDescendant(nodeId: string, potentialAncestorId: string, nodes: ContextNode[]): boolean {
  let current = nodes.find((n) => n.id === nodeId);
  while (current) {
    if (current.parentId === potentialAncestorId) return true;
    current = nodes.find((n) => n.id === current!.parentId);
  }
  return false;
}
