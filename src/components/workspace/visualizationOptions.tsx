import React from 'react';
import { ViewStyle, ContextType } from '@/types';

export interface VisualizationOption {
  viewStyle: ViewStyle;
  type: ContextType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const VISUALIZATION_OPTIONS: VisualizationOption[] = [
  {
    viewStyle: 'mindmap',
    type: 'tree',
    label: 'Mindmap',
    description: 'Visual hierarchy',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="16" cy="16" r="3" />
        <circle cx="6" cy="8" r="2" />
        <circle cx="26" cy="8" r="2" />
        <circle cx="26" cy="24" r="2" />
        <line x1="14" y1="14" x2="8" y2="9" />
        <line x1="18" y1="14" x2="24" y2="9" />
        <line x1="18" y1="18" x2="24" y2="23" />
      </svg>
    ),
  },
  {
    viewStyle: 'notes',
    type: 'tree',
    label: 'Notes',
    description: 'Rich text document',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="4" width="20" height="24" rx="2" />
        <line x1="10" y1="10" x2="22" y2="10" />
        <line x1="10" y1="15" x2="22" y2="15" />
        <line x1="10" y1="20" x2="18" y2="20" />
      </svg>
    ),
  },
  {
    viewStyle: 'kanban',
    type: 'board',
    label: 'Kanban',
    description: 'Cards in columns',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="6" width="7" height="20" rx="1" />
        <rect x="12.5" y="6" width="7" height="14" rx="1" />
        <rect x="21" y="6" width="7" height="10" rx="1" />
      </svg>
    ),
  },
  {
    viewStyle: 'flow',
    type: 'board',
    label: 'Flow',
    description: 'Connected nodes',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="12" width="6" height="6" rx="1" />
        <rect x="13" y="4" width="6" height="6" rx="1" />
        <rect x="13" y="20" width="6" height="6" rx="1" />
        <rect x="22" y="12" width="6" height="6" rx="1" />
        <line x1="10" y1="15" x2="13" y2="9" />
        <line x1="10" y1="15" x2="13" y2="21" />
        <line x1="19" y1="9" x2="22" y2="14" />
        <line x1="19" y1="21" x2="22" y2="16" />
      </svg>
    ),
  },
  {
    viewStyle: 'grid',
    type: 'board',
    label: 'Grid',
    description: 'Card layout',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="10" height="10" rx="2" />
        <rect x="18" y="4" width="10" height="10" rx="2" />
        <rect x="4" y="18" width="10" height="10" rx="2" />
        <rect x="18" y="18" width="10" height="10" rx="2" />
      </svg>
    ),
  },
  {
    viewStyle: 'table',
    type: 'board',
    label: 'Table',
    description: 'Rows and columns',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="6" width="24" height="20" rx="2" />
        <line x1="4" y1="12" x2="28" y2="12" />
        <line x1="4" y1="18" x2="28" y2="18" />
        <line x1="4" y1="24" x2="28" y2="24" />
        <line x1="12" y1="6" x2="12" y2="26" />
        <line x1="20" y1="6" x2="20" y2="26" />
      </svg>
    ),
  },
  {
    viewStyle: 'gantt',
    type: 'board',
    label: 'Gantt',
    description: 'Timeline view',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="8" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="10" y="14" width="16" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="4" y="20" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
        <line x1="4" y1="6" x2="4" y2="26" />
      </svg>
    ),
  },
  {
    viewStyle: 'freeform',
    type: 'canvas',
    label: 'Canvas',
    description: 'Free positioning',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="24" height="24" rx="2" strokeDasharray="3 2" />
        <rect x="8" y="8" width="6" height="6" rx="1" />
        <rect x="18" y="14" width="8" height="5" rx="1" />
        <circle cx="12" cy="22" r="3" />
      </svg>
    ),
  },
];
