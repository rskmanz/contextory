'use client';

import React from 'react';
import { FieldDefinition, FieldValues, FieldValue } from '@/types';
import { FieldValueCell } from './FieldValueCell';

interface FieldValueEditorProps {
    fields: FieldDefinition[];
    values: FieldValues;
    onValueChange: (fieldId: string, value: FieldValue) => void;
}

export const FieldValueEditor: React.FC<FieldValueEditorProps> = ({
    fields,
    values,
    onValueChange,
}) => {
    if (fields.length === 0) {
        return (
            <div className="py-4 text-center">
                <p className="text-sm text-zinc-400">No properties defined</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-zinc-50">
            {fields.map((field) => (
                <div key={field.id} className="flex items-center py-1.5 gap-3">
                    <span
                        className="text-sm text-zinc-500 w-28 shrink-0 truncate"
                        title={field.name}
                    >
                        {field.name}
                        {field.required && (
                            <span className="text-red-400 ml-0.5">*</span>
                        )}
                    </span>
                    <div className="flex-1 min-w-0">
                        <FieldValueCell
                            field={field}
                            value={values[field.id] ?? null}
                            onChange={(v) => onValueChange(field.id, v)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
