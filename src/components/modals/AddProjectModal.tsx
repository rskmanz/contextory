'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultCategory?: string;
    existingCategories?: string[];
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

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, defaultCategory = 'Main', existingCategories = [] }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📊');
    const [gradient, setGradient] = useState(gradients[0]);
    const [category, setCategory] = useState(defaultCategory);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const addProject = useStore((state) => state.addProject);

    // Use existing categories or fall back to default
    const categories = existingCategories.length > 0 ? existingCategories : ['Main', 'Side Projects', 'VCs'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        await addProject({ name, icon, gradient, category });
        setName('');
        setIcon('📊');
        setGradient(gradients[0]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Add Project</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="Project name"
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
                        {isNewCategory ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                    placeholder="New category name"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newCategoryName.trim()) {
                                            setCategory(newCategoryName.trim());
                                        }
                                        setIsNewCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    className="px-3 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsNewCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    className="px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsNewCategory(true)}
                                    className="px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg border border-zinc-200"
                                    title="Add new category"
                                >
                                    + New
                                </button>
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
                        >
                            Add Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
