# Investor Demo Page Plan

## Overview
Create a one-page illustration explaining Contextory to investors, showing the full data hierarchy.

## Page URL
`/demo`

## Page Structure

### Section 1: Target User - VC Program Manager

**Persona:** Program Manager at a VC / Accelerator

**Daily Reality:**
- Manages 1-3 accelerator programs per year
- Each program: 10-30 startups, 20-50 investors/mentors
- Hundreds of meetings, intros, follow-ups

**Pain Points (Interview Questions):**

1. **"How do you currently track all your startups?"**
   - Probably: Notion + Airtable + Google Sheets + Slack
   - Problem: Context is fragmented, hard to get full picture

2. **"When you meet a startup, how do you recall previous discussions?"**
   - Probably: Search Notion, scroll through Slack, check calendar
   - Problem: Takes time, often miss important context

3. **"How do you match investors with startups?"**
   - Probably: Mental memory, spreadsheet, manual tagging
   - Problem: No visual way to see connections

4. **"How do you prepare for board meetings / LP updates?"**
   - Probably: Manually compile from multiple sources
   - Problem: Time-consuming, easy to miss updates

**How Contextory Helps:**

| Pain Point | Current Tool | Contextory Solution |
|------------|--------------|---------------------|
| Track startups | Notion pages | Workspace per startup with full context |
| Meeting context | Search everywhere | Click startup → see all history |
| Investor matching | Spreadsheet | Visual connections, cross-reference |
| Reporting | Manual compile | Project-level view, export ready |
| Onboard new PM | Train for weeks | Self-documenting structure |

### Section 2: Project Overview
```
🚀 2025 VC Accelerator
├── 💻 Online Program
├── 🏢 Offline Program
├── 💰 Investor Relations
├── 🎯 TechStart (Startup A)
├── 🌱 GreenFuture (Startup B)
└── 🏥 HealthAI (Startup C)
```

### Section 3: Expanded Workspace - "TechStart (Startup A)"
**Contexts (3):**
1. 💡 Business Idea Map (Mindmap view)
2. 📋 Sprint Board (Kanban view)
3. 📅 Meeting Schedule (Gantt view)

**Objects:**
- 👨‍💼 Entrepreneurs (1 item: Alex Kim)
- 💼 Investors (2 items: matched investors)
- ✅ Tasks (5 items)
- 📅 Meetings (3 items)

### Section 4: Drill into One Person - "Alex Kim (CEO)"
**Item Context (nested):**
```
Alex Kim
├── Background
│   ├── Google 5 years
│   └── Stanford MBA
├── Skills
│   ├── AI/ML
│   └── Product Management
└── Notes: "Strong technical founder"
```

Shows: Project → Workspace → Object → Item → Item's Context

### Section 5: Meeting Context - "Mentor Session with Alex"
**Meeting has its own context:**
```
Mentor Session
├── Agenda (List)
│   ├── Review pitch deck
│   ├── Discuss fundraising strategy
│   └── Q&A with mentor
├── Action Items (Kanban)
│   ├── To Do
│   ├── In Progress
│   └── Done
└── Meeting Notes (Markdown)
```

Shows: Every item can have its own nested context!

### Section 6: Meta-Context (Project Level)
**Program Roadmap** - visible across all workspaces
```
Phase 1: Selection ─── Phase 2: Mentoring ─── Phase 3: Demo Day
    │                       │                      │
    ├── Applications        ├── Weekly Meetings    ├── Pitch Practice
    ├── Interviews          ├── Investor Match     └── Final Presentation
    └── Final Selection     └── Office Hours
```

### Section 7: Visualization Types
| Icon | View | Best For |
|------|------|----------|
| 📝 | List | Simple hierarchies |
| 🧠 | Mindmap | Brainstorming, ideas |
| 📋 | Kanban | Workflow, stages |
| 🔲 | Grid | Grouped cards |
| 🔀 | Flow | Processes |
| 📊 | Table | Data, sorting |
| 📅 | Gantt | Timelines, schedules |
| 🎨 | Canvas | Freeform drawing |

## Full Hierarchy Illustration
```
Contextory
│
├── 🏠 Home (Global View)
│   ├── All Projects
│   ├── All Objects
│   └── Pinned Tabs
│
├── 📁 Project: 2025 VC Accelerator
│   │
│   ├── 📊 Meta-Context: Program Roadmap (project-level)
│   │
│   └── 📂 Workspace: TechStart (Startup A)
│       │
│       ├── 🗺️ Contexts
│       │   ├── Business Idea Map (mindmap)
│       │   ├── Sprint Board (kanban)
│       │   └── Meeting Schedule (gantt)
│       │
│       └── 📦 Objects
│           ├── 👨‍💼 Entrepreneurs
│           │   └── Alex Kim ──→ [Item Context: Background, Skills]
│           │
│           ├── 💼 Investors
│           │   ├── John Smith
│           │   └── Sarah Johnson
│           │
│           ├── ✅ Tasks
│           │   └── (5 tasks)
│           │
│           └── 📅 Meetings
│               └── Mentor Session ──→ [Item Context: Agenda, Notes]
```

## Key Value Propositions

1. **Flexible Structure** - Define your own objects (Investors, Startups, Tasks...)
2. **Multi-level Context** - From project to individual items
3. **8 Visualization Types** - Same data, different views
4. **AI-Powered** - Chat to create/update context automatically
5. **Cross-Project** - See all tasks/meetings across projects

## Interview Demo Script

### Opening (30 sec)
"I built Contextory to solve a problem I kept seeing - information about projects and people is scattered everywhere. Let me show you how it works for a VC Program Manager."

### Demo Flow (3-5 min)

1. **Show Project View** (30 sec)
   - "Here's a VC Accelerator program with 6 workspaces - Online/Offline programs, Investor Relations, and 3 startups"

2. **Enter TechStart Workspace** (1 min)
   - "Each startup has their own workspace"
   - "See 3 contexts: Business Idea Map, Sprint Board, Meeting Schedule"
   - "Different visualizations for different needs"

3. **Click on Alex Kim (Entrepreneur)** (1 min)
   - "Every person has their own context"
   - "Background, skills, notes - all in one place"
   - "Before a meeting, I click here and see everything"

4. **Show Meeting Context** (1 min)
   - "Meetings also have context - agenda, notes, action items"
   - "After the meeting, AI can help update this"

5. **Show Project Roadmap** (30 sec)
   - "Project-level context spans all workspaces"
   - "Program Manager sees the big picture"

### Key Questions to Ask Her
- "How many tools do you use to track your program?"
- "What's your process before a startup meeting?"
- "How do you hand off context when someone new joins?"
- "What takes the most time in your weekly reporting?"

### Closing
"The core idea is: every project, every person, every meeting can have structured context that's easy to visualize and never gets lost."

## Implementation Notes

### Files to Create
- `src/app/demo/page.tsx` - The demo page

### Data Updates
- Add 3 contexts to `startup-techstart` workspace
- Ensure objects are properly assigned
- Add rich item context data for Alex Kim
- Add meeting item with agenda context

### Demo Data for TechStart Workspace
```json
{
  "contexts": [
    { "id": "techstart-ideamap", "name": "Business Idea Map", "viewStyle": "mindmap" },
    { "id": "techstart-sprint", "name": "Sprint Board", "viewStyle": "kanban" },
    { "id": "techstart-schedule", "name": "Meeting Schedule", "viewStyle": "gantt" }
  ],
  "items": [
    { "id": "ent-kim", "name": "Alex Kim", "contextData": {...} },
    { "id": "mtg-mentor", "name": "Mentor Session", "contextData": {...} }
  ]
}
```
