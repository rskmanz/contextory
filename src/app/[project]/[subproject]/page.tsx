'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MetaSidebar } from '@/components/layout/MetaSidebar';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddContextModal } from '@/components/modals/AddContextModal';
import { EditContextModal } from '@/components/modals/EditContextModal';
import { AddObjectModal } from '@/components/modals/AddObjectModal';
import { EditObjectModal } from '@/components/modals/EditObjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { ListView } from '@/components/views/ListView';
import { MindmapView } from '@/components/views/MindmapView';
import { KanbanView } from '@/components/views/KanbanView';
import { GridView } from '@/components/views/GridView';
import { FreeformView } from '@/components/views/FreeformView';
import { ObjectGridView } from '@/components/views/ObjectGridView';
import { ContextMarkdownSidebar } from '@/components/views/ContextMarkdownSidebar';
import { useStore } from '@/lib/store';
import { Context, ObjectType, VIEW_STYLES, ViewStyle } from '@/types';

type ActiveTab = { type: 'context'; id: string } | { type: 'object'; id: string };

export default function WorkspacePage() {
  const params = useParams();
  const { project, subproject } = params as { project: string; subproject: string };

  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const contexts = useStore((state) => state.contexts);
  const objects = useStore((state) => state.objects);
  const items = useStore((state) => state.items);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const updateContext = useStore((state) => state.updateContext);
  const deleteContext = useStore((state) => state.deleteContext);
  const deleteObject = useStore((state) => state.deleteObject);

  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [isAddContextOpen, setIsAddContextOpen] = useState(false);
  const [isEditContextOpen, setIsEditContextOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);
  const [isAddObjectOpen, setIsAddObjectOpen] = useState(false);
  const [isEditObjectOpen, setIsEditObjectOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectType | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'context' | 'object'; item: Context | ObjectType } | null>(null);
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true);
  const [isContextsExpanded, setIsContextsExpanded] = useState(true);
  const [isGlobalObjectsExpanded, setIsGlobalObjectsExpanded] = useState(true);
  const [isObjectsExpanded, setIsObjectsExpanded] = useState(true);
  const [isMarkdownSidebarOpen, setIsMarkdownSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProject = projects.find((p) => p.id === project);
  const currentWorkspace = workspaces.find((w) => w.id === subproject);
  const workspaceContexts = contexts.filter((c) => c.workspaceId === subproject);
  const workspaceObjects = objects.filter((o) => o.workspaceId === subproject);
  const globalObjects = objects.filter((o) => o.projectId === project && o.workspaceId === null);

  // Auto-select first context or object
  useEffect(() => {
    if (!activeTab) {
      if (workspaceContexts.length > 0) {
        setActiveTab({ type: 'context', id: workspaceContexts[0].id });
      } else if (workspaceObjects.length > 0) {
        setActiveTab({ type: 'object', id: workspaceObjects[0].id });
      }
    }
  }, [workspaceContexts, workspaceObjects, activeTab]);

  const selectedContext = activeTab?.type === 'context'
    ? workspaceContexts.find((c) => c.id === activeTab.id)
    : null;

  const selectedObject = activeTab?.type === 'object'
    ? workspaceObjects.find((o) => o.id === activeTab.id) || globalObjects.find((o) => o.id === activeTab.id)
    : null;

  const handleEditContext = (ctx: Context) => {
    setEditingContext(ctx);
    setIsEditContextOpen(true);
  };

  const handleDeleteContext = (ctx: Context) => {
    setDeletingItem({ type: 'context', item: ctx });
    setIsDeleteConfirmOpen(true);
  };

  const handleEditObject = (obj: ObjectType) => {
    setEditingObject(obj);
    setIsEditObjectOpen(true);
  };

  const handleDeleteObject = (obj: ObjectType) => {
    if (obj.builtIn) return;
    setDeletingItem({ type: 'object', item: obj });
    setIsDeleteConfirmOpen(true);
  };

  const toggleObjectExpand = (objId: string) => {
    setExpandedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(objId)) {
        next.delete(objId);
      } else {
        next.add(objId);
      }
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    if (deletingItem.type === 'context') {
      await deleteContext(deletingItem.item.id);
      if (activeTab?.type === 'context' && activeTab.id === deletingItem.item.id) {
        setActiveTab(null);
      }
    } else {
      await deleteObject(deletingItem.item.id);
      if (activeTab?.type === 'object' && activeTab.id === deletingItem.item.id) {
        setActiveTab(null);
      }
    }
    setDeletingItem(null);
  };

  const handleViewStyleChange = async (style: ViewStyle) => {
    if (selectedContext) {
      await updateContext(selectedContext.id, { viewStyle: style });
    }
  };

  const getAvailableStyles = () => {
    if (!selectedContext) return [];
    return VIEW_STYLES[selectedContext.type] as readonly string[];
  };

  const renderView = () => {
    if (selectedContext) {
      const { type, viewStyle } = selectedContext;

      // Tree views
      if (type === 'tree') {
        if (viewStyle === 'mindmap') {
          return <MindmapView context={selectedContext} />;
        }
        return <ListView context={selectedContext} />;
      }

      // Board views
      if (type === 'board') {
        if (viewStyle === 'kanban') {
          return <KanbanView context={selectedContext} />;
        }
        if (viewStyle === 'flow') {
          return <KanbanView context={selectedContext} />; // Flow uses KanbanView with edges
        }
        return <GridView context={selectedContext} />;
      }

      // Canvas view
      return <FreeformView context={selectedContext} />;
    }

    if (selectedObject) {
      // For global objects (workspaceId === null), show all items
      // For local objects, filter by workspace
      const objectItems = selectedObject.workspaceId === null
        ? items.filter((i) => i.objectId === selectedObject.id)
        : items.filter((i) => i.objectId === selectedObject.id && i.workspaceId === subproject);
      return <ObjectGridView object={selectedObject} items={objectItems} workspaceId={subproject} />;
    }

    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="mb-4">Select a context or object from the sidebar</p>
          <button
            onClick={() => setIsAddContextOpen(true)}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
          >
            Create your first context
          </button>
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <MetaSidebar activePage="workspace" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentProject || !currentWorkspace) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <MetaSidebar activePage="workspace" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Workspace not found</div>
        </div>
      </div>
    );
  }

  // Get all workspaces for current project
  const projectWorkspaces = workspaces.filter((w) => w.projectId === project);
  // Separate top-level and sub-workspaces
  const topLevelWorkspaces = projectWorkspaces.filter((w) => !w.parentItemId);
  const subWorkspaces = projectWorkspaces.filter((w) => w.parentItemId);

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <MetaSidebar activePage="workspace" />

      {/* Main area with breadcrumb spanning sidebars */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Breadcrumb - spans across sidebars and content */}
        <div className="bg-white border-b border-zinc-100 px-4 py-2.5 flex items-center justify-between">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              {
                label: currentProject.name,
                icon: currentProject.icon,
                options: projects.map(p => {
                  const firstWs = workspaces.find(w => w.projectId === p.id);
                  return {
                    label: p.name,
                    icon: p.icon,
                    href: firstWs ? `/${p.id}/${firstWs.id}` : `/${p.id}`
                  };
                })
              },
              {
                label: currentWorkspace.name,
                icon: currentWorkspace.categoryIcon,
                options: projectWorkspaces.map(ws => ({
                  label: ws.name,
                  icon: ws.categoryIcon,
                  href: `/${project}/${ws.id}`
                }))
              },
            ]}
          />

          <div className="flex items-center gap-2">
            {/* View style switcher */}
            {selectedContext && getAvailableStyles().length > 1 && (
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                {getAvailableStyles().map((style) => (
                  <button
                    key={style}
                    onClick={() => handleViewStyleChange(style as ViewStyle)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                      selectedContext.viewStyle === style
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:bg-white/50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}

            {/* Summary sidebar toggle */}
            {selectedContext && (
              <button
                onClick={() => setIsMarkdownSidebarOpen(!isMarkdownSidebarOpen)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isMarkdownSidebarOpen
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                📝 Summary
              </button>
            )}
          </div>
        </div>

        {/* Content area below breadcrumb */}
        <div className="flex-1 flex overflow-hidden">
          {/* Workspaces Sidebar */}
          <div className="w-48 bg-zinc-50/50 border-r border-zinc-100 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-3">
              <button
                onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
                className="w-full flex items-center gap-2 px-3 mb-1 text-left hover:bg-white/60 rounded-lg py-1 transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-zinc-400 transition-transform ${isWorkspacesExpanded ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Workspaces</span>
                <span className="text-[10px] text-zinc-400 ml-auto">{projectWorkspaces.length}</span>
              </button>
              {isWorkspacesExpanded && (
                <div className="px-2 space-y-0.5">
                  {/* Top-level workspaces */}
                  {topLevelWorkspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/${project}/${ws.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        ws.id === subproject
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                      }`}
                    >
                      <span className="text-sm">{ws.categoryIcon || '📁'}</span>
                      <span className="truncate">{ws.name}</span>
                    </Link>
                  ))}

                  {/* Sub-workspaces section */}
                  {subWorkspaces.length > 0 && (
                    <>
                      <div className="pt-2 pb-1">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider px-3">Sub-workspaces</span>
                      </div>
                      {subWorkspaces.map((ws) => {
                        const parentItem = items.find((i) => i.id === ws.parentItemId);
                        return (
                          <Link
                            key={ws.id}
                            href={`/${project}/${ws.id}`}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              ws.id === subproject
                                ? 'bg-purple-50 text-purple-900 shadow-sm border border-purple-200'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                            }`}
                          >
                            <span className="text-sm">🔗</span>
                            <span className="truncate">{ws.name}</span>
                            {parentItem && (
                              <span className="text-[10px] text-zinc-400 ml-auto truncate max-w-[60px]" title={`From: ${parentItem.name}`}>
                                ← {parentItem.name}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Context & Objects Sidebar */}
          <div className="w-56 bg-white border-r border-zinc-100 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-3">
              {/* Contexts Section */}
              <div className="px-3 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    onClick={() => setIsContextsExpanded(!isContextsExpanded)}
                    className="flex items-center gap-2 flex-1 text-left hover:bg-zinc-50 rounded-lg py-1 px-1 transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-zinc-400 transition-transform ${isContextsExpanded ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Contexts</span>
                    <span className="text-[10px] text-zinc-400">{workspaceContexts.length}</span>
                  </button>
                  <button
                    onClick={() => setIsAddContextOpen(true)}
                    className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                {isContextsExpanded && (
                  <div className="space-y-1">
                    {workspaceContexts.map((ctx) => (
                      <button
                        key={ctx.id}
                        onClick={() => setActiveTab({ type: 'context', id: ctx.id })}
                        onDoubleClick={() => handleEditContext(ctx)}
                        className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab?.type === 'context' && activeTab.id === ctx.id
                            ? 'bg-zinc-100 text-zinc-900'
                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                        }`}
                      >
                        <span className="text-sm">{ctx.icon}</span>
                        <span className="flex-1 text-left truncate">{ctx.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContext(ctx);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </button>
                    ))}
                    {workspaceContexts.length === 0 && (
                      <p className="text-xs text-zinc-400 px-4 py-2">No contexts yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Global Objects Section */}
              {globalObjects.length > 0 && (
                <div className="px-3 mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      onClick={() => setIsGlobalObjectsExpanded(!isGlobalObjectsExpanded)}
                      className="flex items-center gap-2 flex-1 text-left hover:bg-zinc-50 rounded-lg py-1 px-1 transition-colors"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-zinc-400 transition-transform ${isGlobalObjectsExpanded ? 'rotate-90' : ''}`}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Global</span>
                      <span className="text-[10px] text-zinc-400">{globalObjects.length}</span>
                    </button>
                  </div>
                  {isGlobalObjectsExpanded && (
                    <div className="space-y-0.5">
                      {globalObjects.map((obj) => {
                        const objectItems = items.filter((i) => i.objectId === obj.id);
                        const isExpanded = expandedObjects.has(obj.id);
                        return (
                          <div key={obj.id}>
                            <button
                              onClick={() => {
                                setActiveTab({ type: 'object', id: obj.id });
                                toggleObjectExpand(obj.id);
                              }}
                              onDoubleClick={() => handleEditObject(obj)}
                              className={`group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab?.type === 'object' && activeTab.id === obj.id
                                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                              }`}
                            >
                              {/* Expand arrow */}
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                              >
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                              <span className="text-sm">{obj.icon}</span>
                              <span className="flex-1 text-left truncate">{obj.name}</span>
                              <span className="text-[10px] text-zinc-400 tabular-nums">{objectItems.length}</span>
                              {!obj.builtIn && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteObject(obj);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  ×
                                </button>
                              )}
                            </button>
                            {/* Drilled items */}
                            {isExpanded && objectItems.length > 0 && (
                              <div className="ml-5 pl-2 border-l border-blue-200 mt-0.5 space-y-0.5">
                                {objectItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-md cursor-default"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"></span>
                                    <span className="truncate">{item.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isExpanded && objectItems.length === 0 && (
                              <div className="ml-5 pl-2 border-l border-blue-200 mt-0.5">
                                <p className="text-[11px] text-zinc-400 py-1.5 px-2">No items</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Objects Section (Local) */}
              <div className="px-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    onClick={() => setIsObjectsExpanded(!isObjectsExpanded)}
                    className="flex items-center gap-2 flex-1 text-left hover:bg-zinc-50 rounded-lg py-1 px-1 transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-zinc-400 transition-transform ${isObjectsExpanded ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Local</span>
                    <span className="text-[10px] text-zinc-400">{workspaceObjects.length}</span>
                  </button>
                  <button
                    onClick={() => setIsAddObjectOpen(true)}
                    className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                {isObjectsExpanded && (
                  <div className="space-y-0.5">
                    {workspaceObjects.map((obj) => {
                      const objectItems = items.filter((i) => i.objectId === obj.id && i.workspaceId === subproject);
                      const isExpanded = expandedObjects.has(obj.id);
                      return (
                        <div key={obj.id}>
                          <button
                            onClick={() => {
                              setActiveTab({ type: 'object', id: obj.id });
                              toggleObjectExpand(obj.id);
                            }}
                            onDoubleClick={() => handleEditObject(obj)}
                            className={`group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                              activeTab?.type === 'object' && activeTab.id === obj.id
                                ? 'bg-zinc-100 text-zinc-900'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                            }`}
                          >
                            {/* Expand arrow */}
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span className="text-sm">{obj.icon}</span>
                            <span className="flex-1 text-left truncate">{obj.name}</span>
                            <span className="text-[10px] text-zinc-400 tabular-nums">{objectItems.length}</span>
                            {!obj.builtIn && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteObject(obj);
                                }}
                                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </button>
                          {/* Drilled items */}
                          {isExpanded && objectItems.length > 0 && (
                            <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5 space-y-0.5">
                              {objectItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-md cursor-default"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0"></span>
                                  <span className="truncate">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        {isExpanded && objectItems.length === 0 && (
                          <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5">
                            <p className="text-[11px] text-zinc-400 py-1.5 px-2">No items</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                    {workspaceObjects.length === 0 && (
                      <p className="text-xs text-zinc-400 px-3 py-2">No objects yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden bg-white">{renderView()}</div>

            {/* Markdown Sidebar */}
            {selectedContext && (
              <ContextMarkdownSidebar
                context={selectedContext}
                isOpen={isMarkdownSidebarOpen}
                onClose={() => setIsMarkdownSidebarOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddContextModal
        isOpen={isAddContextOpen}
        onClose={() => setIsAddContextOpen(false)}
        workspaceId={subproject}
      />

      <EditContextModal
        isOpen={isEditContextOpen}
        onClose={() => {
          setIsEditContextOpen(false);
          setEditingContext(null);
        }}
        context={editingContext}
      />

      <AddObjectModal
        isOpen={isAddObjectOpen}
        onClose={() => setIsAddObjectOpen(false)}
        projectId={project}
        workspaceId={subproject}
      />

      <EditObjectModal
        isOpen={isEditObjectOpen}
        onClose={() => {
          setIsEditObjectOpen(false);
          setEditingObject(null);
        }}
        object={editingObject}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDelete}
        title={deletingItem?.type === 'context' ? 'Delete Context' : 'Delete Object'}
        message={
          deletingItem?.type === 'context'
            ? `Are you sure you want to delete "${(deletingItem.item as Context).name}"? This will delete all nodes and connections.`
            : `Are you sure you want to delete "${(deletingItem?.item as ObjectType)?.name}"? This will delete all items in this object.`
        }
      />
    </div>
  );
}
