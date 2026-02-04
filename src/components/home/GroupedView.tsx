'use client';

import React, { ReactNode } from 'react';

interface GroupedViewProps<T> {
  groups: Record<string, T[]>;
  renderItem: (item: T) => ReactNode;
  getItemId: (item: T) => string;
  emptyMessage?: string;
  columns?: number;
}

export function GroupedView<T>({
  groups,
  renderItem,
  getItemId,
  emptyMessage = 'No items',
  columns = 4,
}: GroupedViewProps<T>) {
  const groupEntries = Object.entries(groups);
  const hasItems = groupEntries.some(([, items]) => items.length > 0);

  if (!hasItems) {
    return <p className="text-xs text-zinc-400">{emptyMessage}</p>;
  }

  const gridClass = columns === 4
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
    : columns === 3
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  return (
    <div className="space-y-6">
      {groupEntries.map(([groupName, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={groupName} className="space-y-3">
            {groupName !== 'All' && (
              <h3 className="text-sm font-medium text-zinc-500">{groupName}</h3>
            )}
            <div className={gridClass}>
              {items.map((item) => (
                <div key={getItemId(item)}>
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
