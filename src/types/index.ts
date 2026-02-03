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
  parentItemId?: string;  // if set, this is a sub-workspace of an item (future)
  category?: string;
  categoryIcon?: string;
  type?: string;          // department, activity, client, etc.
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
  objectIds?: string[];           // linked objects (optional)
  markdownId?: string;            // reference to .md file (optional)
  data: {
    nodes: ContextNode[];
    edges?: ContextEdge[];        // keeping for backward compatibility
  };
}

// Object scope: determines visibility
export type ObjectScope = 'global' | 'project' | 'local';

export interface ObjectType {
  id: string;
  name: string;
  icon: string;
  scope: ObjectScope;             // NEW: explicit scope
  projectId: string | null;       // null for global, set for project/local
  workspaceId: string | null;     // null for global/project, set for local
  category?: string;              // Work, People, Tools, etc.
  builtIn: boolean;
}

export interface ObjectItem {
  id: string;
  name: string;
  objectId: string;
  workspaceId: string | null;     // null = global object item
  markdownId?: string;            // reference to .md file (optional)
  contextData?: {                 // context structure (optional)
    type?: ContextType;           // 'tree' | 'board' | 'canvas' (default: 'tree')
    viewStyle?: ViewStyle;        // view style for the type (default: 'list')
    nodes: ContextNode[];
    edges?: ContextEdge[];        // for board/canvas types
  };
}

// Category for grouping projects
export type ProjectCategory = 'Side Projects' | 'VCs' | 'Main' | string;

// AI Chat Types (Phase 5.1)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: {
    projectId: string;
    workspaceId: string;
    itemId?: string;
  };
  suggestedNodes?: ContextNode[];
}

export type AIProvider = 'openai' | 'anthropic';

export interface AISettings {
  provider: AIProvider;
  model: string;
  apiKey?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isExpanded: boolean;
}

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

// Category icon options (for workspaces)
export const CATEGORY_ICONS = {
  'Data': '📊',
  'Development': '💻',
  'Design': '🎨',
  'Marketing': '📣',
  'Operations': '⚙️',
} as const;

// Object category suggestions (not enforced - category can be any string)
export const OBJECT_CATEGORY_SUGGESTIONS = [
  'Work',           // Features, Requirements, Tasks, Milestones, Sprints, Bugs
  'People',         // Teams, Stakeholders, Users, Contacts, Clients, Personas
  'Tools',          // GitHub, Slack, Figma, Jira, Linear, Notion, AWS, APIs
  'Knowledge',      // Skills, Questions, Q&A, Learnings, Notes, Insights
  'Content',        // Documents, Designs, Code, Prompts, Templates
  'Tracking',       // Reminders, Deadlines, Goals, OKRs, KPIs
  'Communication',  // Meetings, Conversations, Decisions, Feedback
  'Ideas',          // Thoughts, Ideas, Brainstorms, Hypotheses
  'External',       // News, Trends, Competitors, Market Research
  'Assets',         // Products, Services, Brands, Campaigns
] as const;

// AI Tool Call Types (for LangChain tool calling)
export interface AIToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AIToolResult {
  action: string;
  requiresConfirmation?: boolean;
  [key: string]: unknown;
}

// Pending tool call awaiting user confirmation
export interface PendingToolCall {
  toolCall: AIToolCall;
  entityName: string;
  entityType: 'project' | 'workspace' | 'object' | 'item' | 'context' | 'node';
}
