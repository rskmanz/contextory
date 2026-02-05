'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ObjectItem } from '@/types';

interface CopyItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ObjectItem | null;
}

export const CopyItemModal: React.FC<CopyItemModalProps> = ({ isOpen, onClose, item }) => {
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

    const { projects, workspaces, copyItem } = useStore();

    // Filter workspaces based on selected project
    const filteredWorkspaces = useMemo(() => {
        if (!selectedProject) return [];
        return workspaces.filter(w => w.projectId === selectedProject);
    }, [selectedProject, workspaces]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || !selectedWorkspace) return;

        await copyItem(item.id, selectedWorkspace);
        handleClose();
    };

    const handleClose = () => {
        setSelectedProject('');
        setSelectedWorkspace('');
        onClose();
    };

    // Reset workspace when project changes
    const handleProjectChange = (projectId: string) => {
        setSelectedProject(projectId);
        setSelectedWorkspace('');
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Copy Item</h2>
                <p className="text-sm text-zinc-500 mb-4">
                    Copy &quot;{item.name}&quot; to another workspace
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Project selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Project</label>
                        <select
                            value={selectedProject}
                            onChange={(e) => handleProjectChange(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                        >
                            <option value="">Select project...</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.icon} {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Workspace selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Workspace</label>
                        <select
                            value={selectedWorkspace}
                            onChange={(e) => setSelectedWorkspace(e.target.value)}
                            disabled={!selectedProject}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                        >
                            <option value="">
                                {selectedProject ? 'Select workspace...' : 'Select project first'}
                            </option>
                            {filteredWorkspaces.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.categoryIcon || '📁'} {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedWorkspace}
                            className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                        >
                            Copy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
