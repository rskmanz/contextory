# AI Implementation

> Context OS の AI 実装ガイド

---

## 現状

### ファイル構成

```
src/
├── app/api/chat/route.ts    # Chat API エンドポイント
├── lib/ai.ts                # AI ユーティリティ関数
├── components/ai/
│   ├── FloatingChat.tsx     # チャット UI
│   └── ChatMessage.tsx      # メッセージ表示
└── types/index.ts           # AI 関連の型定義
```

### 現状のフロー

```
User Message
    ↓
FloatingChat.tsx (buildContextPrompt)
    ↓
POST /api/chat
    ↓
OpenAI / Anthropic API
    ↓
Text Response
    ↓
parseSuggestedNodes() で JSON 抽出
    ↓
"Apply to Context" ボタンで手動適用
```

**問題点:**
- AI は「提案」のみ、「作成」はできない
- トレース/ログなし
- アクション判定なし

---

## 目標アーキテクチャ

### Tool/Function Calling

```
User: "Login 機能のコンテキストを作って"
    ↓
AI が Tool を呼び出し:
  - create_item("Login Feature")
  - create_node("Requirements", parentId: null)
  - create_node("Tasks", parentId: null)
    ↓
データが実際に作成される
    ↓
AITrace に記録
```

---

## Tool 定義

### OpenAI Format

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          icon: { type: "string", description: "Emoji icon" },
          category: { type: "string", enum: ["Side Projects", "VCs", "Main"] }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_workspace",
      description: "Create a workspace in the current project",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          categoryIcon: { type: "string" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_context",
      description: "Create a meta context (roadmap, architecture, etc.)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["tree", "board", "canvas"] },
          viewStyle: { type: "string" }
        },
        required: ["name", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_object",
      description: "Create an object type (Teams, Features, Tasks, etc.)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          icon: { type: "string" },
          category: { type: "string" },
          isGlobal: { type: "boolean", description: "If true, shared across all workspaces" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_item",
      description: "Create an item instance of an object",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          objectId: { type: "string" }
        },
        required: ["name", "objectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_node",
      description: "Create a node in item context or meta context",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          parentId: { type: "string", nullable: true },
          targetType: { type: "string", enum: ["item", "context"] },
          targetId: { type: "string" }
        },
        required: ["content", "targetType", "targetId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_nodes_batch",
      description: "Create multiple nodes at once",
      parameters: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                parentId: { type: "string", nullable: true }
              }
            }
          },
          targetType: { type: "string", enum: ["item", "context"] },
          targetId: { type: "string" }
        },
        required: ["nodes", "targetType", "targetId"]
      }
    }
  }
]
```

---

## API 設計

### POST /api/chat (Updated)

```typescript
interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  systemPrompt: string
  provider: 'openai' | 'anthropic'
  model?: string
  apiKey?: string
  // NEW
  context: {
    projectId?: string
    workspaceId?: string
    objectId?: string
    itemId?: string
  }
  enableTools: boolean  // Tool calling を有効にするか
}

interface ChatResponse {
  content: string
  model: string
  // NEW
  traceId: string
  dataChanges: DataChange[]
}
```

### POST /api/ai/execute-tool

Tool を実際に実行するエンドポイント

```typescript
interface ExecuteToolRequest {
  toolName: string
  parameters: Record<string, unknown>
  context: {
    projectId?: string
    workspaceId?: string
  }
}

interface ExecuteToolResponse {
  success: boolean
  result: {
    entityType: string
    entityId: string
    entityName: string
  }
  error?: string
}
```

---

## 実装ファイル

### 新規作成

| ファイル | 説明 |
|----------|------|
| `src/lib/ai/tools.ts` | Tool 定義 |
| `src/lib/ai/executor.ts` | Tool 実行ロジック |
| `src/lib/ai/trace.ts` | トレース記録 |
| `src/app/api/ai/execute-tool/route.ts` | Tool 実行 API |

### 更新

| ファイル | 変更 |
|----------|------|
| `src/app/api/chat/route.ts` | Tool calling 対応 |
| `src/lib/store.ts` | AITrace CRUD 追加 |
| `src/types/index.ts` | AITrace, DataChange, Tool types |
| `src/components/ai/ChatMessage.tsx` | DataChanges 表示 |

---

## Tool 実行フロー

```
1. User sends message
   ↓
2. Chat API calls OpenAI/Anthropic with tools
   ↓
3. AI returns tool_calls (if needed)
   [
     { name: "create_item", arguments: { name: "Login Feature", objectId: "..." } },
     { name: "create_nodes_batch", arguments: { nodes: [...], targetId: "..." } }
   ]
   ↓
4. For each tool_call:
   - Execute via store operations
   - Record DataChange
   ↓
5. Create AITrace with all DataChanges
   ↓
6. Return response + dataChanges to frontend
   ↓
7. Frontend shows what was created
```

---

## System Prompt (Updated)

```typescript
function buildContextPrompt(context: ContextInfo): string {
  return `You are an AI assistant for Context OS.

## Current Context
- Project: ${context.project?.name || 'None'}
- Workspace: ${context.workspace?.name || 'None'}
- Object: ${context.object?.name || 'None'}
- Item: ${context.item?.name || 'None'}

## Available Tools
You have tools to create and modify data:
- create_project: Create a new project
- create_workspace: Create a workspace
- create_context: Create a meta context (roadmap, architecture)
- create_object: Create an object type (Teams, Features, etc.)
- create_item: Create an item instance
- create_node: Add a node to item/context
- create_nodes_batch: Add multiple nodes at once

## Guidelines
1. When user asks to "create" or "generate", use the appropriate tools
2. For tree structures, use create_nodes_batch for efficiency
3. Always confirm what you created in your response
4. If unsure, ask for clarification before creating

## Response Format
After creating data, summarize:
- What was created
- Where it was created
- Any next steps`;
}
```

---

## Anthropic Tool Format

```typescript
const anthropicTools = [
  {
    name: "create_item",
    description: "Create an item instance of an object",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        objectId: { type: "string" }
      },
      required: ["name", "objectId"]
    }
  },
  // ... other tools
]
```

---

## 実装順序

1. [ ] Tool 定義ファイル作成 (`src/lib/ai/tools.ts`)
2. [ ] Tool 実行ロジック (`src/lib/ai/executor.ts`)
3. [ ] Chat API を Tool calling 対応に更新
4. [ ] AITrace 型と Store 追加
5. [ ] トレース記録ロジック
6. [ ] ChatMessage に DataChanges 表示
7. [ ] Traces Dashboard

---

## 例: ユーザーリクエストの処理

### Input
```
"Login 機能の要件をツリーで作って"
```

### AI Response (with tool calls)
```json
{
  "tool_calls": [
    {
      "name": "create_item",
      "arguments": {
        "name": "Login Feature",
        "objectId": "features"
      }
    },
    {
      "name": "create_nodes_batch",
      "arguments": {
        "targetType": "item",
        "targetId": "{{item_id}}",
        "nodes": [
          { "content": "Requirements", "parentId": null },
          { "content": "User authentication", "parentId": "{{req_id}}" },
          { "content": "Password reset", "parentId": "{{req_id}}" },
          { "content": "Session management", "parentId": "{{req_id}}" },
          { "content": "Tasks", "parentId": null },
          { "content": "Implement login API", "parentId": "{{task_id}}" },
          { "content": "Build login UI", "parentId": "{{task_id}}" }
        ]
      }
    }
  ],
  "content": "Login Feature を作成し、以下のコンテキストツリーを追加しました:\n\n- Requirements\n  - User authentication\n  - Password reset\n  - Session management\n- Tasks\n  - Implement login API\n  - Build login UI"
}
```

### Stored AITrace
```json
{
  "id": "trace-123",
  "timestamp": 1234567890,
  "userMessage": "Login 機能の要件をツリーで作って",
  "response": "Login Feature を作成し...",
  "dataChanges": [
    { "action": "create_item", "entityType": "item", "entityId": "item-456", "entityName": "Login Feature" },
    { "action": "create_node", "entityType": "node", "entityId": "node-1", "entityName": "Requirements" },
    { "action": "create_node", "entityType": "node", "entityId": "node-2", "entityName": "User authentication" },
    // ...
  ],
  "provider": "openai",
  "model": "gpt-4o",
  "latencyMs": 1234
}
```
