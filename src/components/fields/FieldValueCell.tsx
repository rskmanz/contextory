'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FieldDefinition, FieldValue, SelectOption } from '@/types';

interface FieldValueCellProps {
    field: FieldDefinition;
    value: FieldValue;
    onChange: (value: FieldValue) => void;
    compact?: boolean;
}

const baseInputClass = (compact: boolean) =>
    `w-full bg-transparent border border-transparent rounded px-2 transition-colors
     hover:border-zinc-200 focus:border-zinc-400 focus:outline-none
     ${compact ? 'py-0.5 text-xs' : 'py-1 text-sm'} text-zinc-900 placeholder-zinc-400`;

const TextCell: React.FC<Pick<FieldValueCellProps, 'value' | 'onChange' | 'compact'>> = ({
    value,
    onChange,
    compact = false,
}) => (
    <input
        type="text"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={baseInputClass(compact)}
        placeholder="Empty"
    />
);

const NumberCell: React.FC<Pick<FieldValueCellProps, 'value' | 'onChange' | 'compact'>> = ({
    value,
    onChange,
    compact = false,
}) => (
    <input
        type="number"
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? null : Number(raw));
        }}
        className={baseInputClass(compact)}
        placeholder="0"
    />
);

const DateCell: React.FC<Pick<FieldValueCellProps, 'value' | 'onChange' | 'compact'>> = ({
    value,
    onChange,
    compact = false,
}) => (
    <input
        type="date"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={baseInputClass(compact)}
    />
);

const CheckboxCell: React.FC<Pick<FieldValueCellProps, 'value' | 'onChange' | 'compact'>> = ({
    value,
    onChange,
    compact = false,
}) => (
    <label className={`flex items-center gap-2 cursor-pointer px-2 ${compact ? 'py-0.5' : 'py-1'}`}>
        <div className="relative flex items-center">
            <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-4 h-4 rounded border border-zinc-300 peer-checked:bg-zinc-900 peer-checked:border-zinc-900 transition-colors flex items-center justify-center">
                {!!value && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
        </div>
    </label>
);

const UrlCell: React.FC<Pick<FieldValueCellProps, 'value' | 'onChange' | 'compact'>> = ({
    value,
    onChange,
    compact = false,
}) => (
    <div className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
        </svg>
        <input
            type="url"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={baseInputClass(compact)}
            placeholder="https://..."
        />
    </div>
);

interface SelectCellProps {
    options: SelectOption[];
    value: FieldValue;
    onChange: (value: FieldValue) => void;
    compact?: boolean;
}

const SelectCell: React.FC<SelectCellProps> = ({ options, value, onChange, compact = false }) => (
    <select
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${baseInputClass(compact)} cursor-pointer appearance-none pr-6 bg-no-repeat bg-[length:16px] bg-[right_4px_center]`}
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        }}
    >
        <option value="">Select...</option>
        {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
                {opt.label}
            </option>
        ))}
    </select>
);

interface MultiSelectCellProps {
    options: SelectOption[];
    value: FieldValue;
    onChange: (value: FieldValue) => void;
    compact?: boolean;
}

const MultiSelectCell: React.FC<MultiSelectCellProps> = ({ options, value, onChange, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = Array.isArray(value) ? (value as string[]) : [];

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    const toggleOption = (optId: string) => {
        const next = selected.includes(optId)
            ? selected.filter((s) => s !== optId)
            : [...selected, optId];
        onChange(next.length > 0 ? next : null);
    };

    const getOptionLabel = (optId: string) =>
        options.find((o) => o.id === optId)?.label ?? optId;

    return (
        <div ref={ref} className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex flex-wrap gap-1 min-h-[28px] items-center cursor-pointer rounded px-1.5
                    border border-transparent hover:border-zinc-200 transition-colors
                    ${compact ? 'py-0.5' : 'py-1'}`}
            >
                {selected.length === 0 && (
                    <span className={`text-zinc-400 ${compact ? 'text-xs' : 'text-sm'}`}>
                        Select...
                    </span>
                )}
                {selected.map((optId) => (
                    <span
                        key={optId}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded text-xs"
                    >
                        {getOptionLabel(optId)}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(optId);
                            }}
                            className="text-zinc-400 hover:text-zinc-600"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}
            </div>
            {isOpen && (
                <div className="absolute z-20 mt-1 w-full min-w-[160px] bg-white border border-zinc-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleOption(opt.id)}
                            className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                            <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0
                                    ${selected.includes(opt.id)
                                        ? 'bg-zinc-900 border-zinc-900'
                                        : 'border-zinc-300'
                                    }`}
                            >
                                {selected.includes(opt.id) && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            {opt.label}
                        </button>
                    ))}
                    {options.length === 0 && (
                        <p className="px-3 py-2 text-xs text-zinc-400">No options defined</p>
                    )}
                </div>
            )}
        </div>
    );
};

export const FieldValueCell: React.FC<FieldValueCellProps> = ({
    field,
    value,
    onChange,
    compact = false,
}) => {
    switch (field.type) {
        case 'text':
            return <TextCell value={value} onChange={onChange} compact={compact} />;
        case 'number':
            return <NumberCell value={value} onChange={onChange} compact={compact} />;
        case 'date':
            return <DateCell value={value} onChange={onChange} compact={compact} />;
        case 'checkbox':
            return <CheckboxCell value={value} onChange={onChange} compact={compact} />;
        case 'select':
            return (
                <SelectCell
                    options={field.options ?? []}
                    value={value}
                    onChange={onChange}
                    compact={compact}
                />
            );
        case 'multiSelect':
            return (
                <MultiSelectCell
                    options={field.options ?? []}
                    value={value}
                    onChange={onChange}
                    compact={compact}
                />
            );
        case 'url':
            return <UrlCell value={value} onChange={onChange} compact={compact} />;
        case 'relation':
            return <TextCell value={value} onChange={onChange} compact={compact} />;
        default:
            return <TextCell value={value} onChange={onChange} compact={compact} />;
    }
};
