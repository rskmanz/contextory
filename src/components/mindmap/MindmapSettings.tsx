'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { BackgroundVariant } from '@xyflow/react';
import type { LayoutDirection } from './use-mindmap-layout';

export interface MindmapSettingsState {
  layoutDirection: LayoutDirection;
  showMinimap: boolean;
  showControls: boolean;
  showShortcuts: boolean;
  backgroundStyle: 'dots' | 'lines' | 'cross' | 'none';
  snapToGrid: boolean;
  snapGridSize: number;
  animationDuration: number;
  edgeStyle: 'smoothstep' | 'bezier' | 'straight';
  edgeColor: string;
  edgeAnimated: boolean;
  showArrows: boolean;
  defaultNodeStyle: 'card' | 'dot' | 'text';
  panOnScroll: boolean;
  autoFitOnChange: boolean;
}

export const DEFAULT_SETTINGS: MindmapSettingsState = {
  layoutDirection: 'LR',
  showMinimap: true,
  showControls: true,
  showShortcuts: true,
  backgroundStyle: 'dots',
  snapToGrid: false,
  snapGridSize: 20,
  animationDuration: 300,
  edgeStyle: 'smoothstep',
  edgeColor: '#d4d4d8',
  edgeAnimated: false,
  showArrows: false,
  defaultNodeStyle: 'card',
  panOnScroll: true,
  autoFitOnChange: true,
};

export function backgroundVariantFromStyle(
  style: MindmapSettingsState['backgroundStyle']
): BackgroundVariant | null {
  switch (style) {
    case 'dots':
      return BackgroundVariant.Dots;
    case 'lines':
      return BackgroundVariant.Lines;
    case 'cross':
      return BackgroundVariant.Cross;
    case 'none':
      return null;
  }
}

const STORAGE_KEY = 'mindmap-settings';

export function loadSettings(): MindmapSettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: MindmapSettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface MindmapSettingsPanelProps {
  settings: MindmapSettingsState;
  onChange: (settings: MindmapSettingsState) => void;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-xs text-zinc-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-8 h-[18px] rounded-full transition-colors
          ${checked ? 'bg-blue-500' : 'bg-zinc-300'}
        `}
      >
        <span
          className={`
            absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform
            ${checked ? 'left-[16px]' : 'left-[2px]'}
          `}
        />
      </button>
    </label>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs text-zinc-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const EDGE_COLORS = [
  { name: 'Steel', value: '#b1b1b7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

function MindmapSettingsPanelInner({ settings, onChange }: MindmapSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const update = useCallback(
    (patch: Partial<MindmapSettingsState>) => {
      const next = { ...settings, ...patch };
      onChange(next);
    },
    [settings, onChange]
  );

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`
          px-2 py-1.5 bg-white text-zinc-600 rounded-lg border border-zinc-200 shadow-sm
          hover:bg-zinc-50 transition-colors text-xs font-medium flex items-center gap-1.5
          ${open ? 'ring-1 ring-blue-300' : ''}
        `}
        title="Mindmap Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 p-3 z-50">
          <div className="text-xs font-medium text-zinc-700 mb-2">Settings</div>

          <div className="space-y-2.5">
            {/* Layout */}
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Layout</div>
            <SelectRow
              label="Direction"
              value={settings.layoutDirection}
              options={[
                { value: 'LR', label: 'Left to Right' },
                { value: 'RL', label: 'Right to Left' },
                { value: 'TB', label: 'Top to Bottom' },
                { value: 'BT', label: 'Bottom to Top' },
              ]}
              onChange={(v) => update({ layoutDirection: v as LayoutDirection })}
            />
            <Toggle
              label="Snap to grid"
              checked={settings.snapToGrid}
              onChange={(v) => update({ snapToGrid: v })}
            />
            {settings.snapToGrid && (
              <label className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-600">Grid size</span>
                <input
                  type="number"
                  min={5}
                  max={50}
                  step={5}
                  value={settings.snapGridSize}
                  onChange={(e) => update({ snapGridSize: Number(e.target.value) || 20 })}
                  className="w-14 text-xs bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-300 text-right"
                />
              </label>
            )}
            <Toggle
              label="Auto-fit on change"
              checked={settings.autoFitOnChange}
              onChange={(v) => update({ autoFitOnChange: v })}
            />

            {/* Appearance */}
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider pt-1">Appearance</div>
            <SelectRow
              label="Background"
              value={settings.backgroundStyle}
              options={[
                { value: 'dots', label: 'Dots' },
                { value: 'lines', label: 'Lines' },
                { value: 'cross', label: 'Cross' },
                { value: 'none', label: 'None' },
              ]}
              onChange={(v) => update({ backgroundStyle: v as MindmapSettingsState['backgroundStyle'] })}
            />
            {/* Edges */}
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider pt-1">Edges</div>
            <SelectRow
              label="Edge style"
              value={settings.edgeStyle}
              options={[
                { value: 'smoothstep', label: 'Smooth Step' },
                { value: 'bezier', label: 'Bezier' },
                { value: 'straight', label: 'Straight' },
              ]}
              onChange={(v) => update({ edgeStyle: v as MindmapSettingsState['edgeStyle'] })}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">Edge color</span>
              <div className="flex items-center gap-1">
                {EDGE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => update({ edgeColor: c.value })}
                    className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                      settings.edgeColor === c.value ? 'ring-2 ring-offset-1 ring-zinc-400' : 'border-zinc-300'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <Toggle
              label="Animated edges"
              checked={settings.edgeAnimated}
              onChange={(v) => update({ edgeAnimated: v })}
            />
            <Toggle
              label="Show arrows"
              checked={settings.showArrows}
              onChange={(v) => update({ showArrows: v })}
            />
            <label className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">Animation (ms)</span>
              <input
                type="number"
                min={0}
                max={1000}
                step={50}
                value={settings.animationDuration}
                onChange={(e) => update({ animationDuration: Number(e.target.value) || 0 })}
                className="w-14 text-xs bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-300 text-right"
              />
            </label>

            {/* Nodes */}
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider pt-1">Nodes</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">Default style</span>
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                <button
                  onClick={() => update({ defaultNodeStyle: 'dot' })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    settings.defaultNodeStyle === 'dot'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                  title="Dot style"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <circle cx="6" cy="6" r="4" />
                  </svg>
                </button>
                <button
                  onClick={() => update({ defaultNodeStyle: 'card' })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    settings.defaultNodeStyle === 'card'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                  title="Card style"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="2" width="10" height="8" rx="1.5" />
                  </svg>
                </button>
                <button
                  onClick={() => update({ defaultNodeStyle: 'text' })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    settings.defaultNodeStyle === 'text'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                  title="Text style"
                >
                  <span className="font-bold text-[11px]">T</span>
                </button>
              </div>
            </div>

            {/* Visibility */}
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider pt-1">Panels</div>
            <Toggle
              label="Minimap"
              checked={settings.showMinimap}
              onChange={(v) => update({ showMinimap: v })}
            />
            <Toggle
              label="Zoom controls"
              checked={settings.showControls}
              onChange={(v) => update({ showControls: v })}
            />
            <Toggle
              label="Shortcuts panel"
              checked={settings.showShortcuts}
              onChange={(v) => update({ showShortcuts: v })}
            />

            {/* Interaction */}
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider pt-1">Interaction</div>
            <Toggle
              label="Pan on scroll"
              checked={settings.panOnScroll}
              onChange={(v) => update({ panOnScroll: v })}
            />
          </div>

          {/* Reset */}
          <button
            onClick={() => onChange(DEFAULT_SETTINGS)}
            className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-700 py-1 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

export const MindmapSettingsPanel = memo(MindmapSettingsPanelInner);
