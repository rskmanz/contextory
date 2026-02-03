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
interface Project {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  category: string;
}

interface Workspace {
  id: string;
  name: string;
  projectId: string;
  parentItemId?: string;  // sub-workspace linked from item (future)
  category?: string;
  categoryIcon?: string;
  type?: string;          // department, activity, client, etc.
}

// 3-tier scope system
type ObjectScope = 'global' | 'project' | 'local';

interface ObjectType {
  id: string;
  name: string;
  icon: string;
  scope: ObjectScope;
  projectId: string | null;       // null for global
  workspaceId: string | null;     // null for global/project
  category?: string;
  builtIn: boolean;
}

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

interface ContextEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

type ContextType = 'tree' | 'board' | 'canvas';
type ViewStyle = 'mindmap' | 'list' | 'kanban' | 'grid' | 'flow' | 'freeform';

interface Context {
  id: string;
  name: string;
  icon: string;
  type: ContextType;
  viewStyle: ViewStyle;
  workspaceId: string;
  objectIds?: string[];
  markdownId?: string;
  data: {
    nodes: ContextNode[];
    edges?: ContextEdge[];
  };
}

interface ObjectItem {
  id: string;
  name: string;
  objectId: string;
  workspaceId: string | null;
  markdownId?: string;
  contextData?: {
    nodes: ContextNode[];
  };
}
```

**Scope Visibility:**
| Scope | projectId | workspaceId | Visible In |
|-------|-----------|-------------|------------|
| global | null | null | Everywhere |
| project | set | null | All workspaces in project |
| local | set | set | Only that workspace |

**Query Examples:**
```typescript
// Global objects
objects.filter(o => o.scope === 'global')

// Project objects
objects.filter(o => o.scope === 'project' && o.projectId === projectId)

// Local objects
objects.filter(o => o.scope === 'local' && o.workspaceId === workspaceId)

// All visible objects in a workspace
objects.filter(o =>
  o.scope === 'global' ||
  (o.scope === 'project' && o.projectId === projectId) ||
  (o.scope === 'local' && o.workspaceId === workspaceId)
)

// Sub-workspaces of an item (future)
workspaces.filter(w => w.parentItemId === itemId)
```

---

## AI Skills (How to Use)

### Available Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `list_workspaces` | List workspaces (optionally by projectId) |
| `list_objects` | List objects (by scope/project/workspace) |
| `list_items` | List items in an object |
| `list_contexts` | List contexts in a workspace |
| `get_item_context` | Get item's context nodes |
| `create_project` | Create a project |
| `create_workspace` | Create a workspace |
| `create_object` | Create an object (global/project/local) |
| `create_item` | Create an item |
| `create_context` | Create a context (tree/board/canvas) |
| `add_node` | Add node to context or item |
| `update_*` | Update any entity |
| `delete_*` | Delete any entity (requires confirmation) |

### Example Commands

**Reading data:**
```
"List all projects"
"Show workspaces in project X"
"What objects are in this workspace?"
"Get the context tree for item Y"
```

**Creating data:**
```
"Create a project called Marketing"
"Add a workspace called Q1 Campaign to Marketing"
"Create a global object called Teams"
"Add item Alice to Teams"
"Create a tree context called Roadmap"
```

**Modifying data:**
```
"Rename project X to Y"
"Add a node 'Requirements' to item Z"
"Delete the old project" (will ask for confirmation)
```

### API Endpoints (for MCP Server)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET/PUT/DELETE | `/api/projects/[id]` | Project CRUD |
| GET | `/api/workspaces?projectId=X` | List workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET/PUT/DELETE | `/api/workspaces/[id]` | Workspace CRUD |
| GET | `/api/objects?scope=X&projectId=Y` | List objects |
| POST | `/api/objects` | Create object |
| GET/PUT/DELETE | `/api/objects/[id]` | Object CRUD |
| GET | `/api/items?objectId=X` | List items |
| POST | `/api/items` | Create item |
| GET/PUT/DELETE | `/api/items/[id]` | Item CRUD |
| GET/PUT/POST | `/api/items/[id]/nodes` | Item context nodes |
| GET | `/api/contexts?workspaceId=X` | List contexts |
| POST | `/api/contexts` | Create context |
| GET/PUT/DELETE | `/api/contexts/[id]` | Context CRUD |

### MCP Server Setup

Already configured in `~/.claude.json`:
```json
{
  "mcpServers": {
    "context-os": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/Users/User/InfoDashboard/info-dashboard/mcp-server/build/index.js"],
      "env": {
        "CONTEXT_OS_URL": "http://localhost:3000"
      }
    }
  }
}
```

**Skill:** Use `/context-os` command in Claude Code

---

## Implementation

| Phase | Status |
|-------|--------|
| 1. Foundation (hierarchy, views, drill-down) | ✅ Done |
| 2. Enhanced Items (markdownId, contextData) | ✅ Done |
| 3. 3-Tier Scope (global/project/local) | ✅ Done |
| 4. AI Tool Calling (in-app chat) | ✅ Done |
| 5. MCP Server (Claude Code integration) | ✅ Done |
| 6. Recursive Workspaces (parentItemId) | ⏳ Future |
