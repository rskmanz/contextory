'use client';

import React from 'react';

export type GroupByOption = 'scope' | 'project' | 'category' | 'none';

interface GroupByTabsProps {
  value: GroupByOption[];
  onChange: (value: GroupByOption[]) => void;
  options?: GroupByOption[];
}

const ALL_TAGS: { value: GroupByOption; label: string }[] = [
  { value: 'scope', label: 'Scope' },
  { value: 'project', label: 'Project' },
  { value: 'category', label: 'Category' },
];

export const GroupByTabs: React.FC<GroupByTabsProps> = ({
  value,
  onChange,
  options = ['scope', 'project', 'category'],
}) => {
  const tags = ALL_TAGS.filter(tag => options.includes(tag.value));

  const toggleTag = (tag: GroupByOption) => {
    if (value.includes(tag)) {
      // Remove tag
      const newValue = value.filter(v => v !== tag);
      onChange(newValue.length > 0 ? newValue : ['none']);
    } else {
      // Add tag, remove 'none' if present
      const newValue = value.filter(v => v !== 'none');
      onChange([...newValue, tag]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400">Group by:</span>
      <div className="flex items-center gap-1.5">
        {tags.map((tag) => {
          const isActive = value.includes(tag.value);
          return (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
