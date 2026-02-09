// Core Data Types

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  category: string;
  resources?: Resource[];
}

// Resource attached to a project
export interface Resource {
  id: string;
  name: string;
  type: 'url' | 'file' | 'note' | 'research';
  url?: string;
  content?: string;
  summary?: string;
  icon?: string;
  notes?: string;
  addedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  parentItemId?: string;  // if set, this is a sub-project of an item (future)
  category?: string;
  categoryIcon?: string;
  type?: string;          // department, activity, client, etc.
  resources?: Resource[];  // project-level resources
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
    /** References another Context.id — enables context-to-context links (e.g., sidebar grouping) */
    sourceContextId?: string;
    [key: string]: unknown;
  };
}

// Data structure types (fixed at creation)
export const CONTEXT_TYPES = ['tree', 'board', 'canvas'] as const;
export type ContextType = typeof CONTEXT_TYPES[number];

// View styles per structure (switchable within same type)
export const VIEW_STYLES = {
  tree: ['mindmap', 'notes'] as const,
  board: ['kanban', 'grid', 'flow', 'table', 'gantt'] as const,
  canvas: ['freeform'] as const,
} as const;

export type TreeViewStyle = 'mindmap' | 'notes';
export type BoardViewStyle = 'kanban' | 'grid' | 'flow' | 'table' | 'gantt';
export type CanvasViewStyle = 'freeform';
export type ViewStyle = TreeViewStyle | BoardViewStyle | CanvasViewStyle;

// Default view style for each type
export const DEFAULT_VIEW_STYLE: Record<ContextType, ViewStyle> = {
  tree: 'notes',
  board: 'grid',
  canvas: 'freeform',
};

// Infer context type from view style
export function getContextTypeFromViewStyle(viewStyle: ViewStyle): ContextType {
  if ((VIEW_STYLES.tree as readonly string[]).includes(viewStyle)) return 'tree';
  if ((VIEW_STYLES.board as readonly string[]).includes(viewStyle)) return 'board';
  return 'canvas';
}

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
  scope: ObjectScope;             // 'global' | 'workspace' | 'project'
  workspaceId: string | null;     // null for global, set for workspace/project
  projectId: string | null;       // null for global/workspace, set for project
  objectIds?: string[];           // linked objects (optional)
  markdownId?: string;            // reference to .md file (optional)
  data: {
    nodes: ContextNode[];
    edges?: ContextEdge[];        // keeping for backward compatibility
    tldrawSnapshot?: string;      // JSON stringified tldraw state for canvas view
    tableColumns?: Array<{ id: string; name: string }>;  // dynamic table column definitions
  };
}

// Object scope: determines visibility
export type ObjectScope = 'global' | 'workspace' | 'project';

// Connection types for external app integrations
export const CONNECTION_TYPES = ['google_docs', 'notion', 'github', 'slack', 'jira', 'linear', 'custom'] as const;
export type ConnectionType = typeof CONNECTION_TYPES[number];

export interface Connection {
  id: string;
  name: string;
  type: ConnectionType;
  url?: string;
  config?: Record<string, unknown>;
  icon?: string;
  scope: ObjectScope;
  workspaceId?: string;
  projectId?: string;
}

export const CONNECTION_TYPE_INFO: Record<ConnectionType, { label: string; icon: string }> = {
  google_docs: { label: 'Google Docs', icon: '📄' },
  notion: { label: 'Notion', icon: '📝' },
  github: { label: 'GitHub', icon: '🐙' },
  slack: { label: 'Slack', icon: '💬' },
  jira: { label: 'Jira', icon: '🎯' },
  linear: { label: 'Linear', icon: '📐' },
  custom: { label: 'Custom', icon: '🔗' },
};

// Workflow step types for AI task flows
export const WORKFLOW_STEP_TYPES = ['research', 'summarize', 'create_item', 'add_resource', 'generate_context', 'custom_prompt'] as const;
export type WorkflowStepType = typeof WORKFLOW_STEP_TYPES[number];

export const WORKFLOW_STEP_INFO: Record<WorkflowStepType, { label: string; icon: string; description: string }> = {
  research: { label: 'Research', icon: '\u{1F50D}', description: 'AI web research on a topic' },
  summarize: { label: 'Summarize', icon: '\u{1F4DD}', description: 'Summarize previous step output' },
  create_item: { label: 'Create Item', icon: '\u{1F4C4}', description: 'Create an item from results' },
  add_resource: { label: 'Add Resource', icon: '\u{1F4CE}', description: 'Save result as a resource' },
  generate_context: { label: 'Generate Context', icon: '\u{1F333}', description: 'Create context tree from text' },
  custom_prompt: { label: 'Custom Prompt', icon: '\u{2728}', description: 'Run a custom AI prompt' },
};

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: {
    topic?: string;
    prompt?: string;
    objectId?: string;
    target?: 'workspace' | 'project';
    targetId?: string;
    contextId?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  icon?: string;
  scope: ObjectScope;
  workspaceId?: string;
  projectId?: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

// Field types for object schema definition
export const FIELD_TYPES = ['text', 'number', 'select', 'multiSelect', 'date', 'checkbox', 'url', 'relation'] as const;
export type FieldType = typeof FIELD_TYPES[number];

export interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  required?: boolean;
  options?: SelectOption[];
  relationObjectId?: string;
}

export type FieldValue = string | number | boolean | string[] | null;
export type FieldValues = Record<string, FieldValue>;

export interface ObjectType {
  id: string;
  name: string;
  icon: string;
  type?: string;                  // Object type for naming matching (e.g., 'task', 'note', 'person')
  category?: string;              // Work, People, Tools, etc.
  builtIn: boolean;
  // Availability flags
  availableGlobal: boolean;       // Available at root/home level (outside workspaces)
  availableInWorkspaces: string[];  // ['*'] = all, or specific workspace IDs
  availableInProjects: string[]; // ['*'] = all, or specific project IDs
  fields?: FieldDefinition[];     // Schema: columns for this object type
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
  objectId: string | null;      // null = not in any Object (e.g., context-only item)
  contextId?: string | null;    // belongs to a Context (node = Markdown + Property)
  projectId: string | null;     // null = workspace or global item
  workspaceId?: string | null;  // null = global item; set = workspace or project item
  markdownId?: string;            // reference to .md file (optional)
  viewLayout?: ItemViewLayout;    // layout for markdown + visualization (default: 'visualization')
  fieldValues?: FieldValues;      // per-item field values keyed by FieldDefinition.id
  contextData?: {                 // context structure (optional)
    type?: ContextType;           // 'tree' | 'board' | 'canvas' (default: 'tree')
    viewStyle?: ViewStyle;        // view style for the type (default: 'notes')
    nodes: ContextNode[];
    edges?: ContextEdge[];        // for board/canvas types
    tldrawSnapshot?: string;      // JSON stringified tldraw state for canvas view
  };
}

// Category for grouping workspaces
export type WorkspaceCategory = string;

// AI Chat Types (Phase 5.1)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: {
    workspaceId: string;
    projectId: string;
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

export interface UserSettings {
  displayName: string;
  defaultViewMode: 'grid' | 'list' | 'table';
  theme: 'light' | 'dark';
  showRightSidebar: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isExpanded: boolean;
}

// Gradient options for workspaces
export const GRADIENT_OPTIONS = [
  'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
  'bg-gradient-to-br from-orange-300 via-orange-400 to-amber-400',
  'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-300',
  'bg-gradient-to-br from-green-300 via-emerald-400 to-teal-400',
  'bg-gradient-to-br from-cyan-300 via-cyan-400 to-sky-400',
  'bg-gradient-to-br from-blue-300 via-blue-400 to-indigo-400',
  'bg-gradient-to-br from-purple-300 via-purple-400 to-violet-400',
] as const;

// Icon options for workspaces
export const ICON_OPTIONS = ['👾', '🍣', '🎏', '💡', '🔥', '🌌', '🌀', '🐹', '🚀', '📦', '🎨', '💻', '📊'] as const;

// Category icon options (for projects)
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

// Smart Extraction Types
export type ExtractionType = 'object_with_items' | 'context_nodes' | 'standalone_items';

export interface ExtractedFieldDef {
  name: string;
  type: FieldType;
}

export interface ExtractedItem {
  name: string;
  fieldValues?: Record<string, FieldValue>;
}

export interface ExtractedNode {
  content: string;
  parentIndex?: number;
  metadata?: { startDate?: string; endDate?: string; progress?: number };
}

export interface ExtractedEdge {
  sourceIndex: number;
  targetIndex: number;
}

export interface ExtractionSuggestion {
  id: string;
  type: ExtractionType;
  title: string;
  icon: string;
  description: string;
  sourceHeading?: string;
  // object_with_items
  objectName?: string;
  fields?: ExtractedFieldDef[];
  items?: ExtractedItem[];
  // context_nodes
  contextName?: string;
  viewStyle?: ViewStyle;
  nodes?: ExtractedNode[];
  edges?: ExtractedEdge[];
  // standalone_items
  targetObjectId?: string;
  targetObjectName?: string;
  standaloneItems?: ExtractedItem[];
}

export interface ExtractionResult {
  suggestions: ExtractionSuggestion[];
  summary: string;
}

