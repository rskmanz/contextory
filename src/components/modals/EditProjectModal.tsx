'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Project } from '@/types';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
}

const gradients = [
    'bg-gradient-to-br from-pink-500 to-rose-600',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-green-500 to-emerald-600',
    'bg-gradient-to-br from-purple-500 to-violet-600',
    'bg-gradient-to-br from-orange-500 to-amber-600',
    'bg-gradient-to-br from-cyan-500 to-teal-600',
];

const icons = ['📊', '🚀', '💼', '🎯', '📈', '🔧', '💡', '🌟'];

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📊');
    const [gradient, setGradient] = useState(gradients[0]);
    const [category, setCategory] = useState('Side Projects');

    const updateProject = useStore((state) => state.updateProject);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setIcon(project.icon);
            setGradient(project.gradient);
            setCategory(project.category);
        }
    }, [project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !project) return;

        await updateProject(project.id, { name, icon, gradient, category });
        onClose();
    };

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Edit Project</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="Project name"
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
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {gradients.map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGradient(g)}
                                    className={`w-10 h-10 rounded-lg ${g} ${gradient === g ? 'ring-2 ring-zinc-900 ring-offset-2' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        >
                            <option>Side Projects</option>
                            <option>VCs</option>
                            <option>Main</option>
                        </select>
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
