'use client';

import React, { useState } from 'react';
import { FieldDefinition, FieldType, FIELD_TYPES, SelectOption } from '@/types';
import { generateId } from '@/lib/utils';

interface FieldSchemaEditorProps {
    fields: FieldDefinition[];
    onChange: (fields: FieldDefinition[]) => void;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    checkbox: 'Checkbox',
    select: 'Select',
    multiSelect: 'Multi-select',
    url: 'URL',
    relation: 'Relation',
};

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
    text: 'bg-zinc-100 text-zinc-600',
    number: 'bg-blue-100 text-blue-700',
    date: 'bg-purple-100 text-purple-700',
    checkbox: 'bg-green-100 text-green-700',
    select: 'bg-amber-100 text-amber-700',
    multiSelect: 'bg-orange-100 text-orange-700',
    url: 'bg-cyan-100 text-cyan-700',
    relation: 'bg-pink-100 text-pink-700',
};

interface OptionEditorProps {
    options: SelectOption[];
    onOptionsChange: (options: SelectOption[]) => void;
}

const OptionEditor: React.FC<OptionEditorProps> = ({ options, onOptionsChange }) => {
    const [newLabel, setNewLabel] = useState('');

    const addOption = () => {
        const label = newLabel.trim();
        if (!label) return;
        const next = [...options, { id: generateId(), label }];
        onOptionsChange(next);
        setNewLabel('');
    };

    const removeOption = (id: string) => {
        onOptionsChange(options.filter((o) => o.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addOption();
        }
    };

    return (
        <div className="mt-2 ml-1 space-y-1.5">
            <p className="text-xs text-zinc-500 font-medium">Options</p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => (
                    <span
                        key={opt.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-full text-xs"
                    >
                        {opt.label}
                        <button
                            type="button"
                            onClick={() => removeOption(opt.id)}
                            className="text-zinc-400 hover:text-zinc-600"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-2 py-1 text-xs border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    placeholder="Add option..."
                />
                <button
                    type="button"
                    onClick={addOption}
                    disabled={!newLabel.trim()}
                    className="px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

interface AddFieldRowProps {
    onAdd: (field: FieldDefinition) => void;
    onCancel: () => void;
}

const AddFieldRow: React.FC<AddFieldRowProps> = ({ onAdd, onCancel }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<FieldType>('text');
    const [options, setOptions] = useState<SelectOption[]>([]);

    const needsOptions = type === 'select' || type === 'multiSelect';

    const handleSave = () => {
        if (!name.trim()) return;
        const field: FieldDefinition = {
            id: generateId(),
            name: name.trim(),
            type,
            ...(needsOptions && options.length > 0 ? { options } : {}),
        };
        onAdd(field);
    };

    return (
        <div className="border border-zinc-200 rounded-lg p-3 space-y-2 bg-zinc-50">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    placeholder="Field name"
                    autoFocus
                />
                <select
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value as FieldType);
                        setOptions([]);
                    }}
                    className="px-2 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer"
                >
                    {FIELD_TYPES.map((ft) => (
                        <option key={ft} value={ft}>
                            {FIELD_TYPE_LABELS[ft]}
                        </option>
                    ))}
                </select>
            </div>

            {needsOptions && (
                <OptionEditor options={options} onOptionsChange={setOptions} />
            )}

            <div className="flex items-center gap-2 justify-end pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="px-3 py-1 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export const FieldSchemaEditor: React.FC<FieldSchemaEditorProps> = ({ fields, onChange }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleAdd = (field: FieldDefinition) => {
        onChange([...fields, field]);
        setIsAdding(false);
    };

    const handleDelete = (fieldId: string) => {
        if (confirmDeleteId === fieldId) {
            onChange(fields.filter((f) => f.id !== fieldId));
            setConfirmDeleteId(null);
        } else {
            setConfirmDeleteId(fieldId);
        }
    };

    return (
        <div className="space-y-1">
            {fields.length === 0 && !isAdding && (
                <p className="text-xs text-zinc-400 py-2">No properties defined yet</p>
            )}

            {fields.map((field) => (
                <div
                    key={field.id}
                    className="group flex items-center gap-2 py-2 border-b border-zinc-100"
                >
                    <span className="text-sm text-zinc-800 flex-1 truncate">
                        {field.name}
                    </span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${FIELD_TYPE_COLORS[field.type]}`}
                    >
                        {FIELD_TYPE_LABELS[field.type]}
                    </span>
                    {field.options && field.options.length > 0 && (
                        <span className="text-xs text-zinc-400">
                            {field.options.length} opt{field.options.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => handleDelete(field.id)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100
                            ${confirmDeleteId === field.id
                                ? 'opacity-100 text-red-500 hover:bg-red-50'
                                : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                        title={
                            confirmDeleteId === field.id
                                ? 'Click again to confirm'
                                : 'Delete field'
                        }
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {confirmDeleteId === field.id ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            )}
                        </svg>
                    </button>
                </div>
            ))}

            {isAdding ? (
                <AddFieldRow
                    onAdd={handleAdd}
                    onCancel={() => setIsAdding(false)}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        setIsAdding(true);
                        setConfirmDeleteId(null);
                    }}
                    className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 py-2 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add property
                </button>
            )}
        </div>
    );
};
