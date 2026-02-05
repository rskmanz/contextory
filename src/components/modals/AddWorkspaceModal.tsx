'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

interface AddWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;  // Optional - if not provided, show project selector
}

const categoryIcons = ['📁', '📋', '📊', '🎯', '💼', '🔧', '📝', '🌟'];

export const AddWorkspaceModal: React.FC<AddWorkspaceModalProps> = ({ isOpen, onClose, projectId }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [categoryIcon, setCategoryIcon] = useState('📁');
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

    const addWorkspace = useStore((state) => state.addWorkspace);
    const projects = useStore((state) => state.projects);

    // Reset selectedProjectId when modal opens with a specific projectId
    useEffect(() => {
        if (isOpen) {
            setSelectedProjectId(projectId || '');
        }
    }, [isOpen, projectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const targetProjectId = projectId || selectedProjectId;
        if (!targetProjectId) return;

        await addWorkspace({ name, projectId: targetProjectId, category, categoryIcon });
        setName('');
        setCategory('General');
        setCategoryIcon('📁');
        setSelectedProjectId(projectId || '');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Add Workspace</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Project selector - only show when projectId not provided */}
                    {!projectId && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Project</label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            >
                                <option value="">Select a project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.icon} {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="Workspace name"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {categoryIcons.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCategoryIcon(i)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${categoryIcon === i ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="Category"
                        />
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
                            disabled={!name.trim() || (!projectId && !selectedProjectId)}
                            className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
