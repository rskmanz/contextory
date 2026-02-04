'use client';

import React, { useState } from 'react';

export type GroupByOption = 'scope' | 'project' | 'category' | 'none';

interface GroupByDropdownProps {
  value: GroupByOption;
  onChange: (value: GroupByOption) => void;
}

const OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: 'scope', label: 'Scope' },
  { value: 'project', label: 'Project' },
  { value: 'category', label: 'Category' },
  { value: 'none', label: 'None' },
];

export const GroupByDropdown: React.FC<GroupByDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = OPTIONS.find(o => o.value === value)?.label || 'Scope';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <span className="text-zinc-400">Group by:</span>
        <span className="font-medium">{selectedLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 min-w-[120px] py-1">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm ${
                  value === option.value
                    ? 'bg-zinc-100 text-zinc-900 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
