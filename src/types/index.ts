// Core Data Types

export interface Project {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  category: string;
}

// Resource attached to a workspace
export interface Resource {
  id: string;
  name: string;
  url?: string;
  notes?: string;
  icon?: string;
}

export interface Workspace {
  id: string;
  name: string;
  projectId: string;
  parentItemId?: string;  // if set, this is a sub-workspace of an item (future)
  category?: string;
  categoryIcon?: string;
  type?: string;          // department, activity, client, etc.
  resources?: Resource[];  // workspace-level resources
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
    // Gantt chart fields
    startDate?: string;   // ISO date string (YYYY-MM-DD)
    endDate?: string;     // ISO date string (YYYY-MM-DD)
    progress?: number;    // 0-100 percentage
    [key: string]: unknown;
  };
}

// Data structure types (fixed at creation)
export const CONTEXT_TYPES = ['tree', 'board', 'canvas'] as const;
export type ContextType = typeof CONTEXT_TYPES[number];

// View styles per structure (switchable within same type)
export const VIEW_STYLES = {
  tree: ['mindmap', 'list'] as const,
  board: ['kanban', 'grid', 'flow', 'table', 'gantt'] as const,
  canvas: ['freeform'] as const,
} as const;

export type TreeViewStyle = 'mindmap' | 'list';
export type BoardViewStyle = 'kanban' | 'grid' | 'flow' | 'table' | 'gantt';
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
  type?: ContextType;
  viewStyle?: ViewStyle;
  scope: ObjectScope;             // 'global' | 'project' | 'local'
  projectId: string | null;       // null for global, set for project/local
  workspaceId: string | null;     // null for global/project, set for local
  objectIds?: string[];           // linked objects (optional)
  markdownId?: string;            // reference to .md file (optional)
  data: {
    nodes: ContextNode[];
    edges?: ContextEdge[];        // keeping for backward compatibility
    tldrawSnapshot?: string;      // JSON stringified tldraw state for canvas view
  };
}

// Object scope: determines visibility
export type ObjectScope = 'global' | 'project' | 'local';

export interface ObjectType {
  id: string;
  name: string;
  icon: string;
  type?: string;                  // Object type for naming matching (e.g., 'task', 'note', 'person')
  category?: string;              // Work, People, Tools, etc.
  builtIn: boolean;
  // Availability flags
  availableGlobal: boolean;       // Available at root/home level (outside projects)
  availableInProjects: string[];  // ['*'] = all, or specific project IDs
  availableInWorkspaces: string[]; // ['*'] = all, or specific workspace IDs
}

// Common object types for naming matching
export const OBJECT_TYPE_SUGGESTIONS = [
  'task',
  'note',
  'person',
  'meeting',
  'document',
  'idea',
  'bug',
  'feature',
  'goal',
  'question',
] as const;

// Layout options for item view
export type ItemViewLayout = 'side-by-side' | 'tabs' | 'stacked' | 'visualization' | 'markdown';

export interface ObjectItem {
  id: string;
  name: string;
  objectId: string;
  workspaceId: string | null;     // null = global object item
  markdownId?: string;            // reference to .md file (optional)
  viewLayout?: ItemViewLayout;    // layout for markdown + visualization (default: 'visualization')
  contextData?: {                 // context structure (optional)
    type?: ContextType;           // 'tree' | 'board' | 'canvas' (default: 'tree')
    viewStyle?: ViewStyle;        // view style for the type (default: 'list')
    nodes: ContextNode[];
    edges?: ContextEdge[];        // for board/canvas types
    tldrawSnapshot?: string;      // JSON stringified tldraw state for canvas view
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

// Pinned tabs for home view (stored in settings)
export interface HomeSettings {
  pinnedObjectTabs: string[];  // Object IDs to show as tabs
}

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
