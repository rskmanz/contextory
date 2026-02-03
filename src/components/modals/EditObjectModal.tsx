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

    const updateObject = useStore((state) => state.updateObject);

    useEffect(() => {
        if (object) {
            setName(object.name);
            setIcon(object.icon);
            setCategory(object.category || '');
        }
    }, [object]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !object) return;

        await updateObject(object.id, { name, icon, category: category.trim() || undefined });
        onClose();
    };

    const filteredSuggestions = OBJECT_CATEGORY_SUGGESTIONS.filter(
        (s) => s.toLowerCase().includes(category.toLowerCase()) && s.toLowerCase() !== category.toLowerCase()
    );

    if (!isOpen || !object) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
