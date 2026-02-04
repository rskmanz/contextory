'use client';

import React, { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

interface FilterDropdownProps {
  value: string;
  options: FilterOption[];
  allLabel?: string;
  onChange: (value: string) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  options,
  allLabel = 'All',
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(o => o.id === value);
  const displayLabel = value === 'all' ? allLabel : selectedOption?.label || allLabel;
  const isFiltered = value !== 'all';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 transition-colors ${
          isFiltered
            ? 'bg-zinc-900 text-white'
            : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
        }`}
      >
        {isFiltered && selectedOption?.icon && <span>{selectedOption.icon}</span>}
        <span>{displayLabel}</span>
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
          <div className="absolute top-full left-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 min-w-[180px] max-h-72 overflow-y-auto py-1">
            <button
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm ${
                value === 'all' ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {allLabel}
            </button>
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm ${
                  value === option.id ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {option.icon && <span>{option.icon}</span>}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
