'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';

interface AddObjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

const icons = ['👤', '🏢', '📄', '🎯', '💰', '📧', '🔗', '📋'];

export const AddObjectModal: React.FC<AddObjectModalProps> = ({ isOpen, onClose, workspaceId }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('👤');

    const addObject = useStore((state) => state.addObject);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        await addObject({ name, icon, workspaceId, builtIn: false });
        setName('');
        setIcon('👤');
        onClose();
    };

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
                            placeholder="e.g., People, Companies, Tasks"
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
