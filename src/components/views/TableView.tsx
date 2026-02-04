'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface TableViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

type SortField = 'content' | 'parent' | 'created';
type SortDirection = 'asc' | 'desc';

export const TableView: React.FC<TableViewProps> = ({ context, isItemContext, itemId }) => {
  // Context functions
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);

  // Item functions
  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

  // Use appropriate functions based on mode
  const addNode = isItemContext && itemId
    ? (node: { content: string; parentId: string | null }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null }) => addContextNode(context.id, node);

  const updateNode = isItemContext && itemId
    ? (nodeId: string, updates: Partial<ContextNode>) => updateItemNode(itemId, nodeId, updates)
    : (nodeId: string, updates: Partial<ContextNode>) => updateContextNode(context.id, nodeId, updates);

  const deleteNode = isItemContext && itemId
    ? (nodeId: string) => deleteItemNode(itemId, nodeId)
    : (nodeId: string) => deleteContextNode(context.id, nodeId);

  const [sortField, setSortField] = useState<SortField>('content');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingCell, setEditingCell] = useState<{ nodeId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const nodes = context.data?.nodes || [];

  // Get parent nodes (groups)
  const parentNodes = useMemo(() => {
    return nodes.filter(n => !n.parentId);
  }, [nodes]);

  // Create a map for quick parent lookup
  const parentMap = useMemo(() => {
    const map = new Map<string, string>();
    parentNodes.forEach(p => map.set(p.id, p.content));
    return map;
  }, [parentNodes]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    const sorted = [...nodes];
    sorted.sort((a, b) => {
      let compareA: string = '';
      let compareB: string = '';

      switch (sortField) {
        case 'content':
          compareA = a.content.toLowerCase();
          compareB = b.content.toLowerCase();
          break;
        case 'parent':
          compareA = (a.parentId ? parentMap.get(a.parentId) || '' : '').toLowerCase();
          compareB = (b.parentId ? parentMap.get(b.parentId) || '' : '').toLowerCase();
          break;
        case 'created':
          compareA = a.id;
          compareB = b.id;
          break;
      }

      if (sortDirection === 'asc') {
        return compareA.localeCompare(compareB);
      }
      return compareB.localeCompare(compareA);
    });
    return sorted;
  }, [nodes, sortField, sortDirection, parentMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddRow = useCallback(async () => {
    await addNode({
      content: 'New item',
      parentId: null,
    });
  }, [addNode]);

  const handleEditStart = (nodeId: string, field: string, value: string) => {
    setEditingCell({ nodeId, field });
    setEditValue(value);
  };

  const handleEditSubmit = useCallback(async () => {
    if (!editingCell) return;

    const { nodeId, field } = editingCell;
    if (field === 'content' && editValue.trim()) {
      await updateNode(nodeId, { content: editValue.trim() });
    } else if (field === 'parent') {
      // Find parent by name
      const parent = parentNodes.find(p => p.content.toLowerCase() === editValue.toLowerCase());
      await updateNode(nodeId, { parentId: parent?.id || null });
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateNode, parentNodes]);

  const handleDelete = useCallback(async (nodeId: string) => {
    await deleteNode(nodeId);
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, [deleteNode]);

  const handleDeleteSelected = useCallback(async () => {
    for (const nodeId of selectedRows) {
      await deleteNode(nodeId);
    }
    setSelectedRows(new Set());
  }, [selectedRows, deleteNode]);

  const toggleRowSelection = (nodeId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === nodes.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(nodes.map(n => n.id)));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-zinc-300 ml-1">↕</span>;
    }
    return <span className="text-blue-500 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="h-full overflow-auto p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleAddRow}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Row
        </button>
        {selectedRows.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete ({selectedRows.size})
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-zinc-400">{nodes.length} items</span>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={selectedRows.size === nodes.length && nodes.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-zinc-300"
                />
              </th>
              <th
                onClick={() => handleSort('content')}
                className="text-left px-3 py-2.5 font-medium text-zinc-700 cursor-pointer hover:bg-zinc-100 select-none"
              >
                Name <SortIcon field="content" />
              </th>
              <th
                onClick={() => handleSort('parent')}
                className="text-left px-3 py-2.5 font-medium text-zinc-700 cursor-pointer hover:bg-zinc-100 select-none w-40"
              >
                Group <SortIcon field="parent" />
              </th>
              <th className="text-left px-3 py-2.5 font-medium text-zinc-700 w-32">
                Status
              </th>
              <th className="w-20 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-zinc-400">
                  No items yet. Click &quot;Add Row&quot; to create one.
                </td>
              </tr>
            ) : (
              sortedNodes.map((node) => {
                const isSelected = selectedRows.has(node.id);
                const isEditingContent = editingCell?.nodeId === node.id && editingCell?.field === 'content';
                const isEditingParent = editingCell?.nodeId === node.id && editingCell?.field === 'parent';
                const parentName = node.parentId ? parentMap.get(node.parentId) || '—' : '—';

                return (
                  <tr
                    key={node.id}
                    className={`border-b border-zinc-100 hover:bg-zinc-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(node.id)}
                        className="rounded border-zinc-300"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {isEditingContent ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditSubmit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubmit();
                            if (e.key === 'Escape') {
                              setEditingCell(null);
                              setEditValue('');
                            }
                          }}
                          className="w-full px-2 py-1 border border-blue-400 rounded outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onDoubleClick={() => handleEditStart(node.id, 'content', node.content)}
                        >
                          {node.content}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditingParent ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditSubmit}
                          className="w-full px-2 py-1 border border-blue-400 rounded outline-none"
                          autoFocus
                        >
                          <option value="">— None —</option>
                          {parentNodes.filter(p => p.id !== node.id).map(p => (
                            <option key={p.id} value={p.content}>{p.content}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer text-zinc-500 hover:text-blue-600"
                          onDoubleClick={() => handleEditStart(node.id, 'parent', parentName === '—' ? '' : parentName)}
                        >
                          {parentName}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-600">
                        {node.metadata?.color || 'default'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(node.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
