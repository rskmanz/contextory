# AI Tracking System

> Contextory 内蔵の AI トラッキングシステム (LangSmith 風)

---

## 概要

AI が **Project から Node まで全て** 作成できるようにし、何が作成されたかを可視化する。

**目的:**
- AI の応答品質を可視化
- **何のデータが作成されたか**を追跡
- ユーザーフィードバックを収集
- レイテンシー・モデル使用状況を追跡

---

## AI が作成できるデータ

| Entity | 説明 |
|--------|------|
| **Project** | プロジェクト全体 |
| **Workspace** | プロジェクト内のワークスペース |
| **Context** | メタコンテキスト (roadmap, architecture) |
| **Object** | オブジェクト定義 (Teams, Features, Tasks) |
| **Item** | オブジェクトのインスタンス |
| **Node** | Item/Context 内のノード |

---

## データモデル

```typescript
// AI アクション種別
type AIAction =
  // Create
  | 'create_project'
  | 'create_workspace'
  | 'create_context'
  | 'create_object'
  | 'create_item'
  | 'create_node'
  // Update
  | 'update_project'
  | 'update_workspace'
  | 'update_context'
  | 'update_object'
  | 'update_item'
  | 'update_node'
  // Other
  | 'chat'      // 会話のみ、データ変更なし
  | 'analyze'   // 分析のみ、データ変更なし

// データ変更の記録
interface DataChange {
  action: AIAction
  entityType: 'project' | 'workspace' | 'context' | 'object' | 'item' | 'node'
  entityId: string
  entityName: string
  parentId?: string  // 親エンティティ
}

// AI トレース
interface AITrace {
  id: string
  timestamp: number

  // リクエスト
  userMessage: string
  systemPrompt: string
  currentContext: {
    projectId?: string
    workspaceId?: string
    objectId?: string
    itemId?: string
  }

  // レスポンス
  response: string
  dataChanges: DataChange[]  // 作成/更新されたデータ

  // メトリクス
  provider: 'openai' | 'anthropic'
  model: string
  latencyMs: number
  tokensUsed?: number

  // フィードバック
  userRating?: 'good' | 'bad'
  userFeedback?: string
}
```

---

## UI デザイン

### Traces ダッシュボード (`/settings/ai-traces`)

```
┌─────────────────────────────────────────────────────────┐
│ AI Traces                                    [Filter ▼] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📝 Generate tree for "Login Feature"               │ │
│ │ 2 min ago • 1.2s • gpt-4o • 👍                     │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💬 Chat: "How should I structure auth?"            │ │
│ │ 5 min ago • 0.8s • claude-sonnet • —               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Expand to see full prompt/response]                   │
└─────────────────────────────────────────────────────────┘
```

### チャットメッセージ内

```
┌─────────────────────────────────────────────────────────┐
│ [Generated] ✨                                          │
│                                                         │
│ Login Feature のコンテキストツリーを生成しました:       │
│                                                         │
│ - Requirements                                          │
│   - User authentication                                 │
│   - Password reset                                      │
│ - Tasks                                                 │
│   - Implement login API                                 │
│                                                         │
│ [Apply to Context]                                      │
│                                                         │
│ 👍 👎                                    12:34 PM       │
└─────────────────────────────────────────────────────────┘
```

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| **アクションバッジ** | 💬 Chat / 📝 Generate / 🔍 Analyze / ➕ Expand |
| **レイテンシー表示** | 応答時間を ms で表示 |
| **モデル表示** | 使用した AI モデル名 |
| **フィードバック** | 👍/👎 ボタンで評価 |
| **フィルター** | Workspace / Action / Date で絞り込み |
| **詳細展開** | Full prompt/response を表示 |
| **JSON エクスポート** | 分析用にダウンロード |

---

## 実装ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/types/index.ts` | AITrace interface 追加 |
| `src/lib/store.ts` | addTrace, getTraces, updateTraceFeedback |
| `src/app/api/chat/route.ts` | レイテンシー計測、trace 保存 |
| `src/components/ai/ChatMessage.tsx` | Markdown, badge, feedback buttons |
| `src/app/settings/ai-traces/page.tsx` | **NEW** Dashboard |
| `src/data/db.json` | aiTraces 配列追加 |

---

## 実装順序

1. [ ] `react-markdown` インストール
2. [ ] `AITrace` type 追加
3. [ ] Store に trace CRUD 追加
4. [ ] Chat API で trace 保存
5. [ ] ChatMessage に Markdown 表示
6. [ ] ChatMessage に action badge 追加
7. [ ] ChatMessage に feedback buttons 追加
8. [ ] Traces Dashboard 作成

---

## 依存パッケージ

```bash
pnpm add react-markdown remark-gfm
```

---

## データフロー

```
User sends message
    ↓
Chat API (start timer)
    ↓
OpenAI / Anthropic
    ↓
Response received (end timer)
    ↓
Create AITrace {
  latencyMs: endTime - startTime,
  action: parseAction(response),
  ...
}
    ↓
Save to db.json
    ↓
Return response + traceId
    ↓
User can rate 👍/👎
    ↓
Update trace.userRating
```

---

## 検証チェックリスト

- [ ] AI 応答が Markdown でレンダリングされる
- [ ] アクションバッジが表示される
- [ ] trace が db.json に保存される
- [ ] 👍/👎 で評価できる
- [ ] Dashboard に全 trace が表示される
- [ ] フィルターが動作する
- [ ] JSON エクスポートが動作する
