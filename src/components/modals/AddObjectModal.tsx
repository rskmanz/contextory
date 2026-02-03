'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { ObjectScope } from '@/types';

interface AddObjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    workspaceId: string | null;
    defaultScope: ObjectScope;
    allowedScopes?: ObjectScope[];
}

const icons = ['👤', '🏢', '📄', '🎯', '💰', '📧', '🔗', '📋'];

const SCOPE_CONFIG = {
    global: { label: 'Global', icon: '🌐', color: 'purple' },
    project: { label: 'Project', icon: '📁', color: 'blue' },
    local: { label: 'Local', icon: '📍', color: 'gray' },
} as const;

export const AddObjectModal: React.FC<AddObjectModalProps> = ({
    isOpen,
    onClose,
    projectId,
    workspaceId,
    defaultScope,
    allowedScopes = ['global', 'project', 'local'],
}) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('👤');
    const [scope, setScope] = useState<ObjectScope>(defaultScope);

    const { addGlobalObject, addProjectObject, addLocalObject } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const objectData = { name, icon, builtIn: false };

        switch (scope) {
            case 'global':
                await addGlobalObject(objectData);
                break;
            case 'project':
                if (!projectId) return; // Guard: shouldn't happen if UI is correct
                await addProjectObject(projectId, objectData);
                break;
            case 'local':
                if (!projectId || !workspaceId) return; // Guard: shouldn't happen if UI is correct
                await addLocalObject(projectId, workspaceId, objectData);
                break;
        }

        setName('');
        setIcon('👤');
        setScope(defaultScope);
        onClose();
    };

    // Filter allowed scopes based on context
    const availableScopes = allowedScopes.filter((s) => {
        if (s === 'local' && !workspaceId) return false;
        if (s === 'project' && !projectId) return false;
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Add Object Type</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="e.g., Teams, Features, Tasks"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {icons.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${icon === i ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Scope</label>
                        <div className="flex gap-2">
                            {availableScopes.map((s) => {
                                const config = SCOPE_CONFIG[s];
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setScope(s)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                                            scope === s
                                                ? `bg-${config.color}-100 text-${config.color}-700 ring-2 ring-${config.color}-500`
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                        }`}
                                    >
                                        <span>{config.icon}</span>
                                        <span>{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">
                            {scope === 'global' && '🌐 Visible across all projects'}
                            {scope === 'project' && '📁 Visible in this project'}
                            {scope === 'local' && '📍 Visible only in this workspace'}
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                        >
                            Add Object
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
