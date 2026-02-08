'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ObjectItem, ObjectType, FieldValue } from '@/types';
import { useStore } from '@/lib/store';
import { SmartEditor } from '@/components/editor';
import { FieldValueCell } from '@/components/fields';

interface NodeDetailModalProps {
  item: ObjectItem;
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  item,
  workspaceId,
  projectId,
  onClose,
}) => {
  const updateItem = useStore((state) => state.updateItem);
  const updateItemFieldValue = useStore((state) => state.updateItemFieldValue);
  const getVisibleObjects = useStore((state) => state.getVisibleObjects);

  // Live item from store (reflects type changes immediately)
  const liveItem = useStore((state) => state.items.find((i) => i.id === item.id)) || item;

  // Resolve current Object type
  const allObjects = useStore((state) => state.objects);
  const currentObject = liveItem.objectId
    ? allObjects.find((o) => o.id === liveItem.objectId)
    : null;

  // Available types for this scope
  const availableObjects = getVisibleObjects(workspaceId, projectId || '');

  const [name, setName] = useState(item.name);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Sync name when item changes externally
  useEffect(() => {
    setName(liveItem.name);
  }, [liveItem.name]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (typeDropdownOpen) {
          setTypeDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, typeDropdownOpen]);

  // Close type dropdown on click outside
  useEffect(() => {
    if (!typeDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [typeDropdownOpen]);

  // Click outside modal to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  // Save name on blur
  const handleNameBlur = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== liveItem.name) {
      updateItem(liveItem.id, { name: trimmed });
    }
  }, [name, liveItem.id, liveItem.name, updateItem]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameInputRef.current?.blur();
      }
    },
    []
  );

  // When SmartEditor creates a markdownId for the first time
  const handleMarkdownIdCreated = useCallback(
    (markdownId: string) => {
      if (!liveItem.markdownId) {
        updateItem(liveItem.id, { markdownId });
      }
    },
    [liveItem.id, liveItem.markdownId, updateItem]
  );

  // Type assignment
  const handleSelectType = useCallback(
    (obj: ObjectType | null) => {
      updateItem(liveItem.id, { objectId: obj ? obj.id : null });
      setTypeDropdownOpen(false);
    },
    [liveItem.id, updateItem]
  );

  const fields = currentObject?.fields || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="flex-1 text-lg font-semibold text-zinc-800 outline-none bg-transparent hover:bg-zinc-50 focus:bg-zinc-50 rounded px-2 py-1 -mx-2 transition-colors"
            placeholder="Untitled"
          />
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Type selector + Properties */}
        <div className="px-6 py-3 border-b border-zinc-100 space-y-3">
          {/* Type selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">Type</span>
            <div className="relative" ref={typeDropdownRef}>
              <button
                onClick={() => setTypeDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white transition-colors"
              >
                {currentObject ? (
                  <>
                    <span>{currentObject.icon}</span>
                    <span className="text-zinc-700">{currentObject.name}</span>
                  </>
                ) : (
                  <span className="text-zinc-400">No type</span>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 ml-1">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {typeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-auto">
                  {currentObject && (
                    <button
                      onClick={() => handleSelectType(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
                    >
                      <span className="text-zinc-300">-</span>
                      <span>Remove type</span>
                    </button>
                  )}
                  {availableObjects.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => handleSelectType(obj)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors ${
                        obj.id === liveItem.objectId ? 'bg-blue-50 text-blue-700' : 'text-zinc-700'
                      }`}
                    >
                      <span>{obj.icon}</span>
                      <span>{obj.name}</span>
                      {obj.id === liveItem.objectId && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto text-blue-500">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                  {availableObjects.length === 0 && (
                    <div className="px-3 py-2 text-xs text-zinc-400">No object types available</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Properties (only when type is assigned) */}
          {fields.length > 0 && (
            <div className="space-y-1">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-28 shrink-0 truncate">{field.name}</span>
                  <div className="flex-1 min-w-0">
                    <FieldValueCell
                      field={field}
                      value={liveItem.fieldValues?.[field.id] ?? null}
                      onChange={(val: FieldValue) => updateItemFieldValue(liveItem.id, field.id, val)}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor body */}
        <div className="flex-1 overflow-auto min-h-[300px]">
          <SmartEditor
            markdownId={liveItem.markdownId || undefined}
            entityId={liveItem.id}
            markdownType="items"
            onMarkdownIdCreated={handleMarkdownIdCreated}
            workspaceId={workspaceId}
            projectId={projectId}
            minimal
            placeholder="Write your notes..."
          />
        </div>
      </div>
    </div>
  );
};
