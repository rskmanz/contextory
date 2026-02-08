'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ExtractionResult, ExtractionSuggestion, ViewStyle } from '@/types';
import { useStore } from '@/lib/store';
import { analyzeContent, executeExtraction } from '@/lib/extraction';

/* ─── Types ─── */

export interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

interface SmartPanelProps {
  content: string;
  workspaceId: string;
  projectId?: string;
  isOpen: boolean;
  onToggle: () => void;
}

/* ─── Heading Parser ─── */

export function parseHeadings(html: string, format: 'html' | 'markdown' = 'html'): HeadingItem[] {
  if (format === 'markdown') {
    return parseMarkdownHeadings(html);
  }
  const regex = /<(h[1-3])[^>]*>(.*?)<\/\1>/gi;
  const headings: HeadingItem[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1][1], 10);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (text) {
      headings.push({ level, text, id: `heading-${headings.length}` });
    }
  }
  return headings;
}

function parseMarkdownHeadings(md: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = md.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      if (text) {
        headings.push({ level, text, id: `heading-${headings.length}` });
      }
    }
  }
  return headings;
}

/* ─── View Style Labels ─── */

export const VIEW_STYLE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  flow: { label: 'Flow', icon: '\u2192', color: 'bg-emerald-100 text-emerald-700' },
  kanban: { label: 'Kanban', icon: '\u2630', color: 'bg-sky-100 text-sky-700' },
  mindmap: { label: 'Mindmap', icon: '\u26A1', color: 'bg-violet-100 text-violet-700' },
  gantt: { label: 'Gantt', icon: '\uD83D\uDCC5', color: 'bg-orange-100 text-orange-700' },
  notes: { label: 'Notes', icon: '\uD83D\uDCDD', color: 'bg-purple-100 text-purple-700' },
  grid: { label: 'Grid', icon: '\u25A6', color: 'bg-purple-100 text-purple-700' },
  table: { label: 'Table', icon: '\u2637', color: 'bg-purple-100 text-purple-700' },
};

export function getViewBadge(viewStyle?: ViewStyle): { label: string; color: string } {
  const info = viewStyle ? VIEW_STYLE_INFO[viewStyle] : null;
  return info
    ? { label: `${info.icon} ${info.label}`, color: info.color }
    : { label: 'Context', color: 'bg-purple-100 text-purple-700' };
}

/* ─── Suggestion Badge ─── */

export function typeBadge(s: ExtractionSuggestion): string {
  switch (s.type) {
    case 'object_with_items':
      return `Object + ${s.items?.length ?? 0} items`;
    case 'context_nodes': {
      const badge = getViewBadge(s.viewStyle);
      return `${badge.label} \u00B7 ${s.nodes?.length ?? 0} nodes`;
    }
    case 'standalone_items':
      return `${s.standaloneItems?.length ?? 0} items \u2192 ${s.targetObjectName ?? 'Object'}`;
  }
}

export function badgeColor(s: ExtractionSuggestion): string {
  switch (s.type) {
    case 'object_with_items':
      return 'bg-blue-100 text-blue-700';
    case 'context_nodes':
      return getViewBadge(s.viewStyle).color;
    case 'standalone_items':
      return 'bg-amber-100 text-amber-700';
  }
}

export function entityLabel(s: ExtractionSuggestion): string | null {
  switch (s.type) {
    case 'object_with_items':
      return s.objectName ? `Object: "${s.objectName}"` : 'Object';
    case 'context_nodes':
      return s.contextName ? `Context: "${s.contextName}"` : 'Context';
    case 'standalone_items':
      return s.targetObjectName ? `\u2192 ${s.targetObjectName}` : null;
  }
}

/* ─── Main Component ─── */

export const SmartPanel: React.FC<SmartPanelProps> = ({
  content,
  workspaceId,
  projectId,
  isOpen,
  onToggle,
}) => {
  const objects = useStore((s) => s.objects);
  const aiSettings = useStore((s) => s.aiSettings);

  // INDEX state
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [indexCollapsed, setIndexCollapsed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // EXTRACT state
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);

  // Parse headings from content (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setHeadings(parseHeadings(content));
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content]);

  // Sync selections when results change
  useEffect(() => {
    if (extractionResult?.suggestions) {
      setSelectedIds(new Set(extractionResult.suggestions.map((s) => s.id)));
    }
  }, [extractionResult]);

  // Handle heading click → scroll to heading in editor
  const handleHeadingClick = useCallback((heading: HeadingItem) => {
    const editorEl = document.querySelector('.ProseMirror');
    if (!editorEl) return;
    const headingEls = editorEl.querySelectorAll('h1, h2, h3');
    for (const el of headingEls) {
      if (el.textContent?.trim() === heading.text) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }, []);

  // Handle extract
  const handleAnalyze = useCallback(async () => {
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return;

    setIsExtracting(true);
    setExtractionResult(null);
    setSuccessMsg('');

    try {
      const existingObjects = objects.map((o) => ({ id: o.id, name: o.name, icon: o.icon }));
      const result = await analyzeContent({
        content: text,
        provider: aiSettings.provider,
        model: aiSettings.model,
        apiKey: aiSettings.apiKey,
        existingObjects,
        workspaceId,
        projectId,
      });
      setExtractionResult(result);
    } catch (err) {
      console.error('Extraction failed:', err);
      setExtractionResult({ suggestions: [], summary: 'Extraction failed. Please try again.' });
    } finally {
      setIsExtracting(false);
    }
  }, [content, objects, aiSettings, workspaceId, projectId]);

  // Handle create
  const handleCreate = useCallback(async () => {
    if (!extractionResult) return;
    const selected = extractionResult.suggestions.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return;

    setIsExecuting(true);
    try {
      const res = await executeExtraction(selected, { workspaceId, projectId });
      const count = res.created.length;
      setSuccessMsg(`Created ${count} item${count !== 1 ? 's' : ''}`);
      setExtractionResult(null);
    } catch {
      setSuccessMsg('Failed to create. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  }, [extractionResult, selectedIds, workspaceId, projectId]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Source highlighting on hover
  useEffect(() => {
    const editorEl = document.querySelector('.ProseMirror');
    if (!editorEl) return;

    // Remove all existing highlights
    editorEl.querySelectorAll('.smart-extract-highlight').forEach((el) => {
      el.classList.remove('smart-extract-highlight');
    });

    if (!hoveredSuggestionId || !extractionResult) return;

    const suggestion = extractionResult.suggestions.find((s) => s.id === hoveredSuggestionId);
    if (!suggestion?.sourceHeading) return;

    const headingEls = editorEl.querySelectorAll('h1, h2, h3, h4');
    for (const el of headingEls) {
      if (el.textContent?.trim() === suggestion.sourceHeading) {
        // Highlight the heading and sibling content until next heading
        let sibling: Element | null = el as Element;
        while (sibling) {
          sibling.classList.add('smart-extract-highlight');
          sibling = sibling.nextElementSibling;
          if (sibling && /^H[1-4]$/i.test(sibling.tagName)) break;
        }
        break;
      }
    }
  }, [hoveredSuggestionId, extractionResult]);

  const suggestions = extractionResult?.suggestions ?? [];
  const selectedCount = selectedIds.size;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-64 border-l border-zinc-200 bg-zinc-50/50 flex flex-col h-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Smart Panel</span>
        <button
          onClick={onToggle}
          className="text-zinc-400 hover:text-zinc-600 p-0.5"
          title="Close panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* INDEX Section */}
        <div className="px-3 py-3 border-b border-zinc-100">
          <button
            onClick={() => setIndexCollapsed((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 hover:text-zinc-600 transition-colors w-full"
          >
            <span style={{ display: 'inline-block', transform: indexCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}>
              &#9656;
            </span>
            Index{headings.length > 0 ? ` (${headings.length})` : ''}
          </button>
          {!indexCollapsed && (
            headings.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic ml-4">No headings yet</p>
            ) : (
              <ul className="space-y-0.5">
                {headings.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => handleHeadingClick(h)}
                      className="text-[11px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded px-1 py-0.5 w-full text-left truncate transition-colors"
                      style={{ paddingLeft: `${(h.level - 1) * 12 + 4}px` }}
                    >
                      {h.text}
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>

        {/* EXTRACT Section */}
        <div className="px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Extract</span>
            <button
              onClick={handleAnalyze}
              disabled={isExtracting}
              className="px-2 py-1 text-[10px] font-medium rounded-md bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {isExtracting ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="text-[11px] text-emerald-600 bg-emerald-50 rounded-md px-2 py-1.5 mb-2">
              {successMsg}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  selected={selectedIds.has(s.id)}
                  onToggleSelect={() => toggleSelected(s.id)}
                  onHover={() => setHoveredSuggestionId(s.id)}
                  onLeave={() => setHoveredSuggestionId(null)}
                />
              ))}

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={selectedCount === 0 || isExecuting}
                className="w-full mt-2 px-3 py-1.5 text-[11px] font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? 'Creating...' : `Create ${selectedCount} selected`}
              </button>
            </div>
          )}

          {/* Empty / no extraction yet */}
          {!isExtracting && suggestions.length === 0 && !successMsg && (
            <p className="text-[11px] text-zinc-400 italic">
              Click Analyze to detect extractable content
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Suggestion Card ─── */

export interface SuggestionCardProps {
  suggestion: ExtractionSuggestion;
  selected: boolean;
  onToggleSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}

export function SuggestionCard({ suggestion, selected, onToggleSelect, onHover, onLeave }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border border-zinc-200 rounded-lg p-2 bg-white"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-start gap-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-0.5 accent-zinc-900 rounded shrink-0"
        />
        <span className="text-sm leading-none shrink-0">{suggestion.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-medium text-zinc-900 truncate">{suggestion.title}</span>
          </div>
          {entityLabel(suggestion) && (
            <p className="text-[10px] text-zinc-500 mt-0.5">{entityLabel(suggestion)}</p>
          )}
          <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-medium rounded ${badgeColor(suggestion)}`}>
            {typeBadge(suggestion)}
          </span>
          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{suggestion.description}</p>

          {/* Source reference */}
          {suggestion.sourceHeading && (
            <p className="text-[9px] text-zinc-400 mt-0.5 italic">
              From: {suggestion.sourceHeading}
            </p>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-zinc-400 hover:text-zinc-600 mt-1 flex items-center gap-0.5"
          >
            <span style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              &#9656;
            </span>
            {expanded ? 'Hide' : 'Show'} content
          </button>

          {/* Expanded content preview */}
          {expanded && <ContentPreview suggestion={suggestion} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Content Preview ─── */

export function ContentPreview({ suggestion }: { suggestion: ExtractionSuggestion }) {
  switch (suggestion.type) {
    case 'object_with_items':
      return (
        <div className="mt-1.5 space-y-1">
          {suggestion.fields && suggestion.fields.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-zinc-400 uppercase">Fields</span>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {suggestion.fields.map((f, i) => (
                  <span key={i} className="text-[10px] bg-zinc-100 text-zinc-600 px-1 py-0.5 rounded">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {suggestion.items && suggestion.items.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-zinc-400 uppercase">Items</span>
              <ul className="mt-0.5">
                {suggestion.items.slice(0, 8).map((item, i) => (
                  <li key={i} className="text-[10px] text-zinc-600 truncate">&bull; {item.name}</li>
                ))}
                {suggestion.items.length > 8 && (
                  <li className="text-[10px] text-zinc-400 italic">+{suggestion.items.length - 8} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );

    case 'context_nodes':
      return (
        <div className="mt-1.5">
          <span className="text-[9px] font-medium text-zinc-400 uppercase">Nodes</span>
          <ul className="mt-0.5">
            {(suggestion.nodes ?? []).slice(0, 6).map((node, i) => (
              <li key={i} className="text-[10px] text-zinc-600 truncate">
                {node.parentIndex != null ? '\u00A0\u00A0' : ''}&bull; {node.content}
              </li>
            ))}
            {(suggestion.nodes?.length ?? 0) > 6 && (
              <li className="text-[10px] text-zinc-400 italic">+{(suggestion.nodes?.length ?? 0) - 6} more</li>
            )}
          </ul>
        </div>
      );

    case 'standalone_items':
      return (
        <div className="mt-1.5">
          <span className="text-[9px] font-medium text-zinc-400 uppercase">
            Target: {suggestion.targetObjectName}
          </span>
          <ul className="mt-0.5">
            {(suggestion.standaloneItems ?? []).map((item, i) => (
              <li key={i} className="text-[10px] text-zinc-600 truncate">&bull; {item.name}</li>
            ))}
          </ul>
        </div>
      );
  }
}
