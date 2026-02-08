'use client';

import React from 'react';

type ViewMode = 'grid' | 'list' | 'table' | 'kanban' | 'gantt';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  options?: ViewMode[];
}

const ICONS: Record<ViewMode, React.ReactNode> = {
  grid: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  list: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  table: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  kanban: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  gantt: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="10" height="3" rx="1" />
      <rect x="7" y="10" width="14" height="3" rx="1" />
      <rect x="5" y="16" width="8" height="3" rx="1" />
    </svg>
  ),
};

const LABELS: Record<ViewMode, string> = {
  grid: 'Grid view',
  list: 'List view',
  table: 'Table view',
  kanban: 'Kanban view',
  gantt: 'Gantt view',
};

export const ViewToggle: React.FC<ViewToggleProps> = ({
  mode,
  onChange,
  options = ['grid', 'list', 'table'],
}) => {
  return (
    <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            mode === opt
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
          title={LABELS[opt]}
        >
          {ICONS[opt]}
        </button>
      ))}
    </div>
  );
};
