'use client';

import React, { ReactNode } from 'react';

interface GridViewProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  getItemId: (item: T) => string;
}

export function GridView<T>({
  items,
  renderItem,
  getItemId,
}: GridViewProps<T>) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-400">No items</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={getItemId(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
