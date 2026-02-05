'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ObjectType, OBJECT_CATEGORY_SUGGESTIONS } from '@/types';

interface EditObjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    object: ObjectType | null;
}

const objectIcons = ['📁', '📋', '📊', '🎯', '💼', '🔧', '📝', '🌟', '💬', '🤖', '✅', '📄'];

export const EditObjectModal: React.FC<EditObjectModalProps> = ({ isOpen, onClose, object }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📁');
    const [category, setCategory] = useState('');
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

    // Availability state
    const [availableGlobal, setAvailableGlobal] = useState(false);
    const [allProjects, setAllProjects] = useState(false);
    const [allWorkspaces, setAllWorkspaces] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

    const { updateObject, projects, workspaces } = useStore();

    useEffect(() => {
        if (object) {
            setName(object.name);
            setIcon(object.icon);
            setCategory(object.category || '');

            // Initialize availability from object
            setAvailableGlobal(object.availableGlobal);
            const projAvail = object.availableInProjects;
            const wsAvail = object.availableInWorkspaces;

            setAllProjects(projAvail.includes('*'));
            setAllWorkspaces(wsAvail.includes('*'));
            setSelectedProjects(projAvail.filter(id => id !== '*'));
            setSelectedWorkspaces(wsAvail.filter(id => id !== '*'));
        }
    }, [object]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !object) return;

        const updates: Partial<ObjectType> = {
            name,
            icon,
            category: category.trim() || undefined,
            availableGlobal,
            availableInProjects: allProjects ? ['*'] : selectedProjects,
            availableInWorkspaces: allWorkspaces ? ['*'] : selectedWorkspaces,
        };

        await updateObject(object.id, updates);
        onClose();
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

    const filteredSuggestions = OBJECT_CATEGORY_SUGGESTIONS.filter(
        (s) => s.toLowerCase().includes(category.toLowerCase()) && s.toLowerCase() !== category.toLowerCase()
    );

    if (!isOpen || !object) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Edit Object</h2>
                {object.builtIn && (
                    <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
                        This is a built-in object. Some properties cannot be changed.
                    </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="Object name"
                            autoFocus
                            disabled={object.builtIn}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {objectIcons.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${icon === i ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                                    disabled={object.builtIn}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setShowCategorySuggestions(true);
                            }}
                            onFocus={() => setShowCategorySuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="e.g., Work, People, Tools..."
                        />
                        {showCategorySuggestions && filteredSuggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                                {filteredSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            setCategory(suggestion);
                                            setShowCategorySuggestions(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!category && (
                            <p className="text-xs text-zinc-400 mt-1">Optional - helps organize your objects</p>
                        )}
                    </div>

                    {/* Availability Settings */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Availability</label>
                        <div className="space-y-2 mb-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={availableGlobal}
                                    onChange={(e) => setAvailableGlobal(e.target.checked)}
                                    className="rounded border-zinc-300"
                                />
                                <span className="text-sm">🌐 Available at home (global)</span>
                            </label>
                        </div>
                    </div>

                    {/* Projects availability */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Available in Projects</label>
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
                            <span className="text-sm text-zinc-700">All Projects</span>
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
                                        <span className="text-sm">{p.icon} {p.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Workspaces availability */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Available in Workspaces</label>
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
                            <span className="text-sm text-zinc-700">All Workspaces</span>
                        </label>
                        {!allWorkspaces && (
                            <div className="border border-zinc-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                                {workspaces.map((w) => {
                                    const project = projects.find(p => p.id === w.projectId);
                                    return (
                                        <label key={w.id} className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedWorkspaces.includes(w.id)}
                                                onChange={() => toggleWorkspace(w.id)}
                                                className="rounded border-zinc-300"
                                            />
                                            <span className="text-sm">{w.name}</span>
                                            <span className="text-xs text-zinc-400">({project?.name})</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
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
                            disabled={object.builtIn}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
