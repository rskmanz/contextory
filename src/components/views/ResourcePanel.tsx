'use client';

import React, { useState } from 'react';
import { Workspace, Resource } from '@/types';
import { useStore } from '@/lib/store';

interface ResourcePanelProps {
  workspace: Workspace;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const RESOURCE_ICONS = ['📄', '🔗', '📝', '📊', '🎯', '📁', '💡', '🔧'];

export const ResourcePanel: React.FC<ResourcePanelProps> = ({ workspace }) => {
  const updateWorkspace = useStore((state) => state.updateWorkspace);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('📄');

  const resources = workspace.resources || [];

  const handleAddResource = async () => {
    if (!newName.trim()) return;

    const newResource: Resource = {
      id: generateId(),
      name: newName.trim(),
      url: newUrl.trim() || undefined,
      icon: newIcon,
    };

    await updateWorkspace(workspace.id, {
      resources: [...resources, newResource],
    });

    setNewName('');
    setNewUrl('');
    setNewIcon('📄');
    setIsAdding(false);
  };

  const handleDeleteResource = async (resourceId: string) => {
    await updateWorkspace(workspace.id, {
      resources: resources.filter((r) => r.id !== resourceId),
    });
  };

  return (
    <div className="w-64 border-l border-zinc-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200">
        <h3 className="text-sm font-medium text-zinc-700">Resources</h3>
      </div>

      {/* Resources List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {resources.length === 0 && !isAdding && (
          <p className="text-xs text-zinc-400 text-center py-4">No resources yet</p>
        )}

        {resources.map((resource) => (
          <div
            key={resource.id}
            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-50"
          >
            <span className="text-sm">{resource.icon || '📄'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-800 truncate">{resource.name}</p>
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline truncate block"
                >
                  {resource.url}
                </a>
              )}
            </div>
            <button
              onClick={() => handleDeleteResource(resource.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 text-sm"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add Form */}
        {isAdding && (
          <div className="p-2 bg-zinc-50 rounded-lg space-y-2">
            <div className="flex gap-1 flex-wrap">
              {RESOURCE_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`w-7 h-7 text-sm rounded ${
                    newIcon === icon ? 'bg-zinc-200' : 'hover:bg-zinc-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Resource name"
              className="w-full px-2 py-1.5 text-sm border border-zinc-200 rounded outline-none focus:border-zinc-400"
              autoFocus
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="w-full px-2 py-1.5 text-sm border border-zinc-200 rounded outline-none focus:border-zinc-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResource}
                disabled={!newName.trim()}
                className="flex-1 px-2 py-1.5 text-xs bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isAdding && (
        <div className="p-3 border-t border-zinc-200">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg flex items-center justify-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Resource
          </button>
        </div>
      )}
    </div>
  );
};
