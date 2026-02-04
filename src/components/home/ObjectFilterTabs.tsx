'use client';

import React from 'react';

interface ObjectOption {
  id: string;
  name: string;
  icon: string;
}

interface ObjectFilterTabsProps {
  value: string;
  objects: ObjectOption[];
  onChange: (value: string) => void;
}

export const ObjectFilterTabs: React.FC<ObjectFilterTabsProps> = ({
  value,
  objects,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {/* All tab */}
      <button
        onClick={() => onChange('all')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
          value === 'all'
            ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-300'
            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
        }`}
      >
        All
      </button>

      {/* Object tabs */}
      {objects.map((obj) => (
        <button
          key={obj.id}
          onClick={() => onChange(obj.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
            value === obj.id
              ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-300'
              : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <span>{obj.icon}</span>
          <span>{obj.name}</span>
        </button>
      ))}
    </div>
  );
};
