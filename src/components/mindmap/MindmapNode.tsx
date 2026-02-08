'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeToolbar, type NodeProps, type Node } from '@xyflow/react';
import type { MindmapNodeData, NodeStyle } from './use-mindmap-layout';
import { useStore } from '@/lib/store';

const PRESET_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Gray', value: '#6b7280' },
];

const PRESET_ICONS = ['⭐', '💡', '🔥', '❤️', '✅', '❌', '⚡', '🎯', '📌', '🔗'];

type MindmapNodeType = Node<MindmapNodeData, 'mindmap'>;

function MindmapNodeComponent({ id, data, selected }: NodeProps<MindmapNodeType>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.content);
  const inputRef = useRef<HTMLInputElement>(null);

  // Type badge lookup
  const allItems = useStore((state) => state.items);
  const allObjects = useStore((state) => state.objects);
  const sourceItemId = data.sourceItemId as string | undefined;
  const nodeItem = sourceItemId ? allItems.find(i => i.id === sourceItemId) : null;
  const nodeObjType = nodeItem?.objectId ? allObjects.find(o => o.id === nodeItem.objectId) : null;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value when content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(data.content);
    }
  }, [data.content, isEditing]);

  const handleSubmit = useCallback(() => {
    if (editValue.trim()) {
      // Dispatch custom event for the parent to handle
      window.dispatchEvent(
        new CustomEvent('mindmap:edit', { detail: { nodeId: id, content: editValue.trim() } })
      );
    }
    setIsEditing(false);
  }, [id, editValue]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleCollapseToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('mindmap:toggle-collapse', { detail: { nodeId: id } })
    );
  }, [id]);

  const handleAddChild = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('mindmap:add-child', { detail: { parentId: id } })
    );
  }, [id]);

  const handleAddSibling = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('mindmap:add-sibling', { detail: { nodeId: id } })
    );
  }, [id]);

  const handleAddParent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('mindmap:add-parent', { detail: { nodeId: id } })
    );
  }, [id]);

  const handleDeleteNode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('mindmap:delete', { detail: { nodeId: id } })
    );
  }, [id]);

  const handleOpenNode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('mindmap:open-node', { detail: { nodeId: id } })
    );
  }, [id]);

  const handleSetColor = useCallback((color: string | undefined) => {
    window.dispatchEvent(
      new CustomEvent('mindmap:set-color', { detail: { nodeId: id, color } })
    );
  }, [id]);

  const handleSetIcon = useCallback((icon: string | undefined) => {
    window.dispatchEvent(
      new CustomEvent('mindmap:set-icon', { detail: { nodeId: id, icon } })
    );
  }, [id]);

  const handleSetStyle = useCallback((style: NodeStyle) => {
    window.dispatchEvent(
      new CustomEvent('mindmap:set-style', { detail: { nodeId: id, style } })
    );
  }, [id]);

  const effectiveStyle: NodeStyle = data.nodeStyle || data.defaultNodeStyle || 'card';

  return (
    <>
      {/* Toolbar appears when selected */}
      <NodeToolbar
        isVisible={selected && !isEditing}
        position={Position.Top}
        align="center"
        offset={8}
      >
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-zinc-200 px-1 py-0.5">
          <button
            onClick={handleAddParent}
            className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            title="Add parent (Shift+Enter)"
          >
            + Parent
          </button>
          <button
            onClick={handleAddChild}
            className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            title="Add child (Tab)"
          >
            + Child
          </button>
          <button
            onClick={handleAddSibling}
            className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            title="Add sibling (Shift+Tab)"
          >
            + Sibling
          </button>
          <div className="w-px h-4 bg-zinc-200" />
          <button
            onClick={handleOpenNode}
            className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            title="Open editor"
          >
            Open
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            title="Edit (Enter)"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteNode}
            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete (Del)"
          >
            Delete
          </button>
        </div>
        {/* Color picker row */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-zinc-200 px-1.5 py-1 mt-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleSetColor(c.value)}
              className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                data.color === c.value ? 'ring-2 ring-offset-1 ring-zinc-400' : 'border-zinc-300'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          {data.color && (
            <button
              onClick={() => handleSetColor(undefined)}
              className="ml-0.5 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600 text-[10px]"
              title="Remove color"
            >
              x
            </button>
          )}
        </div>
        {/* Icon picker row */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-zinc-200 px-1.5 py-1 mt-1">
          {PRESET_ICONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSetIcon(emoji)}
              className={`w-5 h-5 flex items-center justify-center text-xs rounded transition-transform hover:scale-125 ${
                data.icon === emoji ? 'bg-zinc-200' : ''
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
          {data.icon && (
            <button
              onClick={() => handleSetIcon(undefined)}
              className="ml-0.5 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600 text-[10px]"
              title="Remove icon"
            >
              x
            </button>
          )}
        </div>
        {/* Style picker row */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-zinc-200 px-1.5 py-1 mt-1">
          <span className="text-[10px] text-zinc-400 mr-0.5">Style:</span>
          <button
            onClick={() => handleSetStyle('dot')}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              effectiveStyle === 'dot' ? 'bg-zinc-200' : 'hover:bg-zinc-100'
            }`}
            title="Dot"
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="5" fill="currentColor" className="text-zinc-500" />
            </svg>
          </button>
          <button
            onClick={() => handleSetStyle('card')}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              effectiveStyle === 'card' ? 'bg-zinc-200' : 'hover:bg-zinc-100'
            }`}
            title="Card"
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect x="1" y="3" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500" />
            </svg>
          </button>
          <button
            onClick={() => handleSetStyle('text')}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors text-xs font-bold ${
              effectiveStyle === 'text' ? 'bg-zinc-200 text-zinc-700' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
            title="Text"
          >
            T
          </button>
        </div>
      </NodeToolbar>

      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={effectiveStyle === 'dot' ? '!w-1.5 !h-1.5 !bg-zinc-300 !border-zinc-400' : '!w-2 !h-2 !bg-zinc-300 !border-zinc-400'}
      />

      {/* --- DOT style --- */}
      {effectiveStyle === 'dot' && (
        <div className="flex flex-col items-center" onDoubleClick={handleDoubleClick}>
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all text-white text-sm select-none
              ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : 'hover:scale-110'}
            `}
            style={{ backgroundColor: data.color || '#3b82f6' }}
          >
            {data.icon || data.content.charAt(0).toUpperCase()}
          </div>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') {
                  setEditValue(data.content);
                  setIsEditing(false);
                }
                e.stopPropagation();
              }}
              className="mt-1 text-[10px] text-center outline-none bg-white border border-zinc-200 rounded px-1 max-w-[80px] nodrag nowheel"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="mt-1 text-[10px] text-zinc-500 truncate max-w-[80px] select-none text-center">
              {data.content}
            </span>
          )}
          {data.collapsed && data.childCount > 0 && (
            <span className="text-[8px] text-zinc-400 bg-zinc-100 px-1 rounded-full mt-0.5">
              {data.childCount}
            </span>
          )}
        </div>
      )}

      {/* --- CARD style (original) --- */}
      {effectiveStyle === 'card' && (
        <div
          className={`
            min-w-[100px] max-w-[280px] h-[44px] px-3 flex items-center gap-2
            rounded-lg border cursor-pointer transition-all
            ${selected
              ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-200'
              : 'bg-white border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'
            }
          `}
          style={data.color ? { borderLeftWidth: 4, borderLeftColor: data.color } : undefined}
          onDoubleClick={handleDoubleClick}
        >
          {data.hasChildren && (
            <button
              onClick={handleCollapseToggle}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors nodrag"
              title={data.collapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
                className={`transition-transform ${data.collapsed ? '' : 'rotate-90'}`}
              >
                <path d="M2 1 L8 5 L2 9 Z" />
              </svg>
            </button>
          )}
          {data.icon && (
            <span className="flex-shrink-0 text-sm select-none">{data.icon}</span>
          )}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') {
                  setEditValue(data.content);
                  setIsEditing(false);
                }
                e.stopPropagation();
              }}
              className="flex-1 text-sm outline-none bg-transparent min-w-0 nodrag nowheel"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm text-zinc-700 truncate select-none">
              {data.content}
            </span>
          )}
          {nodeObjType && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-1 py-0.5 rounded">
              <span>{nodeObjType.icon}</span>
              <span>{nodeObjType.name}</span>
            </span>
          )}
          {data.collapsed && data.childCount > 0 && (
            <span className="flex-shrink-0 text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
              {data.childCount}
            </span>
          )}
        </div>
      )}

      {/* --- TEXT style --- */}
      {effectiveStyle === 'text' && (
        <div
          className={`
            flex items-center gap-1 h-[28px] px-1 cursor-pointer transition-all
            ${selected ? 'bg-blue-50 rounded' : ''}
          `}
          onDoubleClick={handleDoubleClick}
        >
          {data.icon && (
            <span className="flex-shrink-0 text-sm select-none">{data.icon}</span>
          )}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') {
                  setEditValue(data.content);
                  setIsEditing(false);
                }
                e.stopPropagation();
              }}
              className="text-sm outline-none bg-transparent min-w-0 nodrag nowheel"
              style={data.color ? { color: data.color } : undefined}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-sm truncate select-none"
              style={{ color: data.color || '#3f3f46' }}
            >
              {data.content}
            </span>
          )}
          {data.hasChildren && (
            <span
              className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: data.color || '#a1a1aa' }}
            />
          )}
        </div>
      )}

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={effectiveStyle === 'dot' ? '!w-1.5 !h-1.5 !bg-zinc-300 !border-zinc-400' : '!w-2 !h-2 !bg-zinc-300 !border-zinc-400'}
      />
    </>
  );
}

export const MindmapNode = memo(MindmapNodeComponent);
