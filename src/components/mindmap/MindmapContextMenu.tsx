'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

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

interface ContextMenuProps {
  nodeId: string;
  top: number;
  left: number;
  onClose: () => void;
  onAddParent: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  isCollapsed: boolean;
  hasChildren: boolean;
  currentColor?: string;
  currentStyle?: string;
}

export function MindmapContextMenu({
  nodeId,
  top,
  left,
  onClose,
  onAddParent,
  onAddChild,
  onAddSibling,
  onEdit,
  onDelete,
  onToggleCollapse,
  isCollapsed,
  hasChildren,
  currentColor,
  currentStyle,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  const action = useCallback(
    (fn: (id: string) => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn(nodeId);
      onClose();
    },
    [nodeId, onClose]
  );

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-zinc-200 py-1 min-w-[180px] z-50"
      style={{ top, left }}
    >
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
        onClick={action(onAddParent)}
      >
        <span>Add parent</span>
        <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">S+Enter</kbd>
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
        onClick={action(onAddChild)}
      >
        <span>Add child</span>
        <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">Tab</kbd>
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
        onClick={action(onAddSibling)}
      >
        <span>Add sibling</span>
        <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">S+Tab</kbd>
      </button>

      <div className="my-1 border-t border-zinc-100" />

      <button
        className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
        onClick={action(onEdit)}
      >
        <span>Edit</span>
        <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">Enter</kbd>
      </button>

      {/* Color submenu */}
      <div className="relative">
        <button
          className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker((prev) => !prev);
          }}
        >
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-zinc-300"
              style={currentColor ? { backgroundColor: currentColor } : { background: 'linear-gradient(135deg, #ef4444, #3b82f6, #22c55e)' }}
            />
            Color
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-zinc-400">
            <path d="M3 1 L7 5 L3 9 Z" />
          </svg>
        </button>
        {showColorPicker && (
          <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-xl border border-zinc-200 p-2 z-50">
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(
                      new CustomEvent('mindmap:set-color', { detail: { nodeId, color: c.value } })
                    );
                    onClose();
                  }}
                  className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                    currentColor === c.value ? 'ring-2 ring-offset-1 ring-zinc-400' : 'border-zinc-300'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
            {currentColor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent('mindmap:set-color', { detail: { nodeId, color: undefined } })
                  );
                  onClose();
                }}
                className="mt-1.5 w-full text-xs text-zinc-500 hover:text-zinc-700 text-center"
              >
                Remove color
              </button>
            )}
          </div>
        )}
      </div>

      {/* Style submenu */}
      <div className="relative">
        <button
          className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowStylePicker((prev) => !prev);
          }}
        >
          <span className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-zinc-500">
              {currentStyle === 'dot' ? (
                <circle cx="6" cy="6" r="4" fill="currentColor" />
              ) : currentStyle === 'text' ? (
                <text x="2" y="10" fontSize="10" fill="currentColor" fontWeight="bold">T</text>
              ) : (
                <rect x="1" y="2" width="10" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
            Style
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-zinc-400">
            <path d="M3 1 L7 5 L3 9 Z" />
          </svg>
        </button>
        {showStylePicker && (
          <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-xl border border-zinc-200 py-1 min-w-[120px] z-50">
            {[
              { value: 'dot', label: 'Dot' },
              { value: 'card', label: 'Card' },
              { value: 'text', label: 'Text' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent('mindmap:set-style', { detail: { nodeId, style: s.value } })
                  );
                  onClose();
                }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 flex items-center gap-2 ${
                  currentStyle === s.value ? 'text-blue-600 font-medium' : 'text-zinc-700'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
                  {s.value === 'dot' && <circle cx="7" cy="7" r="5" fill="currentColor" />}
                  {s.value === 'card' && <rect x="1" y="3" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />}
                  {s.value === 'text' && <text x="3" y="12" fontSize="12" fill="currentColor" fontWeight="bold">T</text>}
                </svg>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex justify-between items-center"
        onClick={action(onDelete)}
      >
        <span>Delete</span>
        <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">Del</kbd>
      </button>

      {hasChildren && (
        <>
          <div className="my-1 border-t border-zinc-100" />
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex justify-between items-center"
            onClick={action(onToggleCollapse)}
          >
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
            <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">Space</kbd>
          </button>
        </>
      )}
    </div>
  );
}
