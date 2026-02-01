'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Workspace } from '@/types';

interface EditWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Workspace | null;
}

const categoryIcons = ['📁', '📋', '📊', '🎯', '💼', '🔧', '📝', '🌟'];

export const EditWorkspaceModal: React.FC<EditWorkspaceModalProps> = ({ isOpen, onClose, workspace }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [categoryIcon, setCategoryIcon] = useState('📁');

    const updateWorkspace = useStore((state) => state.updateWorkspace);

    useEffect(() => {
        if (workspace) {
            setName(workspace.name);
            setCategory(workspace.category || 'General');
            setCategoryIcon(workspace.categoryIcon || '📁');
        }
    }, [workspace]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !workspace) return;

        await updateWorkspace(workspace.id, { name, category, categoryIcon });
        onClose();
    };

    if (!isOpen || !workspace) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Edit Workspace</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
