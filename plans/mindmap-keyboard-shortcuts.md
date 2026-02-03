# MindmapView Keyboard Shortcuts

## Overview

Add myondAI-style keyboard shortcuts to Context OS's MindmapView for faster node creation and editing.

---

## Reference: myondAI Implementation

### Keyboard Shortcuts (from MindMap.tsx)

| Key | Action |
|-----|--------|
| `Shift + Enter` | Create **sibling** node (same level as selected) |
| `Alt + Enter` | Create **child** node (nested under selected) |
| `Delete` | Delete selected node and its edges |
| `Ctrl/Cmd + F` | Fit view (zoom to fit all nodes) |

### Key Functions from myondAI

```typescript
// From MindMap.tsx - Keyboard handler pattern
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isCreatingNodeRef.current) return;  // Prevent duplicate execution

    const selectedNode = nodes.find((node) => node.selected);
    if (!selectedNode) return;

    const isShiftEnter = e.key === "Enter" && e.shiftKey;
    const isAltEnter = e.key === "Enter" && e.altKey;
    const isDelete = e.key === "Delete";

    if (isShiftEnter || isAltEnter) {
      e.preventDefault();
      isCreatingNodeRef.current = true;

      // Alt+Enter: Create child (connect to selected node)
      // Shift+Enter: Create sibling (connect to parent)
      const actionType = isAltEnter ? "child" : "sibling";

      // ... node creation logic

      setTimeout(() => { isCreatingNodeRef.current = false }, 300);
    }

    if (isDelete) {
      e.preventDefault();
      // Delete node and connected edges
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [nodes, edges]);
```

### Helper Functions

```typescript
// Find parent node by traversing edges
const findParentNodeId = (edges: Edge[], childId: string): string | null => {
  const parentEdge = edges.find(edge => edge.target === childId);
  return parentEdge ? parentEdge.source : null;
};
```

---

## Current Context OS State

**MindmapView.tsx:**
- SVG-based tree rendering (not React Flow)
- Click to select, double-click to edit
- "+" button to add child
- ❌ No keyboard shortcuts
- ❌ No sibling creation

---

## Implementation Plan

### Phase 1: Add Keyboard Shortcuts

**File:** `src/components/views/MindmapView.tsx`

1. **Add sibling creation function:**
```typescript
const handleAddSibling = useCallback(
  async (nodeId: string) => {
    const nodes = context.data?.nodes || [];
    const selectedNode = nodes.find(n => n.id === nodeId);
    const parentId = selectedNode?.parentId || null;

    await addNode({
      content: 'New node',
      parentId,
    });
  },
  [addNode, context.data?.nodes]
);
```

2. **Add keyboard event handler:**
```typescript
// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if editing
    if (editingNodeId) return;
    if (!selectedNodeId) return;

    const isShiftEnter = e.key === 'Enter' && e.shiftKey;
    const isAltEnter = e.key === 'Enter' && e.altKey;
    const isDelete = e.key === 'Delete' || e.key === 'Backspace';

    if (isAltEnter) {
      e.preventDefault();
      handleAddChild(selectedNodeId);
    }

    if (isShiftEnter) {
      e.preventDefault();
      handleAddSibling(selectedNodeId);
    }

    if (isDelete) {
      e.preventDefault();
      handleDelete(selectedNodeId);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedNodeId, editingNodeId, handleAddChild, handleAddSibling, handleDelete]);
```

### Phase 2: Auto-select New Node (Enhancement)

After creating a node, automatically select it for quick continued editing.

### Phase 3: Visual Hints (Optional)

Add keyboard shortcut hints to the UI.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/views/MindmapView.tsx` | Add keyboard handler, sibling function |

---

## Verification

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Navigate to any context with nodes
4. Click a node to select it
5. Test shortcuts:
   - `Alt + Enter` → Creates child node
   - `Shift + Enter` → Creates sibling node
   - `Delete` → Deletes selected node
6. Verify changes persist after refresh
