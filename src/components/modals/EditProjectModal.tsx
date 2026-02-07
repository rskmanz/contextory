'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Project } from '@/types';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
}

const allIcons: { emoji: string; keywords: string[] }[] = [
    { emoji: '📁', keywords: ['folder', 'file', 'directory', 'organize'] },
    { emoji: '📋', keywords: ['clipboard', 'list', 'tasks', 'notes'] },
    { emoji: '📊', keywords: ['chart', 'analytics', 'data', 'dashboard'] },
    { emoji: '🎯', keywords: ['target', 'goal', 'focus', 'aim'] },
    { emoji: '💼', keywords: ['business', 'work', 'portfolio', 'briefcase'] },
    { emoji: '🔧', keywords: ['tool', 'settings', 'wrench', 'fix'] },
    { emoji: '📝', keywords: ['memo', 'write', 'edit', 'note'] },
    { emoji: '🌟', keywords: ['star', 'favorite', 'shine', 'featured'] },
    { emoji: '💬', keywords: ['chat', 'message', 'talk', 'communication'] },
    { emoji: '🤖', keywords: ['robot', 'ai', 'bot', 'automation'] },
    { emoji: '✅', keywords: ['check', 'done', 'complete', 'success'] },
    { emoji: '📄', keywords: ['document', 'page', 'paper', 'text'] },
    { emoji: '🚀', keywords: ['rocket', 'launch', 'startup', 'speed'] },
    { emoji: '💡', keywords: ['idea', 'light', 'bulb', 'innovation'] },
    { emoji: '📈', keywords: ['growth', 'graph', 'trending', 'increase'] },
    { emoji: '🎨', keywords: ['art', 'design', 'creative', 'paint'] },
    { emoji: '🏠', keywords: ['home', 'house', 'personal', 'property'] },
    { emoji: '🔬', keywords: ['science', 'research', 'lab', 'microscope'] },
    { emoji: '📚', keywords: ['book', 'library', 'learn', 'education'] },
    { emoji: '🎮', keywords: ['game', 'gaming', 'play', 'controller'] },
    { emoji: '🛒', keywords: ['shop', 'cart', 'ecommerce', 'buy'] },
    { emoji: '💰', keywords: ['money', 'finance', 'budget', 'dollar'] },
    { emoji: '🔒', keywords: ['lock', 'security', 'private', 'safe'] },
    { emoji: '⚡', keywords: ['lightning', 'fast', 'energy', 'power'] },
    { emoji: '🌍', keywords: ['world', 'global', 'earth', 'international'] },
    { emoji: '🏢', keywords: ['office', 'building', 'company', 'corporate'] },
    { emoji: '👥', keywords: ['team', 'people', 'group', 'users'] },
    { emoji: '📧', keywords: ['email', 'mail', 'inbox', 'message'] },
    { emoji: '🔗', keywords: ['link', 'chain', 'url', 'connect'] },
    { emoji: '🎵', keywords: ['music', 'audio', 'sound', 'song'] },
    { emoji: '📸', keywords: ['camera', 'photo', 'picture', 'image'] },
    { emoji: '🏆', keywords: ['trophy', 'win', 'award', 'champion'] },
    { emoji: '❤️', keywords: ['heart', 'love', 'favorite', 'health'] },
    { emoji: '🔥', keywords: ['fire', 'hot', 'trending', 'popular'] },
    { emoji: '🌈', keywords: ['rainbow', 'color', 'diversity', 'pride'] },
    { emoji: '🧪', keywords: ['test', 'experiment', 'lab', 'chemical'] },
];

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
    const [name, setName] = useState('');
    const [categoryIcon, setCategoryIcon] = useState('📁');
    const [category, setCategory] = useState('');
    const [iconSearch, setIconSearch] = useState('');

    const updateProject = useStore((state) => state.updateProject);
    const projects = useStore((state) => state.projects);

    // Derive existing categories from projects
    const existingCategories = [...new Set(projects.map((p) => p.category).filter((c): c is string => Boolean(c)))];

    const filteredIcons = useMemo(() => {
        if (!iconSearch.trim()) return allIcons;
        const q = iconSearch.toLowerCase();
        return allIcons.filter(i =>
            i.emoji.includes(q) || i.keywords.some(k => k.includes(q))
        );
    }, [iconSearch]);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setCategoryIcon(project.categoryIcon || '📁');
            setCategory(project.category || '');
            setIconSearch('');
        }
    }, [project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !project) return;

        await updateProject(project.id, {
            name,
            categoryIcon,
            category: category.trim() || undefined,
        });
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
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Icon</label>
                        <input
                            type="text"
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 mb-2 text-sm"
                            placeholder="Search icons... (e.g. folder, chart, team)"
                        />
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                            {filteredIcons.map(({ emoji }) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setCategoryIcon(emoji)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${categoryIcon === emoji ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                            {filteredIcons.length === 0 && (
                                <p className="text-xs text-zinc-400 py-2">No icons match your search</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="Type a category name (optional)"
                        />
                        {existingCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {existingCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${category === cat ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
