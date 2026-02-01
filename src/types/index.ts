// Core Data Types

export interface Project {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  category: string;
}

export interface Workspace {
  id: string;
  name: string;
  projectId: string;
  category?: string;
  categoryIcon?: string;
}

// Node within a context (tree structure)
export interface ContextNode {
  id: string;
  content: string;
  parentId: string | null;
  metadata?: {
    icon?: string;
    color?: string;
    collapsed?: boolean;
    x?: number;
    y?: number;
    [key: string]: unknown;
  };
}

// Data structure types (fixed at creation)
export const CONTEXT_TYPES = ['tree', 'board', 'canvas'] as const;
export type ContextType = typeof CONTEXT_TYPES[number];

// View styles per structure (switchable within same type)
export const VIEW_STYLES = {
  tree: ['mindmap', 'list'] as const,
  board: ['kanban', 'grid', 'flow'] as const,
  canvas: ['freeform'] as const,
} as const;

export type TreeViewStyle = 'mindmap' | 'list';
export type BoardViewStyle = 'kanban' | 'grid' | 'flow';
export type CanvasViewStyle = 'freeform';
export type ViewStyle = TreeViewStyle | BoardViewStyle | CanvasViewStyle;

// Default view style for each type
export const DEFAULT_VIEW_STYLE: Record<ContextType, ViewStyle> = {
  tree: 'list',
  board: 'grid',
  canvas: 'freeform',
};

// Edge for flow connections (used in Board views)
export interface ContextEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Context {
  id: string;
  name: string;
  icon: string;
  type: ContextType;
  viewStyle: ViewStyle;
  workspaceId: string;
  data: {
    nodes: ContextNode[];
    edges?: ContextEdge[];
  };
}

export interface ObjectType {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  workspaceId: string;
}

export interface ObjectItem {
  id: string;
  name: string;
  objectId: string;
  workspaceId: string;
  notes?: string;
  files?: string[];
  links?: string[];
}

// Category for grouping projects
export type ProjectCategory = 'Side Projects' | 'VCs' | 'Main' | string;

// Gradient options for projects
export const GRADIENT_OPTIONS = [
  'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
  'bg-gradient-to-br from-orange-300 via-orange-400 to-amber-400',
  'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-300',
  'bg-gradient-to-br from-green-300 via-emerald-400 to-teal-400',
  'bg-gradient-to-br from-cyan-300 via-cyan-400 to-sky-400',
  'bg-gradient-to-br from-blue-300 via-blue-400 to-indigo-400',
  'bg-gradient-to-br from-purple-300 via-purple-400 to-violet-400',
] as const;

// Icon options for projects
export const ICON_OPTIONS = ['👾', '🍣', '🎏', '💡', '🔥', '🌌', '🌀', '🐹', '🚀', '📦', '🎨', '💻', '📊'] as const;

// Category icon options
export const CATEGORY_ICONS = {
  'Data': '📊',
  'Development': '💻',
  'Design': '🎨',
  'Marketing': '📣',
  'Operations': '⚙️',
} as const;
