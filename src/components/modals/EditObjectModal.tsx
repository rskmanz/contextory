'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ObjectType } from '@/types';

interface EditObjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    object: ObjectType | null;
}

const objectIcons = ['📁', '📋', '📊', '🎯', '💼', '🔧', '📝', '🌟', '💬', '🤖', '✅', '📄'];

export const EditObjectModal: React.FC<EditObjectModalProps> = ({ isOpen, onClose, object }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📁');

    const updateObject = useStore((state) => state.updateObject);

    useEffect(() => {
        if (object) {
            setName(object.name);
            setIcon(object.icon);
        }
    }, [object]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !object) return;

        await updateObject(object.id, { name, icon });
        onClose();
    };

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
