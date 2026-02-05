'use client';

import React, { useState, useCallback } from 'react';
import { Context, ContextNode } from '@/types';
import { useStore } from '@/lib/store';

interface FlowViewProps {
  context: Context;
  isItemContext?: boolean;
  itemId?: string;
}

export const FlowView: React.FC<FlowViewProps> = ({ context, isItemContext, itemId }) => {
  const addContextNode = useStore((state) => state.addNode);
  const updateContextNode = useStore((state) => state.updateNode);
  const deleteContextNode = useStore((state) => state.deleteNode);

  const addItemNode = useStore((state) => state.addItemNode);
  const updateItemNode = useStore((state) => state.updateItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

  const addNode = isItemContext && itemId
    ? (node: { content: string; parentId: string | null }) => addItemNode(itemId, node)
    : (node: { content: string; parentId: string | null }) => addContextNode(context.id, node);

  const updateNode = isItemContext && itemId
    ? (nodeId: string, updates: Partial<ContextNode>) => updateItemNode(itemId, nodeId, updates)
    : (nodeId: string, updates: Partial<ContextNode>) => updateContextNode(context.id, nodeId, updates);

  const deleteNode = isItemContext && itemId
    ? (nodeId: string) => deleteItemNode(itemId, nodeId)
    : (nodeId: string) => deleteContextNode(context.id, nodeId);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const nodes = context.data?.nodes || [];
  const mainSteps = nodes.filter((n) => !n.parentId);
  const getSubSteps = (parentId: string) => nodes.filter((n) => n.parentId === parentId);

  const handleAddStep = useCallback(async () => {
    await addNode({ content: 'New Step', parentId: null });
  }, [addNode]);

  const handleAddSubStep = useCallback(async (parentId: string) => {
    await addNode({ content: 'Sub-step', parentId });
  }, [addNode]);

  const startEditing = useCallback((node: ContextNode) => {
    setEditingNodeId(node.id);
    setEditContent(node.content);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (editingNodeId && editContent.trim()) {
      await updateNode(editingNodeId, { content: editContent.trim() });
    }
    setEditingNodeId(null);
    setEditContent('');
  }, [editingNodeId, editContent, updateNode]);

  const handleDelete = useCallback(async (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNode(nodeId);
  }, [deleteNode]);

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-zinc-100 p-8 flex flex-col">
      {/* Empty state */}
      {mainSteps.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
          <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 12h16M12 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-zinc-500 mb-2">No steps yet</p>
          <p className="text-sm text-zinc-400 mb-4">Create your first step to get started</p>
          <button
            onClick={handleAddStep}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add First Step
          </button>
        </div>
      )}

      {/* Flow steps */}
      {mainSteps.length > 0 && (
        <div className="flex-1 flex items-center justify-center overflow-x-auto py-8">
          <div className="flex items-start gap-2">
            {mainSteps.map((step, index) => {
              const subSteps = getSubSteps(step.id);
              const isEditing = editingNodeId === step.id;

              return (
                <React.Fragment key={step.id}>
                  {/* Step card */}
                  <div className="flex flex-col items-center">
                    {/* Main step */}
                    <div
                      className={`w-48 bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                        isEditing ? 'border-blue-400 shadow-md' : 'border-transparent hover:border-zinc-200 hover:shadow-md'
                      }`}
                      onClick={() => !isEditing && startEditing(step)}
                    >
                      {/* Header with number */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">Step</span>
                        <button
                          className="ml-auto p-1 text-zinc-300 hover:text-red-500 rounded transition-colors"
                          onClick={(e) => handleDelete(step.id, e)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onBlur={handleEditSubmit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSubmit();
                              if (e.key === 'Escape') {
                                setEditingNodeId(null);
                                setEditContent('');
                              }
                            }}
                            className="w-full text-sm font-medium bg-blue-50 rounded px-2 py-1 outline-none border border-blue-200"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-sm font-medium text-zinc-700">{step.content}</p>
                        )}
                      </div>

                      {/* Add sub-step */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSubStep(step.id);
                        }}
                        className="w-full py-2 text-xs text-zinc-400 hover:text-blue-500 hover:bg-blue-50 border-t border-zinc-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add detail
                      </button>
                    </div>

                    {/* Sub-steps */}
                    {subSteps.length > 0 && (
                      <div className="mt-3 w-full space-y-2">
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-zinc-300" />
                        </div>
                        {subSteps.map((sub) => {
                          const isSubEditing = editingNodeId === sub.id;
                          return (
                            <div
                              key={sub.id}
                              className={`bg-zinc-50 border rounded-lg px-3 py-2 text-xs cursor-pointer transition-all ${
                                isSubEditing ? 'border-blue-400 bg-white' : 'border-zinc-200 hover:border-zinc-300 hover:bg-white'
                              }`}
                              onClick={() => !isSubEditing && startEditing(sub)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                {isSubEditing ? (
                                  <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onBlur={handleEditSubmit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditSubmit();
                                      if (e.key === 'Escape') {
                                        setEditingNodeId(null);
                                        setEditContent('');
                                      }
                                    }}
                                    className="flex-1 bg-blue-50 rounded px-1.5 py-0.5 outline-none border border-blue-200 text-xs"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="flex-1 text-zinc-600">{sub.content}</span>
                                )}
                                <button
                                  className="p-0.5 text-zinc-300 hover:text-red-500 rounded transition-colors"
                                  onClick={(e) => handleDelete(sub.id, e)}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Arrow connector */}
                  {index < mainSteps.length - 1 && (
                    <div className="flex items-center self-start mt-12 px-1">
                      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-zinc-300">
                        <path d="M0 12h28M22 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Add new step button at end */}
            <div className="flex items-center self-start mt-12 px-1">
              <svg width="24" height="24" viewBox="0 0 32 24" fill="none" className="text-zinc-200">
                <path d="M0 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
              </svg>
            </div>
            <button
              onClick={handleAddStep}
              className="self-start mt-6 w-12 h-12 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
