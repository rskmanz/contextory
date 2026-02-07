'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { ExtractionResult } from '@/types';
import { useStore } from '@/lib/store';
import { analyzeContent, executeExtraction } from '@/lib/extraction';
import {
  SuggestionCard,
} from '@/components/extraction/SmartPanel';

export interface ActionLogEntry {
  id: string;
  type: 'object' | 'context' | 'item';
  name: string;
  icon: string;
  timestamp: string;
}

interface AnalyzeTabProps {
  content: string;
  workspaceId: string;
  projectId?: string;
  onActionsCreated?: (entries: ActionLogEntry[]) => void;
}

export const AnalyzeTab: React.FC<AnalyzeTabProps> = ({
  content,
  workspaceId,
  projectId,
  onActionsCreated,
}) => {
  const objects = useStore((s) => s.objects);
  const aiSettings = useStore((s) => s.aiSettings);

  // EXTRACT state
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);

  // Sync selections when results change
  useEffect(() => {
    if (extractionResult?.suggestions) {
      setSelectedIds(new Set(extractionResult.suggestions.map((s) => s.id)));
    }
  }, [extractionResult]);

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

  const handleCreate = useCallback(async () => {
    if (!extractionResult) return;
    const selected = extractionResult.suggestions.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return;

    setIsExecuting(true);
    try {
      const res = await executeExtraction(selected, { workspaceId, projectId });
      const count = res.created.length;
      setSuccessMsg(`Created ${count} item${count !== 1 ? 's' : ''}`);

      // Log created items to Actions tab
      if (onActionsCreated) {
        const entries: ActionLogEntry[] = res.created.map((c) => ({
          id: c.id,
          type: c.type as 'object' | 'context' | 'item',
          name: c.name,
          icon: '\u2728',
          timestamp: new Date().toISOString(),
        }));
        onActionsCreated(entries);
      }

      setExtractionResult(null);
    } catch {
      setSuccessMsg('Failed to create. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  }, [extractionResult, selectedIds, workspaceId, projectId, onActionsCreated]);

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

    editorEl.querySelectorAll('.smart-extract-highlight').forEach((el) => {
      el.classList.remove('smart-extract-highlight');
    });

    if (!hoveredSuggestionId || !extractionResult) return;

    const suggestion = extractionResult.suggestions.find((s) => s.id === hoveredSuggestionId);
    if (!suggestion?.sourceHeading) return;

    const headingEls = editorEl.querySelectorAll('h1, h2, h3, h4');
    for (const el of headingEls) {
      if (el.textContent?.trim() === suggestion.sourceHeading) {
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

  return (
    <div>
      {/* EXTRACT Section */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Extract</span>
          <button
            onClick={handleAnalyze}
            disabled={isExtracting}
            className="px-2 py-1 text-[10px] font-medium rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center gap-1"
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

        {successMsg && (
          <div className="text-[10px] text-zinc-600 bg-zinc-100 rounded-md px-2 py-1.5 mb-2">
            {successMsg}
          </div>
        )}

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

            <button
              onClick={handleCreate}
              disabled={selectedCount === 0 || isExecuting}
              className="w-full mt-2 px-3 py-1.5 text-[10px] font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? 'Creating...' : `Create ${selectedCount} selected`}
            </button>
          </div>
        )}

        {!isExtracting && suggestions.length === 0 && !successMsg && (
          <p className="text-[10px] text-zinc-400 italic">
            Click Analyze to detect extractable content
          </p>
        )}
      </div>
    </div>
  );
};
