# Context OS

> **Shape contexts of your work with AI.**

---

## The Problem

Context is everywhere, but it's **hard to capture**.

- Every project, team, task, industry has different context
- Without clear context: humans don't know what to ask AI, AI doesn't know what you have

---

## The Solution

> Create project context from scratch and visualize context for any object.

```text
Project → Workspace → Object → Item → Details
```

---

## Use Case: Build a Product (with AI)

AI suggests what you need:

**Meta Contexts:**
| Context | Shows |
|---------|-------|
| Product Roadmap | Features + Milestones + Teams |
| System Architecture | Tech Stack + APIs + Services |

**Objects (lists):**
| Object | Items |
|--------|-------|
| Features | Login, Dashboard, API |
| Teams | Frontend, Backend, Design |
| Tasks | Build auth, Setup DB |
| Tools | GitHub, Slack, Figma |
| Meetings | Kickoff, Sprint Planning, Retro |

**Item Contexts:**
| Click on... | See... |
|-------------|--------|
| "Login" | Requirements, tasks, who builds it |
| "Alice" | Skills, tasks, meetings |
| "Kickoff" | Topics (visualized), decisions, action items |

**The right view for the right thing.** Not everything needs to be complicated.

---

## Key Terms

| Term | Definition |
|------|------------|
| **Project** | Top level container |
| **Workspace** | Flexible container (by department, activity, client, or any level) |
| **Meta Context** | Big picture visualization (roadmap, architecture, flow) - multiple objects |
| **Global Object** | Object at project level - shared across all workspaces |
| **Local Object** | Object at workspace level - specific to that workspace |
| **Object** | Can be anything: Tools, Teams, Tasks, Meetings, Prompts, Skills, Reminders, Thoughts, Q&A, News, anything |
| **Item** | Instance of an Object |
| **Item Context** | Tree visualization for one item - click to see everything related |

---

## Data Model

```text
Project
  ├── Global Objects (shared across all workspaces)
  │     └── Teams, Tools, Features...
  └── Workspaces (by department, activity, client, any level)
        ├── Meta Contexts (roadmap, architecture, flow)
        ├── Local Objects (specific to this workspace)
        ├── Uses Global Objects
        │     └── Items
        │           ├── Item Context (tree per item)
        │           └── Sub-Workspace (optional, recursive)
        │                 └── (same structure as Workspace)
```

**Two layers:**
- **Global (Project)** → Objects shared across all workspaces
- **Local (Workspace)** → Objects specific to that workspace

**Recursive Workspaces (Future):**
- Any Item can spawn its own Workspace via `parentItemId`
- Example: Meeting "Kickoff" → Workspace with Topics, Decisions, Actions
- Example: Task "Build Auth" → Workspace with Sub-tasks, Notes, Docs

---

## Object Categories

| Category | Examples |
|----------|----------|
| **Work** | Features, Requirements, Tasks, Milestones, Sprints, Bugs |
| **People** | Teams, Stakeholders, Users, Contacts, Clients, Personas |
| **Tools** | GitHub, Slack, Figma, Jira, Linear, Notion, AWS, APIs |
| **Knowledge** | Skills, Questions, Q&A, Learnings, Notes, Insights |
| **Content** | Documents, Designs, Code, Prompts, Templates |
| **Tracking** | Reminders, Deadlines, Goals, OKRs, KPIs |
| **Communication** | Meetings, Conversations, Decisions, Feedback |
| **Ideas** | Thoughts, Ideas, Brainstorms, Hypotheses |
| **External** | News, Trends, Competitors, Market Research |
| **Assets** | Products, Services, Brands, Campaigns |

---

## Data Structure

```typescript
// Keep current UI fields
interface Project {
  id: string;
  name: string;
  icon: string;
  gradient: string;   // keep for UI
  category: string;   // keep for grouping
}

// Keep current fields + add type + parentItemId
interface Workspace {
  id: string;
  name: string;
  projectId: string;
  parentItemId?: string;  // if set, this is a sub-workspace of an item (future)
  category?: string;      // keep for UI
  categoryIcon?: string;  // keep for UI
  type?: string;          // department, activity, client, etc.
}

// Flat array with projectId + workspaceId
interface ObjectType {
  id: string;
  name: string;
  icon: string;
  projectId: string;              // always set
  workspaceId: string | null;     // null = global, 'id' = local
  category?: string;              // Work, People, Tools, etc.
  builtIn: boolean;
}

// Tree structure for context data
interface ContextNode {
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

// Item with markdownId + contextData
interface ObjectItem {
  id: string;
  name: string;
  objectId: string;
  workspaceId: string | null;     // null = global object item
  markdownId?: string;            // reference to .md file (optional)
  contextData?: {                 // tree structure (optional)
    nodes: ContextNode[];
  };
}

// MetaContext (replaces Context) - tree only, no edges
interface MetaContext {
  id: string;
  name: string;
  icon: string;
  type: 'tree' | 'board' | 'canvas';  // data structure type
  viewStyle: string;                   // mindmap, list, kanban, etc.
  workspaceId: string;
  objectIds?: string[];               // linked objects (optional)
  markdownId?: string;                // reference to .md file (optional)
  data: {
    nodes: ContextNode[];             // tree structure only
  };
}

// Markdown = Summary (separate file)
// Stored as separate .md files, referenced by markdownId
```

**Query Examples:**
```typescript
// All Tasks across project
items.filter(i => i.objectId === 'tasks')

// Tasks in Workspace A only
items.filter(i => i.objectId === 'tasks' && i.workspaceId === 'a')

// Global Team members (visible everywhere)
items.filter(i => i.objectId === 'teams' && i.workspaceId === null)

// Global objects in project
objects.filter(o => o.projectId === 'proj-1' && o.workspaceId === null)

// Local objects in workspace
objects.filter(o => o.workspaceId === 'workspace-1')

// Top-level workspaces (no parent item)
workspaces.filter(w => !w.parentItemId)

// Sub-workspaces of an item (future)
workspaces.filter(w => w.parentItemId === 'item-123')
```

---

## Implementation

| Phase | Status |
|-------|--------|
| 1. Foundation (hierarchy, views, drill-down) | ✅ Done |
| 2. Enhanced Items (markdownId, contextData, projectId) | ⏳ Next |
| 3. Context Views (meta context, item context) | ⏳ Planned |
| 4. Recursive Workspaces (parentItemId, sub-workspaces) | ⏳ Planned |
| 5. AI Integration (auto-generate, infer) | ⏳ Future |
