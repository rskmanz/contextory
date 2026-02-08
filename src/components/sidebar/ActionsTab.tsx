'use client';

import React from 'react';
import type { ActionLogEntry } from './ChatPanel';

interface ActionsTabProps {
  actionLog: ActionLogEntry[];
  onClearLog: () => void;
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  object: { label: 'Object', color: 'bg-blue-100 text-blue-600' },
  context: { label: 'Context', color: 'bg-purple-100 text-purple-600' },
  item: { label: 'Item', color: 'bg-zinc-100 text-zinc-500' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function groupEntries(entries: ActionLogEntry[]): Array<{ group: string; icon: string; items: ActionLogEntry[] }> {
  const groups: Map<string, { icon: string; items: ActionLogEntry[] }> = new Map();
  const ungrouped: ActionLogEntry[] = [];

  for (const entry of entries) {
    if (entry.group) {
      const existing = groups.get(entry.group);
      if (existing) {
        existing.items.push(entry);
      } else {
        groups.set(entry.group, { icon: entry.groupIcon || entry.icon, items: [entry] });
      }
    } else {
      ungrouped.push(entry);
    }
  }

  const result: Array<{ group: string; icon: string; items: ActionLogEntry[] }> = [];
  for (const [group, data] of groups) {
    result.push({ group, icon: data.icon, items: data.items });
  }
  if (ungrouped.length > 0) {
    result.push({ group: '', icon: '', items: ungrouped });
  }
  return result;
}

export const ActionsTab: React.FC<ActionsTabProps> = ({ actionLog, onClearLog }) => {
  const grouped = groupEntries(actionLog);

  return (
    <div>
      <div className="px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Recent Actions</span>
          {actionLog.length > 0 && (
            <button
              onClick={onClearLog}
              className="text-[9px] text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {grouped.length > 0 ? (
          <div className="space-y-3">
            {grouped.map((g) => (
              <div key={g.group || '_ungrouped'}>
                {g.group && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">{g.icon}</span>
                    <span className="text-[11px] font-semibold text-zinc-600">{g.group}</span>
                    <span className="text-[9px] text-zinc-400 ml-auto">{g.items.length}</span>
                  </div>
                )}
                <div className="space-y-1">
                  {g.items.map((entry) => {
                    const badge = TYPE_BADGE[entry.type] || TYPE_BADGE.item;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-zinc-100 ${g.group ? 'ml-1' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-zinc-700 truncate">{entry.name}</p>
                          <div className="flex items-center gap-1">
                            <span className={`text-[8px] font-medium rounded px-1 py-0.5 ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-[9px] text-zinc-400">{timeAgo(entry.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <p className="text-[11px] text-zinc-500 mb-0.5">No actions yet</p>
            <p className="text-[10px] text-zinc-400">Use Analyze to extract and create data</p>
          </div>
        )}
      </div>
    </div>
  );
};
