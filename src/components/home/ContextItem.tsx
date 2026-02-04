'use client';

import React from 'react';
import { Context } from '@/types';

interface ContextItemProps {
  context: Context;
}

export const ContextItem: React.FC<ContextItemProps> = ({
  context,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <span className="text-lg">{context.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-800 truncate">{context.name}</span>
          </div>
          <div className="text-xs text-zinc-400 capitalize">{context.type}</div>
        </div>
      </div>
    </div>
  );
};
