'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface TableViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
  onOpenNode?: (nodeId: string) => void;
}

type SortField = string; // 'content' | 'parent' | dynamic column id
type SortDirection = 'asc' | 'desc';

interface TableColumn {
  id: string;
  name: string;
}

export const TableView: React.FC<TableViewProps> = ({ context, isItemContext, itemId, onOpenNode }) => {
  // Context functions
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);
  const updateContext = useStore((state) => state.updateContext);

  // Item functions
  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

  // For type badges
  const allItems = useStore((state) => state.items);
  const allObjects = useStore((state) => state.objects);

  // For sidebar item drop
  const addNodeForItem = useStore((state) => state.addNodeForItem);

  // Use appropriate functions based on mode
  const addNode = isItemContext && itemId
    ? (node: { content: string; parentId: string | null; metadata?: Record<string, unknown> }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null; metadata?: Record<string, unknown> }) => addContextNode(context.id, node);

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
  const [addingColumnName, setAddingColumnName] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const nodes = context.data?.nodes || [];
  const tableColumns: TableColumn[] = context.data?.tableColumns || [];
  const hasDynamicColumns = tableColumns.length > 0;

  // Get parent nodes (groups) — used in fixed-column mode
  const parentNodes = useMemo(() => {
    return nodes.filter(n => !n.parentId);
  }, [nodes]);

  const parentMap = useMemo(() => {
    const map = new Map<string, string>();
    parentNodes.forEach(p => map.set(p.id, p.content));
    return map;
  }, [parentNodes]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    const sorted = [...nodes];
    sorted.sort((a, b) => {
      let compareA = '';
      let compareB = '';

      if (sortField === 'content') {
        compareA = a.content.toLowerCase();
        compareB = b.content.toLowerCase();
      } else if (sortField === 'parent') {
        compareA = (a.parentId ? parentMap.get(a.parentId) || '' : '').toLowerCase();
        compareB = (b.parentId ? parentMap.get(b.parentId) || '' : '').toLowerCase();
      } else {
        // Dynamic column
        compareA = String(a.metadata?.[sortField] || '').toLowerCase();
        compareB = String(b.metadata?.[sortField] || '').toLowerCase();
      }

      return sortDirection === 'asc'
        ? compareA.localeCompare(compareB)
        : compareB.localeCompare(compareA);
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

  // --- Paste Handler ---
  const handlePaste = useCallback(async (e: React.ClipboardEvent | ClipboardEvent) => {
    // Only auto-detect columns when no tableColumns exist
    const text = ('clipboardData' in e ? e.clipboardData : (e as ClipboardEvent).clipboardData)?.getData('text/plain');
    if (!text?.trim()) return;

    const lines = text.trim().split('\n').map(line => line.replace(/\r$/, ''));
    if (lines.length < 2) return; // Need at least header + 1 data row

    // Detect delimiter: tab first, then comma
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));

    if (rows[0].length < 2 && delimiter === ',') {
      // Not enough columns even with comma — treat as single column
      return;
    }

    // If we already have data and dynamic columns, add rows to existing columns
    if (hasDynamicColumns) {
      e.preventDefault();
      // Paste into existing structure — skip header row if it matches existing columns
      const headerRow = rows[0];
      const headersMatch = tableColumns.every((col, i) =>
        i === 0 ? true : headerRow[i]?.toLowerCase() === col.name.toLowerCase()
      );
      const dataRows = headersMatch ? rows.slice(1) : rows;

      for (const row of dataRows) {
        const metadata: Record<string, unknown> = {};
        tableColumns.forEach((col, i) => {
          if (i > 0 && row[i] !== undefined) {
            metadata[col.id] = row[i];
          }
        });
        await addNode({
          content: row[0] || 'Untitled',
          parentId: null,
          metadata,
        });
      }
      return;
    }

    // No existing columns — auto-detect from first row
    if (nodes.length > 0) return; // Only auto-detect on empty table

    e.preventDefault();

    const headers = rows[0];
    const newColumns: TableColumn[] = headers.map((header, i) => ({
      id: i === 0 ? 'name' : `col_${i}`,
      name: header || `Column ${i + 1}`,
    }));

    // Save column definitions to context
    await updateContext(context.id, {
      data: {
        ...context.data,
        tableColumns: newColumns,
      },
    });

    // Create nodes for data rows
    const dataRows = rows.slice(1);
    for (const row of dataRows) {
      if (!row[0]?.trim() && row.every(cell => !cell.trim())) continue; // skip empty rows

      const metadata: Record<string, unknown> = {};
      newColumns.forEach((col, i) => {
        if (i > 0 && row[i] !== undefined) {
          metadata[col.id] = row[i];
        }
      });

      await addNode({
        content: row[0] || 'Untitled',
        parentId: null,
        metadata,
      });
    }
  }, [hasDynamicColumns, tableColumns, nodes.length, context.id, context.data, updateContext, addNode]);

  // --- Copy Handler ---
  const handleCopy = useCallback(async () => {
    if (selectedRows.size === 0) return;

    const selected = sortedNodes.filter(n => selectedRows.has(n.id));
    const cols = hasDynamicColumns ? tableColumns : [{ id: 'name', name: 'Name' }];

    // Header row
    const headerRow = cols.map(c => c.name).join('\t');

    // Data rows
    const dataRows = selected.map(node => {
      return cols.map((col, i) => {
        if (i === 0) return node.content;
        return String(node.metadata?.[col.id] || '');
      }).join('\t');
    });

    const tsv = [headerRow, ...dataRows].join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      // clipboard write failed
    }
  }, [selectedRows, sortedNodes, hasDynamicColumns, tableColumns]);

  // Keyboard shortcut for copy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedRows.size > 0) {
        // Only handle if not editing a cell
        if (!editingCell) {
          e.preventDefault();
          handleCopy();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, selectedRows.size, editingCell]);

  const handleItemDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (isItemContext) return;
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { itemId } = JSON.parse(raw);
      if (!itemId) return;
      const ctxNodes = context.data?.nodes || [];
      const alreadyExists = ctxNodes.some(n => n.metadata?.sourceItemId === itemId);
      if (!alreadyExists) {
        await addNodeForItem(context.id, itemId, null);
      }
    } catch { /* ignore */ }
  }, [isItemContext, context.id, context.data?.nodes, addNodeForItem]);

  const handleItemDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleAddRow = useCallback(async () => {
    const metadata: Record<string, unknown> = {};
    if (hasDynamicColumns) {
      tableColumns.forEach((col, i) => {
        if (i > 0) metadata[col.id] = '';
      });
    }
    await addNode({
      content: 'New item',
      parentId: null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }, [addNode, hasDynamicColumns, tableColumns]);

  const handleEditStart = (nodeId: string, field: string, value: string) => {
    setEditingCell({ nodeId, field });
    setEditValue(value);
  };

  const handleEditSubmit = useCallback(async () => {
    if (!editingCell) return;

    const { nodeId, field } = editingCell;
    if (field === 'content') {
      if (editValue.trim()) {
        await updateNode(nodeId, { content: editValue.trim() });
      }
    } else if (field === 'parent') {
      const parent = parentNodes.find(p => p.content.toLowerCase() === editValue.toLowerCase());
      await updateNode(nodeId, { parentId: parent?.id || null });
    } else {
      // Dynamic column — update metadata
      const node = nodes.find(n => n.id === nodeId);
      await updateNode(nodeId, {
        metadata: { ...node?.metadata, [field]: editValue },
      });
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateNode, parentNodes, nodes]);

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

  // --- Add Column ---
  const handleAddColumn = useCallback(async (name: string) => {
    const colId = `col_${Date.now()}`;
    const newColumns = [...tableColumns, { id: colId, name }];
    await updateContext(context.id, {
      data: {
        ...context.data,
        tableColumns: newColumns,
      },
    });
    setAddingColumnName(null);
  }, [tableColumns, context.id, context.data, updateContext]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <span className="text-zinc-300 ml-1">↕</span>;
    }
    return <span className="text-blue-500 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // --- Render ---
  return (
    <div
      ref={tableRef}
      className="h-full overflow-auto p-4"
      onDragOver={handleItemDragOver}
      onDrop={handleItemDrop}
      onPaste={handlePaste}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleAddRow}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Row
        </button>
        {selectedRows.size > 0 && (
          <>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete ({selectedRows.size})
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 transition-colors"
            >
              Copy
            </button>
          </>
        )}
        <div className="flex-1" />
        <span className="text-xs text-zinc-400">{nodes.length} items</span>
      </div>

      {/* Empty state with paste hint */}
      {nodes.length === 0 && !hasDynamicColumns && (
        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center mb-4">
          <p className="text-zinc-500 mb-2">Paste data from a spreadsheet</p>
          <p className="text-xs text-zinc-400">Copy cells from Excel or Google Sheets, then paste here (Ctrl+V). First row becomes column headers.</p>
        </div>
      )}

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
              {/* Name column — always first */}
              <th
                onClick={() => handleSort('content')}
                className="text-left px-3 py-2.5 font-medium text-zinc-700 cursor-pointer hover:bg-zinc-100 select-none"
              >
                {hasDynamicColumns ? tableColumns[0]?.name || 'Name' : 'Name'} <SortIcon field="content" />
              </th>

              {hasDynamicColumns ? (
                <>
                  {/* Dynamic columns */}
                  {tableColumns.slice(1).map(col => (
                    <th
                      key={col.id}
                      onClick={() => handleSort(col.id)}
                      className="text-left px-3 py-2.5 font-medium text-zinc-700 cursor-pointer hover:bg-zinc-100 select-none"
                    >
                      {col.name} <SortIcon field={col.id} />
                    </th>
                  ))}
                  {/* Add column button */}
                  <th className="w-10 px-2 py-2.5">
                    {addingColumnName !== null ? (
                      <input
                        type="text"
                        value={addingColumnName}
                        onChange={e => setAddingColumnName(e.target.value)}
                        onBlur={() => {
                          if (addingColumnName.trim()) handleAddColumn(addingColumnName.trim());
                          else setAddingColumnName(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && addingColumnName.trim()) handleAddColumn(addingColumnName.trim());
                          if (e.key === 'Escape') setAddingColumnName(null);
                        }}
                        className="w-24 px-2 py-0.5 border border-blue-400 rounded text-xs outline-none"
                        placeholder="Column name"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setAddingColumnName('')}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-100"
                        title="Add column"
                      >
                        +
                      </button>
                    )}
                  </th>
                </>
              ) : (
                <>
                  {/* Fixed columns for backward compatibility */}
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-700 w-32">Type</th>
                  <th
                    onClick={() => handleSort('parent')}
                    className="text-left px-3 py-2.5 font-medium text-zinc-700 cursor-pointer hover:bg-zinc-100 select-none w-40"
                  >
                    Group <SortIcon field="parent" />
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-700 w-32">Status</th>
                </>
              )}
              <th className="w-20 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.length === 0 ? (
              <tr>
                <td colSpan={hasDynamicColumns ? tableColumns.length + 3 : 6} className="text-center py-8 text-zinc-400">
                  No items yet. Click &quot;Add Row&quot; or paste data.
                </td>
              </tr>
            ) : (
              sortedNodes.map((node) => {
                const isSelected = selectedRows.has(node.id);
                const isEditingContent = editingCell?.nodeId === node.id && editingCell?.field === 'content';
                const nodeSourceItemId = node.metadata?.sourceItemId as string | undefined;
                const nodeItem = nodeSourceItemId ? allItems.find(i => i.id === nodeSourceItemId) : null;
                const nodeObjType = nodeItem?.objectId ? allObjects.find(o => o.id === nodeItem.objectId) : null;

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
                    {/* Name cell */}
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

                    {hasDynamicColumns ? (
                      <>
                        {/* Dynamic column cells */}
                        {tableColumns.slice(1).map(col => {
                          const cellValue = String(node.metadata?.[col.id] || '');
                          const isEditingThis = editingCell?.nodeId === node.id && editingCell?.field === col.id;

                          return (
                            <td key={col.id} className="px-3 py-2">
                              {isEditingThis ? (
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
                                  className="cursor-pointer text-zinc-700 hover:text-blue-600"
                                  onDoubleClick={() => handleEditStart(node.id, col.id, cellValue)}
                                >
                                  {cellValue || <span className="text-zinc-300">—</span>}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        {/* Spacer for add-column header */}
                        <td className="px-2 py-2"></td>
                      </>
                    ) : (
                      <>
                        {/* Fixed columns */}
                        <td className="px-3 py-2">
                          {nodeObjType ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                              <span>{nodeObjType.icon}</span>
                              <span>{nodeObjType.name}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const isEditingParent = editingCell?.nodeId === node.id && editingCell?.field === 'parent';
                            const parentName = node.parentId ? parentMap.get(node.parentId) || '—' : '—';
                            if (isEditingParent) {
                              return (
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
                              );
                            }
                            return (
                              <span
                                className="cursor-pointer text-zinc-500 hover:text-blue-600"
                                onDoubleClick={() => handleEditStart(node.id, 'parent', parentName === '—' ? '' : parentName)}
                              >
                                {parentName}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-600">
                            {node.metadata?.color || 'default'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {onOpenNode && (
                          <button
                            onClick={() => onOpenNode(node.id)}
                            className="text-zinc-400 hover:text-blue-500 transition-colors"
                            title="Open"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(node.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
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
