'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { ExtractionResult, ExtractionSuggestion } from '@/types';

export interface Heading {
  level: number;
  text: string;
  index: number;
}

export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  let idx = 0;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (text) {
      headings.push({ level: parseInt(match[1]), text, index: idx++ });
    }
  }
  return headings;
}

interface ExtractionPreviewProps {
  result: ExtractionResult | null;
  isLoading: boolean;
  error?: string | null;
  headings?: Heading[];
  onHeadingClick?: (heading: Heading) => void;
  onClose: () => void;
  onExecute: (selected: ExtractionSuggestion[]) => void;
}

function typeBadge(suggestion: ExtractionSuggestion): string {
  switch (suggestion.type) {
    case 'object_with_items':
      return `Object + ${suggestion.items?.length ?? 0} Items`;
    case 'context_nodes':
      return `Context - ${suggestion.nodes?.length ?? 0} nodes`;
    case 'standalone_items':
      return `${suggestion.standaloneItems?.length ?? 0} Items \u2192 ${suggestion.targetObjectName ?? 'Object'}`;
  }
}

function badgeColor(type: ExtractionSuggestion['type']): string {
  switch (type) {
    case 'object_with_items':
      return 'bg-blue-100 text-blue-700';
    case 'context_nodes':
      return 'bg-purple-100 text-purple-700';
    case 'standalone_items':
      return 'bg-amber-100 text-amber-700';
  }
}

export const ExtractionPreview: React.FC<ExtractionPreviewProps> = ({
  result,
  isLoading,
  error,
  headings = [],
  onHeadingClick,
  onClose,
  onExecute,
}) => {
  const suggestions = result?.suggestions ?? [];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(suggestions.map((s) => s.id))
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);

  // Re-sync selections when suggestions change
  React.useEffect(() => {
    setSelectedIds(new Set(suggestions.map((s) => s.id)));
    setExpandedIds(new Set());
  }, [suggestions]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedCount = selectedIds.size;

  const selectedSuggestions = useMemo(
    () => suggestions.filter((s) => selectedIds.has(s.id)),
    [suggestions, selectedIds]
  );

  const handleExecute = useCallback(async () => {
    if (selectedSuggestions.length === 0) return;
    setIsExecuting(true);
    try {
      await onExecute(selectedSuggestions);
    } finally {
      setIsExecuting(false);
    }
  }, [selectedSuggestions, onExecute]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isExecuting) {
        onClose();
      }
    },
    [onClose, isExecuting]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Smart Extract</h2>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Index / TOC Section */}
          {headings.length > 0 && (
            <IndexSection headings={headings} onHeadingClick={onHeadingClick} />
          )}

          {isLoading && <LoadingState />}
          {!isLoading && !result && <ErrorState message={error} />}
          {!isLoading && result && suggestions.length === 0 && headings.length === 0 && <EmptyState />}
          {!isLoading && result && suggestions.length === 0 && headings.length > 0 && (
            <p className="text-xs text-zinc-400 text-center py-4">No extractable data found beyond the index above.</p>
          )}
          {!isLoading && result && suggestions.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-2">
                Extract ({suggestions.length})
              </p>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    selected={selectedIds.has(s.id)}
                    expanded={expandedIds.has(s.id)}
                    onToggleSelect={() => toggleSelected(s.id)}
                    onToggleExpand={() => toggleExpanded(s.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && result && suggestions.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-zinc-100">
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={selectedCount === 0 || isExecuting}
              className="px-4 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Creating...' : `Create ${selectedCount}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Sub-components ---------- */

function IndexSection({ headings, onHeadingClick }: { headings: Heading[]; onHeadingClick?: (h: Heading) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-2 hover:text-zinc-600 transition-colors"
      >
        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}>
          &#9656;
        </span>
        Index ({headings.length})
      </button>
      {!collapsed && (
        <div className="bg-zinc-50 rounded-lg border border-zinc-100 py-2 px-3">
          {headings.map((h) => (
            <button
              key={h.index}
              onClick={() => onHeadingClick?.(h)}
              className="block w-full text-left text-[12px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded px-1.5 py-1 transition-colors truncate"
              style={{ paddingLeft: `${(h.level - 1) * 16 + 6}px` }}
            >
              <span className="text-[10px] text-zinc-400 mr-1.5 font-mono">H{h.level}</span>
              {h.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <svg className="animate-spin h-6 w-6 text-zinc-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-xs text-zinc-500">Analyzing content...</span>
    </div>
  );
}

function ErrorState({ message }: { message?: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <span className="text-sm text-zinc-500">{message || 'Something went wrong.'}</span>
      {!message && <span className="text-[11px] text-zinc-400">Please try again.</span>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <span className="text-sm text-zinc-400">No extractable data found</span>
      <span className="text-[11px] text-zinc-400">
        Try adding more structured content to your notes.
      </span>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: ExtractionSuggestion;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}

function SuggestionCard({
  suggestion,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
}: SuggestionCardProps) {
  return (
    <div className="border border-zinc-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-0.5 accent-zinc-900 rounded"
        />

        {/* Icon */}
        <span className="text-base leading-none">{suggestion.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-900 truncate">
              {suggestion.title}
            </span>
            <span
              className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${badgeColor(suggestion.type)}`}
            >
              {typeBadge(suggestion)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
            {suggestion.description}
          </p>

          {/* Expand toggle */}
          <button
            onClick={onToggleExpand}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 mt-1 flex items-center gap-1"
          >
            <span className="transition-transform" style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              &#9656;
            </span>
            {detailSummary(suggestion)}
          </button>

          {/* Expanded detail */}
          {expanded && <DetailSection suggestion={suggestion} />}
        </div>
      </div>
    </div>
  );
}

function detailSummary(s: ExtractionSuggestion): string {
  switch (s.type) {
    case 'object_with_items':
      return `${s.items?.length ?? 0} items (click to expand)`;
    case 'context_nodes':
      return `Tree with ${s.nodes?.length ?? 0} nodes`;
    case 'standalone_items':
      return `${s.standaloneItems?.length ?? 0} items`;
  }
}

function DetailSection({ suggestion }: { suggestion: ExtractionSuggestion }) {
  switch (suggestion.type) {
    case 'object_with_items':
      return (
        <div className="mt-2 space-y-1.5">
          {suggestion.fields && suggestion.fields.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Fields</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {suggestion.fields.map((f, i) => (
                  <span key={i} className="text-[11px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {suggestion.items && suggestion.items.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Items</span>
              <ul className="mt-0.5">
                {suggestion.items.map((item, i) => (
                  <li key={i} className="text-[11px] text-zinc-600 truncate">
                    &bull; {item.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'context_nodes':
      return (
        <div className="mt-2">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            Nodes ({suggestion.nodes?.length ?? 0})
          </span>
          <ul className="mt-0.5">
            {(suggestion.nodes ?? []).slice(0, 5).map((node, i) => (
              <li key={i} className="text-[11px] text-zinc-600 truncate">
                &bull; {node.content}
              </li>
            ))}
            {(suggestion.nodes?.length ?? 0) > 5 && (
              <li className="text-[11px] text-zinc-400 italic">
                +{(suggestion.nodes?.length ?? 0) - 5} more...
              </li>
            )}
          </ul>
        </div>
      );

    case 'standalone_items':
      return (
        <div className="mt-2">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            Target: {suggestion.targetObjectName}
          </span>
          <ul className="mt-0.5">
            {(suggestion.standaloneItems ?? []).map((item, i) => (
              <li key={i} className="text-[11px] text-zinc-600 truncate">
                &bull; {item.name}
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
