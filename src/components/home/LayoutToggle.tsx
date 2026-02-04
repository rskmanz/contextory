'use client';

import React from 'react';

type LayoutType = 'columns' | 'grid';

interface LayoutToggleProps {
  value: LayoutType;
  onChange: (value: LayoutType) => void;
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-md transition-colors ${
          value === 'grid'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
        title="Grid view"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1"></rect>
        </svg>
      </button>
      <button
        onClick={() => onChange('columns')}
        className={`p-1.5 rounded-md transition-colors ${
          value === 'columns'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
        title="Columns view"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="5" height="18" rx="1"></rect>
          <rect x="10" y="3" width="5" height="18" rx="1"></rect>
          <rect x="17" y="3" width="5" height="18" rx="1"></rect>
        </svg>
      </button>
    </div>
  );
};
