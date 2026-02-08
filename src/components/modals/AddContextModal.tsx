'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { CONTEXT_TYPES, ContextType, DEFAULT_VIEW_STYLE, ObjectScope, ObjectType } from '@/types';

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  workspaceId: string;
  defaultScope?: ObjectScope;
  allowedScopes?: ObjectScope[];
  objects?: ObjectType[];
}

const TYPE_INFO: Record<ContextType, { label: string; icon: string; description: string }> = {
  tree: { label: 'Tree', icon: '🌳', description: 'Unlimited nested hierarchy' },
  board: { label: 'Board', icon: '📋', description: 'Groups and cards with flow' },
  canvas: { label: 'Canvas', icon: '🎨', description: 'Free-form positioning' },
};

const ICON_OPTIONS = ['📝', '📊', '🎯', '💡', '🔧', '📁', '🗂️', '📌', '🏷️', '⭐'];

export const AddContextModal: React.FC<AddContextModalProps> = ({
  isOpen,
  onClose,
  projectId,
  workspaceId,
  defaultScope = 'project',
  allowedScopes = ['global', 'workspace', 'project'],
  objects = [],
}) => {
  const addContext = useStore((state) => state.addContext);
  const syncObjectsToContext = useStore((state) => state.syncObjectsToContext);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [type, setType] = useState<ContextType>('tree');
  const [scope, setScope] = useState<ObjectScope>(defaultScope);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [showObjectPicker, setShowObjectPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleObject = (objectId: string) => {
    setSelectedObjectIds((prev) =>
      prev.includes(objectId)
        ? prev.filter((id) => id !== objectId)
        : [...prev, objectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const contextId = await addContext({
        name: name.trim(),
        icon,
        type,
        viewStyle: DEFAULT_VIEW_STYLE[type],
        scope,
        workspaceId: scope === 'global' ? null : workspaceId,
        projectId: scope === 'project' ? projectId : null,
        objectIds: selectedObjectIds.length > 0 ? selectedObjectIds : undefined,
        data: { nodes: [], edges: [] },
      });

      // Auto-sync imported objects to populate initial nodes
      if (selectedObjectIds.length > 0 && contextId) {
        await syncObjectsToContext(contextId);
      }

      setName('');
      setIcon('📝');
      setType('tree');
      setScope(defaultScope);
      setSelectedObjectIds([]);
      setShowObjectPicker(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">New Context</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Context name"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-zinc-500"
              autoFocus
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-colors ${
                    icon === opt ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Type</label>
            <div className="space-y-2">
              {CONTEXT_TYPES.map((t) => {
                const info = TYPE_INFO[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                      type === t
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div className="font-medium text-zinc-900">{info.label}</div>
                      <div className="text-xs text-zinc-500">{info.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope */}
          {allowedScopes.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Scope</label>
              <div className="flex bg-zinc-100 rounded-lg p-1">
                {allowedScopes.includes('global') && (
                  <button
                    type="button"
                    onClick={() => setScope('global')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      scope === 'global'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    🌐 Global
                  </button>
                )}
                {allowedScopes.includes('workspace') && (
                  <button
                    type="button"
                    onClick={() => setScope('workspace')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      scope === 'workspace'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    📁 Workspace
                  </button>
                )}
                {allowedScopes.includes('project') && (
                  <button
                    type="button"
                    onClick={() => setScope('project')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      scope === 'project'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    📍 Project
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {scope === 'global' && 'Available in all projects'}
                {scope === 'workspace' && 'Available in all projects of this workspace'}
                {scope === 'project' && 'Available only in this project'}
              </p>
            </div>
          )}

          {/* Link Objects (optional, collapsible) */}
          {objects.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowObjectPicker(!showObjectPicker)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showObjectPicker ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Link Objects
                {selectedObjectIds.length > 0 && (
                  <span className="text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                    {selectedObjectIds.length}
                  </span>
                )}
              </button>

              {showObjectPicker && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border border-zinc-200 rounded-lg p-2">
                  {objects.map((obj) => (
                    <label
                      key={obj.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedObjectIds.includes(obj.id)}
                        onChange={() => toggleObject(obj.id)}
                        className="rounded border-zinc-300"
                      />
                      <span className="text-base">{obj.icon}</span>
                      <span className="text-sm text-zinc-700">{obj.name}</span>
                    </label>
                  ))}
                  <p className="text-[11px] text-zinc-400 px-2 pt-1">
                    Items from linked objects will be imported as nodes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
