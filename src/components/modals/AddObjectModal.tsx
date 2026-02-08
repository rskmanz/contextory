'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { FieldDefinition } from '@/types';
import { FieldSchemaEditor } from '@/components/fields';

interface AddObjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    workspaceId: string | null;
    defaultScope: 'global' | 'workspace' | 'project';
    allowedScopes?: ('global' | 'workspace' | 'project')[];
}

const icons = [
  '👤', '🏢', '📄', '🎯', '💰', '📧', '🔗', '📋',
  '📊', '💼', '🔧', '📝', '🌟', '💬', '🤖', '✅',
  '📁', '🎨', '💡', '🔥', '🚀', '📦', '🎲', '🧩',
  '📌', '🗂️', '📐', '🔬', '🎵', '📸', '🌍', '⚡',
];

export const AddObjectModal: React.FC<AddObjectModalProps> = ({
    isOpen,
    onClose,
    projectId,
    workspaceId,
    defaultScope,
    allowedScopes = ['global', 'workspace', 'project'],
}) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('👤');
    const [fields, setFields] = useState<FieldDefinition[]>([]);

    // Availability state
    const [availableGlobal, setAvailableGlobal] = useState(defaultScope === 'global');
    const [allProjects, setAllProjects] = useState(defaultScope === 'global');
    const [allWorkspaces, setAllWorkspaces] = useState(defaultScope === 'global');
    const [selectedProjects, setSelectedProjects] = useState<string[]>(
        defaultScope === 'workspace' && projectId ? [projectId] : []
    );
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(
        defaultScope === 'project' && workspaceId ? [workspaceId] : []
    );

    const { addObject, objects, updateObject, projects, workspaces } = useStore();

    // Find existing object with same name
    const existingMatch = useMemo(() => {
        if (!name.trim()) return null;
        const lowerName = name.trim().toLowerCase();
        return objects.find(o => o.name.toLowerCase() === lowerName);
    }, [name, objects]);

    // Get display label for object's availability
    const getAvailabilityLabel = (obj: typeof objects[0]) => {
        if (obj.availableGlobal) return '🌐 Global';
        if (obj.availableInProjects.length > 0) return '📁 Workspace';
        return '📍 Project';
    };

    // Use existing object by extending its availability
    const handleUseExisting = async () => {
        if (!existingMatch) return;

        const updates: { availableInProjects?: string[]; availableInWorkspaces?: string[] } = {};

        if (projectId && !existingMatch.availableInProjects.includes('*') && !existingMatch.availableInProjects.includes(projectId)) {
            updates.availableInProjects = [...existingMatch.availableInProjects, projectId];
        }
        if (workspaceId && !existingMatch.availableInWorkspaces.includes('*') && !existingMatch.availableInWorkspaces.includes(workspaceId)) {
            updates.availableInWorkspaces = [...existingMatch.availableInWorkspaces, workspaceId];
        }

        if (Object.keys(updates).length > 0) {
            await updateObject(existingMatch.id, updates);
        }
        resetAndClose();
    };

    const resetAndClose = () => {
        setName('');
        setIcon('👤');
        setFields([]);
        setAvailableGlobal(defaultScope === 'global');
        setAllProjects(defaultScope === 'global');
        setAllWorkspaces(defaultScope === 'global');
        setSelectedProjects(defaultScope === 'workspace' && projectId ? [projectId] : []);
        setSelectedWorkspaces(defaultScope === 'project' && workspaceId ? [workspaceId] : []);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        await addObject({
            name,
            icon,
            builtIn: false,
            availableGlobal,
            availableInProjects: allProjects ? ['*'] : selectedProjects,
            availableInWorkspaces: allWorkspaces ? ['*'] : selectedWorkspaces,
            fields: fields.length > 0 ? fields : undefined,
        });

        resetAndClose();
    };

    const toggleProject = (id: string) => {
        setSelectedProjects(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleWorkspace = (id: string) => {
        setSelectedWorkspaces(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
    };

    // Check if scope is allowed
    const canShowGlobal = allowedScopes.includes('global');
    const canShowProject = allowedScopes.includes('workspace') && projectId;
    const canShowWorkspace = allowedScopes.includes('project') && workspaceId;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
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

                    {existingMatch && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">{existingMatch.icon}</span>
                                <span className="font-medium text-zinc-800">{existingMatch.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                    {getAvailabilityLabel(existingMatch)}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-1">
                                An object with this name already exists!
                            </p>
                            <button
                                type="button"
                                onClick={handleUseExisting}
                                className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900"
                            >
                                Extend availability of &quot;{existingMatch.name}&quot; →
                            </button>
                        </div>
                    )}

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
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Availability</label>
                        <div className="space-y-2">
                            {canShowGlobal && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={availableGlobal}
                                        onChange={(e) => setAvailableGlobal(e.target.checked)}
                                        className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm">🌐 Available at home (global)</span>
                                </label>
                            )}
                            {canShowProject && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={allProjects || selectedProjects.includes(projectId!)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedProjects(prev => [...prev, projectId!]);
                                            } else {
                                                setSelectedProjects(prev => prev.filter(p => p !== projectId));
                                            }
                                        }}
                                        className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm">📁 Available in this workspace</span>
                                </label>
                            )}
                            {canShowWorkspace && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={allWorkspaces || selectedWorkspaces.includes(workspaceId!)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedWorkspaces(prev => [...prev, workspaceId!]);
                                            } else {
                                                setSelectedWorkspaces(prev => prev.filter(w => w !== workspaceId));
                                            }
                                        }}
                                        className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm">📍 Available in this project</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {availableGlobal && (
                        <>
                            {/* Projects availability */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Available in Workspaces</label>
                                <label className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={allProjects}
                                        onChange={(e) => {
                                            setAllProjects(e.target.checked);
                                            if (e.target.checked) setSelectedProjects([]);
                                        }}
                                        className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm text-zinc-700">All Workspaces</span>
                                </label>
                                {!allProjects && (
                                    <div className="border border-zinc-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                                        {projects.map((p) => (
                                            <label key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProjects.includes(p.id)}
                                                    onChange={() => toggleProject(p.id)}
                                                    className="rounded border-zinc-300"
                                                />
                                                <span className="text-sm">{p.categoryIcon || '📁'} {p.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Workspaces availability */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Available in Projects</label>
                                <label className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={allWorkspaces}
                                        onChange={(e) => {
                                            setAllWorkspaces(e.target.checked);
                                            if (e.target.checked) setSelectedWorkspaces([]);
                                        }}
                                        className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm text-zinc-700">All Projects</span>
                                </label>
                                {!allWorkspaces && (
                                    <div className="border border-zinc-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                                        {workspaces.map((w) => (
                                                <label key={w.id} className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedWorkspaces.includes(w.id)}
                                                        onChange={() => toggleWorkspace(w.id)}
                                                        className="rounded border-zinc-300"
                                                    />
                                                    <span className="text-sm">{w.icon} {w.name}</span>
                                                </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Properties</label>
                        <FieldSchemaEditor fields={fields} onChange={setFields} />
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
                            disabled={!!existingMatch}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                existingMatch
                                    ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                            }`}
                        >
                            Add Object
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
