'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddContextModal } from '@/components/modals/AddContextModal';
import { EditContextModal } from '@/components/modals/EditContextModal';
import { AddObjectModal } from '@/components/modals/AddObjectModal';
import { EditObjectModal } from '@/components/modals/EditObjectModal';
import { EditWorkspaceModal } from '@/components/modals/EditWorkspaceModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { ListView } from '@/components/views/ListView';
import { MindmapView } from '@/components/views/MindmapView';
import { KanbanView } from '@/components/views/KanbanView';
import { GridView } from '@/components/views/GridView';
import { FreeformView } from '@/components/views/FreeformView';
import { FlowView } from '@/components/views/FlowView';
import { TableView } from '@/components/views/TableView';
import { GanttView } from '@/components/views/GanttView';
import { ObjectGridView } from '@/components/views/ObjectGridView';
import { ContextMarkdownSidebar } from '@/components/views/ContextMarkdownSidebar';
import { MarkdownView } from '@/components/views/MarkdownView';
import { RightSidebar } from '@/components/views/RightSidebar';
import { useStore } from '@/lib/store';
import { Context, ObjectType, ObjectItem, Workspace, VIEW_STYLES, ViewStyle, ObjectScope, ContextType, DEFAULT_VIEW_STYLE } from '@/types';

type ActiveTab = { type: 'context'; id: string } | { type: 'object'; id: string } | { type: 'item'; id: string };

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
  const addContext = useStore((state) => state.addContext);
  const updateContext = useStore((state) => state.updateContext);
  const deleteContext = useStore((state) => state.deleteContext);
  const deleteObject = useStore((state) => state.deleteObject);
  const deleteWorkspace = useStore((state) => state.deleteWorkspace);
  const deleteItem = useStore((state) => state.deleteItem);
  const updateObject = useStore((state) => state.updateObject);
  const updateItemContextType = useStore((state) => state.updateItemContextType);
  const updateItem = useStore((state) => state.updateItem);

  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [isAddContextOpen, setIsAddContextOpen] = useState(false);
  const [isEditContextOpen, setIsEditContextOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);
  const [isAddObjectOpen, setIsAddObjectOpen] = useState(false);
  const [isEditObjectOpen, setIsEditObjectOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectType | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'context' | 'object' | 'workspace' | 'item'; item: Context | ObjectType | Workspace | ObjectItem } | null>(null);
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true);
  const [isContextsExpanded, setIsContextsExpanded] = useState(true);
  const [isGlobalObjectsExpanded, setIsGlobalObjectsExpanded] = useState(true);
  const [isObjectsExpanded, setIsObjectsExpanded] = useState(true);
  const [isMarkdownSidebarOpen, setIsMarkdownSidebarOpen] = useState(false);
  const [isWorkspacesSidebarOpen, setIsWorkspacesSidebarOpen] = useState(true);
  const [isObjectsSidebarOpen, setIsObjectsSidebarOpen] = useState(true);
  const [viewLevel, setViewLevel] = useState<'global' | 'project' | 'workspace'>('workspace');
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [objectViewScope, setObjectViewScope] = useState<'project' | 'workspace'>('workspace');
  const [contextViewScope, setContextViewScope] = useState<'project' | 'workspace'>('workspace');

  // Store functions for scope-based objects
  const getGlobalObjects = useStore((state) => state.getGlobalObjects);
  const getProjectObjects = useStore((state) => state.getProjectObjects);
  const getLocalObjects = useStore((state) => state.getLocalObjects);

  // Store functions for scope-based contexts
  const getGlobalContexts = useStore((state) => state.getGlobalContexts);
  const getProjectContexts = useStore((state) => state.getProjectContexts);
  const getLocalContexts = useStore((state) => state.getLocalContexts);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProject = projects.find((p) => p.id === project);
  const currentWorkspace = workspaces.find((w) => w.id === subproject);
  const projectWorkspaces = workspaces.filter((w) => w.projectId === project);

  // Get contexts by scope
  const globalContexts = getGlobalContexts();
  const projectContexts = getProjectContexts(project);
  const localContexts = getLocalContexts(subproject);

  // Display all contexts available at this workspace (combining all scopes)
  const displayedContexts = [...localContexts, ...projectContexts, ...globalContexts];

  // Filter contexts based on Project/Workspace toggle
  const filteredContexts = contextViewScope === 'workspace'
    ? displayedContexts.filter(ctx => ctx.scope === 'local' && ctx.workspaceId === subproject)
    : displayedContexts.filter(ctx =>
        ctx.scope === 'project' && ctx.projectId === project ||
        ctx.scope === 'local' && ctx.projectId === project
      );

  // Get objects by scope
  const globalObjects = getGlobalObjects();
  const projectObjects = getProjectObjects(project);
  const localObjects = getLocalObjects(subproject);

  // Display all objects available at this workspace (combining all scopes)
  const displayedObjects =
    viewLevel === 'global' ? globalObjects :
    viewLevel === 'project' ? [...projectObjects, ...globalObjects] :
    [...localObjects, ...projectObjects, ...globalObjects];

  // Filter objects based on Project/Workspace toggle
  const filteredObjects = objectViewScope === 'workspace'
    ? displayedObjects.filter(obj =>
        obj.availableInWorkspaces.includes('*') ||
        obj.availableInWorkspaces.includes(subproject)
      )
    : displayedObjects.filter(obj =>
        obj.availableInProjects.includes('*') ||
        obj.availableInProjects.includes(project)
      );

  // Auto-select first context or object
  useEffect(() => {
    if (!activeTab) {
      if (localContexts.length > 0) {
        setActiveTab({ type: 'context', id: localContexts[0].id });
      } else if (localObjects.length > 0) {
        setActiveTab({ type: 'object', id: localObjects[0].id });
      }
    }
  }, [localContexts, localObjects, activeTab]);

  const selectedContext = activeTab?.type === 'context'
    ? globalContexts.find((c) => c.id === activeTab.id) ||
      projectContexts.find((c) => c.id === activeTab.id) ||
      localContexts.find((c) => c.id === activeTab.id)
    : null;

  const selectedObject = activeTab?.type === 'object'
    ? globalObjects.find((o) => o.id === activeTab.id) ||
      projectObjects.find((o) => o.id === activeTab.id) ||
      localObjects.find((o) => o.id === activeTab.id)
    : null;

  const selectedItem = activeTab?.type === 'item'
    ? items.find((i) => i.id === activeTab.id)
    : null;

  const selectedItemObject = selectedItem
    ? globalObjects.find((o) => o.id === selectedItem.objectId) ||
      projectObjects.find((o) => o.id === selectedItem.objectId) ||
      localObjects.find((o) => o.id === selectedItem.objectId)
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

  const handleRemoveObjectFromWorkspace = async (obj: ObjectType) => {
    // Remove this workspace from availability
    const updatedWorkspaces = obj.availableInWorkspaces.filter(
      wsId => wsId !== subproject && wsId !== '*'
    );

    // Remove this project from availability
    const updatedProjects = obj.availableInProjects.filter(
      pId => pId !== project && pId !== '*'
    );

    // Check if this is the last availability - if so, delete permanently (but never delete builtIn objects)
    const hasNoAvailability =
      updatedWorkspaces.length === 0 &&
      updatedProjects.length === 0 &&
      !obj.availableGlobal;

    if (hasNoAvailability) {
      // Permanently delete the object
      await deleteObject(obj.id);
    } else {
      // Just update the availability
      await updateObject(obj.id, {
        availableInWorkspaces: updatedWorkspaces,
        availableInProjects: updatedProjects
      });
    }

    // If this object was active, clear the active tab
    if (activeTab?.type === 'object' && activeTab.id === obj.id) {
      setActiveTab(null);
    }
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

  const handleEditWorkspace = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setIsEditWorkspaceOpen(true);
  };

  const handleDeleteWorkspace = (ws: Workspace) => {
    setDeletingItem({ type: 'workspace', item: ws });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    if (deletingItem.type === 'context') {
      await deleteContext(deletingItem.item.id);
      if (activeTab?.type === 'context' && activeTab.id === deletingItem.item.id) {
        setActiveTab(null);
      }
    } else if (deletingItem.type === 'object') {
      await deleteObject(deletingItem.item.id);
      if (activeTab?.type === 'object' && activeTab.id === deletingItem.item.id) {
        setActiveTab(null);
      }
    } else if (deletingItem.type === 'workspace') {
      await deleteWorkspace(deletingItem.item.id);
      // Navigate to first remaining workspace or home
      const remainingWorkspaces = workspaces.filter(w => w.projectId === project && w.id !== deletingItem.item.id);
      if (remainingWorkspaces.length > 0) {
        window.location.href = `/${project}/${remainingWorkspaces[0].id}`;
      } else {
        window.location.href = '/';
      }
    } else if (deletingItem.type === 'item') {
      await deleteItem(deletingItem.item.id);
      if (activeTab?.type === 'item' && activeTab.id === deletingItem.item.id) {
        setActiveTab(null);
      }
    }
    setDeletingItem(null);
  };

  const handleViewStyleChange = async (style: ViewStyle) => {
    if (selectedContext) {
      await updateContext(selectedContext.id, { viewStyle: style });
    } else if (selectedItem) {
      const itemType = selectedItem.contextData?.type || 'tree';
      await updateItemContextType(selectedItem.id, itemType, style);
    }
  };

  const handleItemContextTypeChange = async (type: ContextType, style: ViewStyle) => {
    if (selectedItem) {
      await updateItemContextType(selectedItem.id, type, style);
    }
  };

  const getAvailableStyles = () => {
    if (selectedContext && selectedContext.type) {
      return VIEW_STYLES[selectedContext.type] as readonly string[];
    }
    if (selectedItem) {
      const itemType = selectedItem.contextData?.type || 'tree';
      return VIEW_STYLES[itemType] as readonly string[];
    }
    return [];
  };

  const getCurrentViewStyle = () => {
    if (selectedContext) {
      return selectedContext.viewStyle;
    }
    if (selectedItem) {
      return selectedItem.contextData?.viewStyle || DEFAULT_VIEW_STYLE[selectedItem.contextData?.type || 'tree'];
    }
    return 'list';
  };

  const getCurrentContextType = () => {
    if (selectedContext) {
      return selectedContext.type;
    }
    if (selectedItem) {
      return selectedItem.contextData?.type || 'tree';
    }
    return 'tree';
  };

  // Quick create context without modal
  const handleQuickCreateContext = async () => {
    const id = await addContext({
      name: 'Untitled',
      icon: '📝',
      scope: 'local',
      projectId: project,
      workspaceId: subproject,
      data: { nodes: [], edges: [] },
    });
    setActiveTab({ type: 'context', id });
  };

  // Handle visualization type selection
  const handleSelectVisualization = async (viewStyle: ViewStyle, type: ContextType) => {
    if (selectedContext) {
      await updateContext(selectedContext.id, { viewStyle, type });
    }
  };

  // Visualization options for grid
  const visualizationOptions = [
    { viewStyle: 'mindmap' as ViewStyle, type: 'tree' as ContextType, icon: '🗺️', label: 'Mindmap', description: 'Visual hierarchy' },
    { viewStyle: 'list' as ViewStyle, type: 'tree' as ContextType, icon: '📝', label: 'List', description: 'Nested outline' },
    { viewStyle: 'kanban' as ViewStyle, type: 'board' as ContextType, icon: '📋', label: 'Kanban', description: 'Cards in columns' },
    { viewStyle: 'flow' as ViewStyle, type: 'board' as ContextType, icon: '📊', label: 'Flow', description: 'Connected nodes' },
    { viewStyle: 'grid' as ViewStyle, type: 'board' as ContextType, icon: '⊞', label: 'Grid', description: 'Card layout' },
    { viewStyle: 'table' as ViewStyle, type: 'board' as ContextType, icon: '📑', label: 'Table', description: 'Rows and columns' },
    { viewStyle: 'gantt' as ViewStyle, type: 'board' as ContextType, icon: '📅', label: 'Gantt', description: 'Timeline view' },
    { viewStyle: 'freeform' as ViewStyle, type: 'canvas' as ContextType, icon: '🎨', label: 'Canvas', description: 'Free positioning' },
  ];

  const renderView = () => {
    if (selectedContext) {
      const { type, viewStyle } = selectedContext;

      // Show visualization selector if no viewStyle set
      if (!viewStyle) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold text-zinc-800 mb-2">Choose a visualization</h2>
            <p className="text-zinc-500 mb-8">How do you want to organize this context?</p>
            <div className="grid grid-cols-4 gap-4 max-w-2xl">
              {visualizationOptions.map((opt) => (
                <button
                  key={opt.viewStyle}
                  onClick={() => handleSelectVisualization(opt.viewStyle, opt.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="font-medium text-zinc-800">{opt.label}</span>
                  <span className="text-xs text-zinc-500 text-center">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }

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
          return <FlowView context={selectedContext} />;
        }
        if (viewStyle === 'table') {
          return <TableView context={selectedContext} />;
        }
        if (viewStyle === 'gantt') {
          return <GanttView context={selectedContext} />;
        }
        return <GridView context={selectedContext} />;
      }

      // Canvas view
      return <FreeformView context={selectedContext} />;
    }

    if (selectedItem) {
      // Items show markdown only
      return <MarkdownView item={selectedItem} />;
    }

    if (selectedObject) {
      // For global/all-workspace objects, show all items
      // For workspace-specific objects, filter by workspace
      const isGlobalOrAllWorkspaces = selectedObject.availableGlobal ||
        selectedObject.availableInWorkspaces.includes('*');
      const objectItems = isGlobalOrAllWorkspaces
        ? items.filter((i) => i.objectId === selectedObject.id)
        : items.filter((i) => i.objectId === selectedObject.id && i.workspaceId === subproject);
      return (
        <ObjectGridView
          object={selectedObject}
          items={objectItems}
          workspaceId={subproject}
          onItemClick={(itemId) => setActiveTab({ type: 'item', id: itemId })}
        />
      );
    }

    // Dashboard view - show all contexts and objects as cards
    const allContexts = [...globalContexts, ...projectContexts, ...localContexts];
    const allObjects = [...globalObjects, ...projectObjects, ...localObjects];

    if (allContexts.length === 0 && allObjects.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <p className="mb-4">No contexts or objects yet</p>
            <button
              onClick={handleQuickCreateContext}
              className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
            >
              Create your first context
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto p-6">
        {/* Contexts Grid */}
        {allContexts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-800">Contexts</h2>
              <button
                onClick={handleQuickCreateContext}
                className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {allContexts.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => setActiveTab({ type: 'context', id: ctx.id })}
                  className="flex flex-col items-start p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 hover:shadow-sm transition-all text-left"
                >
                  <span className="text-2xl mb-2">{ctx.icon}</span>
                  <span className="font-medium text-zinc-800">{ctx.name}</span>
                  <span className="text-xs text-zinc-500 capitalize">{ctx.viewStyle || 'Not set'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Objects Grid */}
        {allObjects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">Objects</h2>
            <div className="grid grid-cols-3 gap-4">
              {allObjects.map((obj) => {
                const objectItems = items.filter((i) => i.objectId === obj.id);
                return (
                  <button
                    key={obj.id}
                    onClick={() => setActiveTab({ type: 'object', id: obj.id })}
                    className="flex flex-col items-start p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 hover:shadow-sm transition-all text-left"
                  >
                    <span className="text-2xl mb-2">{obj.icon}</span>
                    <span className="font-medium text-zinc-800">{obj.name}</span>
                    <span className="text-xs text-zinc-500">{objectItems.length} items</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentProject || !currentWorkspace) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Workspace not found</div>
        </div>
      </div>
    );
  }

  // Separate top-level and sub-workspaces
  const topLevelWorkspaces = projectWorkspaces.filter((w) => !w.parentItemId);
  const subWorkspaces = projectWorkspaces.filter((w) => w.parentItemId);

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header with nav icons + breadcrumb + controls */}
        <div className="bg-white border-b border-zinc-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Home */}
            <Link
              href="/"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </Link>
            {/* Search */}
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            {/* Breadcrumb */}
            <Breadcrumb
            items={[
              {
                label: 'Global',
                icon: '🌐',
                onClick: () => setViewLevel('global'),
              },
              ...(viewLevel !== 'global' ? [{
                label: currentProject.name,
                icon: currentProject.icon,
                onClick: () => setViewLevel(viewLevel === 'workspace' ? 'project' : 'workspace'),
                options: projects.map(p => {
                  const firstWs = workspaces.find(w => w.projectId === p.id);
                  return {
                    label: p.name,
                    icon: p.icon,
                    href: firstWs ? `/${p.id}/${firstWs.id}` : `/${p.id}`
                  };
                })
              }] : []),
              ...(viewLevel === 'workspace' ? [{
                label: currentWorkspace.name,
                icon: currentWorkspace.categoryIcon,
                options: projectWorkspaces.map(ws => ({
                  label: ws.name,
                  icon: ws.categoryIcon,
                  href: `/${project}/${ws.id}`
                }))
              }] : []),
            ]}
          />
          </div>

          <div className="flex items-center gap-2">
            {/* Item info - show when viewing an item */}
            {selectedItem && selectedItemObject && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-sm">{selectedItemObject.icon}</span>
                <span className="text-sm font-medium text-zinc-700 truncate max-w-[150px]">{selectedItem.name}</span>
                <button
                  onClick={() => setActiveTab({ type: 'object', id: selectedItemObject.id })}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                  title="Back to object"
                >
                  ←
                </button>
              </div>
            )}

            {/* Summary sidebar toggle for Context */}
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


            {/* Settings */}
            <Link
              href="/settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </Link>
          </div>
        </div>

        {/* Content area below breadcrumb */}
        <div className="flex-1 flex overflow-hidden">
          {/* Workspaces Sidebar */}
          {isWorkspacesSidebarOpen ? (
          <div className="w-48 bg-zinc-50/50 border-r border-zinc-100 flex flex-col overflow-hidden">
            {/* Close button */}
            <div className="px-2 pt-2 flex justify-end">
              <button
                onClick={() => setIsWorkspacesSidebarOpen(false)}
                className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-white/80 transition-colors"
                title="Hide workspaces"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {/* Projects list (Global view) */}
              {viewLevel === 'global' ? (
                <>
                  <button
                    onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                    className="w-full flex items-center gap-2 px-3 mb-1 text-left hover:bg-white/60 rounded-lg py-1 transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-zinc-400 transition-transform ${isProjectsExpanded ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Projects</span>
                    <span className="text-[10px] text-zinc-400 ml-auto">{projects.length}</span>
                  </button>
                  {isProjectsExpanded && (
                    <div className="px-2 space-y-0.5">
                      {projects.map((proj) => {
                        const projWorkspaces = workspaces.filter(w => w.projectId === proj.id);
                        const isExpanded = expandedProjects.has(proj.id);
                        return (
                          <div key={proj.id}>
                            <div
                              className={`group flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                proj.id === project
                                  ? 'bg-white text-zinc-900 shadow-sm'
                                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setExpandedProjects(prev => {
                                    const next = new Set(prev);
                                    if (next.has(proj.id)) {
                                      next.delete(proj.id);
                                    } else {
                                      next.add(proj.id);
                                    }
                                    return next;
                                  });
                                }}
                                className="flex-shrink-0"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                >
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                              </button>
                              <div
                                className="flex items-center gap-2 flex-1 min-w-0"
                                onClick={() => {
                                  setViewLevel('project');
                                  if (proj.id !== project) {
                                    const firstWs = workspaces.find(w => w.projectId === proj.id);
                                    if (firstWs) {
                                      window.location.href = `/${proj.id}/${firstWs.id}`;
                                    }
                                  }
                                }}
                              >
                                <span className="text-sm">{proj.icon || '📁'}</span>
                                <span className="truncate flex-1">{proj.name}</span>
                                <span className="text-[10px] text-zinc-400">{projWorkspaces.length}</span>
                              </div>
                            </div>
                            {isExpanded && projWorkspaces.length > 0 && (
                              <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5 space-y-0.5">
                                {projWorkspaces.map((ws) => (
                                  <div
                                    key={ws.id}
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-white/60 rounded-md cursor-pointer"
                                    onClick={() => {
                                      setViewLevel('workspace');
                                      window.location.href = `/${proj.id}/${ws.id}`;
                                    }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0"></span>
                                    <span className="text-sm">{ws.categoryIcon || '📁'}</span>
                                    <span className="truncate">{ws.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isExpanded && projWorkspaces.length === 0 && (
                              <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5">
                                <p className="text-[11px] text-zinc-400 py-1.5 px-2">No workspaces</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {projects.length === 0 && (
                        <p className="text-xs text-zinc-400 px-3 py-2">No projects yet</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
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
                    <div key={ws.id} className="group relative">
                      <Link
                        href={`/${project}/${ws.id}`}
                        onClick={() => setViewLevel('workspace')}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          ws.id === subproject && viewLevel === 'workspace'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                        }`}
                      >
                        <span className="text-sm">{ws.categoryIcon || '📁'}</span>
                        <span className="truncate flex-1">{ws.name}</span>
                      </Link>
                      {/* Edit/Delete actions on hover */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditWorkspace(ws); }}
                          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-white/80"
                          title="Edit workspace"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteWorkspace(ws); }}
                          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded hover:bg-white/80"
                          title="Delete workspace"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
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
                          <div key={ws.id} className="group relative">
                            <Link
                              href={`/${project}/${ws.id}`}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                ws.id === subproject
                                  ? 'bg-purple-50 text-purple-900 shadow-sm border border-purple-200'
                                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                              }`}
                            >
                              <span className="text-sm">🔗</span>
                              <span className="truncate flex-1">{ws.name}</span>
                              {parentItem && (
                                <span className="text-[10px] text-zinc-400 truncate max-w-[60px]" title={`From: ${parentItem.name}`}>
                                  ← {parentItem.name}
                                </span>
                              )}
                            </Link>
                            {/* Edit/Delete actions on hover */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditWorkspace(ws); }}
                                className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-white/80"
                                title="Edit workspace"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteWorkspace(ws); }}
                                className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded hover:bg-white/80"
                                title="Delete workspace"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </div>
          ) : (
            <button
              onClick={() => setIsWorkspacesSidebarOpen(true)}
              className="w-8 bg-zinc-50/50 border-r border-zinc-100 flex flex-col items-center pt-3 hover:bg-zinc-100/50 transition-colors"
              title="Show workspaces"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}

          {/* Context & Objects Sidebar */}
          {isObjectsSidebarOpen ? (
          <div className="w-56 bg-white border-r border-zinc-100 flex flex-col overflow-hidden">
            {/* Close button */}
            <div className="px-2 pt-2 flex justify-end">
              <button
                onClick={() => setIsObjectsSidebarOpen(false)}
                className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-100 transition-colors"
                title="Hide contexts & objects"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {/* Contexts Section */}
              {viewLevel === 'workspace' && (
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
                  </button>
                  <button
                    onClick={handleQuickCreateContext}
                    className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                {isContextsExpanded && (
                  <>
                    {/* Project/Workspace Toggle */}
                    <div className="flex items-center gap-1 mb-2 bg-zinc-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setContextViewScope('project')}
                        className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                          contextViewScope === 'project'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Project
                      </button>
                      <button
                        onClick={() => setContextViewScope('workspace')}
                        className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                          contextViewScope === 'workspace'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Workspace
                      </button>
                    </div>
                    {/* Contexts List */}
                    <div className="space-y-1">
                      {filteredContexts.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-2 text-center">
                          No contexts
                        </p>
                      ) : (
                        filteredContexts.map((ctx) => (
                          <div
                            key={ctx.id}
                            onClick={() => setActiveTab({ type: 'context', id: ctx.id })}
                            onDoubleClick={() => handleEditContext(ctx)}
                            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              )}

              {/* Objects Section with Scope Switch Bar */}
              <div className="px-3">
                {/* Header with toggle */}
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
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Objects</span>
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
                  <>
                {/* Project/Workspace Toggle */}
                <div className="flex items-center gap-1 mb-2 bg-zinc-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setObjectViewScope('project')}
                    className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                      objectViewScope === 'project'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Project
                  </button>
                  <button
                    onClick={() => setObjectViewScope('workspace')}
                    className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                      objectViewScope === 'workspace'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Workspace
                  </button>
                </div>
                {/* Objects List */}
                <div className="space-y-0.5">
                  {filteredObjects.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2 text-center">No objects</p>
                  ) : (
                    filteredObjects.map((obj) => {
                      const objectItems = items.filter((i) => {
                        if (i.objectId !== obj.id) return false;
                        if (objectViewScope === 'workspace') {
                          return i.workspaceId === subproject;
                        }
                        // Project scope - show items from any workspace in this project
                        const ws = workspaces.find(w => w.id === i.workspaceId);
                        return ws?.projectId === project;
                      });
                      const isExpanded = expandedObjects.has(obj.id);
                      return (
                        <div key={obj.id}>
                          <div
                            className={`group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                              activeTab?.type === 'object' && activeTab.id === obj.id
                                ? 'bg-zinc-100 text-zinc-900'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                            }`}
                          >
                            {/* Toggle button - only expands/collapses */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleObjectExpand(obj.id);
                              }}
                              className="flex-shrink-0 p-0.5 hover:bg-zinc-200 rounded transition-colors"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              >
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                            {/* Object name - selects as active tab */}
                            <div
                              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                              onClick={() => setActiveTab({ type: 'object', id: obj.id })}
                              onDoubleClick={() => handleEditObject(obj)}
                            >
                              <span className="text-sm">{obj.icon}</span>
                              <span className="flex-1 text-left truncate">{obj.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 tabular-nums">{objectItems.length}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveObjectFromWorkspace(obj);
                              }}
                              className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                              title="Remove from this workspace"
                            >
                              ×
                            </button>
                          </div>
                          {isExpanded && objectItems.length > 0 && (
                            <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5 space-y-0.5">
                              {objectItems.map((item) => (
                                <div
                                  key={item.id}
                                  draggable={editingItemId !== item.id}
                                  onDragStart={(e) => {
                                    if (editingItemId === item.id) {
                                      e.preventDefault();
                                      return;
                                    }
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                      itemId: item.id,
                                      itemName: item.name,
                                      objectIcon: obj.icon,
                                    }));
                                    e.dataTransfer.effectAllowed = 'copy';
                                  }}
                                  className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer ${
                                    activeTab?.type === 'item' && activeTab.id === item.id
                                      ? 'bg-zinc-100 text-zinc-900 font-medium'
                                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                                  }`}
                                  onClick={() => {
                                    if (editingItemId !== item.id) {
                                      setActiveTab({ type: 'item', id: item.id });
                                    }
                                  }}
                                  onDoubleClick={() => {
                                    setEditingItemId(item.id);
                                    setEditItemName(item.name);
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0"></span>
                                  {editingItemId === item.id ? (
                                    <input
                                      type="text"
                                      value={editItemName}
                                      onChange={(e) => setEditItemName(e.target.value)}
                                      onBlur={async () => {
                                        if (editItemName.trim() && editItemName !== item.name) {
                                          await updateItem(item.id, { name: editItemName.trim() });
                                        }
                                        setEditingItemId(null);
                                        setEditItemName('');
                                      }}
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                          if (editItemName.trim() && editItemName !== item.name) {
                                            await updateItem(item.id, { name: editItemName.trim() });
                                          }
                                          setEditingItemId(null);
                                          setEditItemName('');
                                        }
                                        if (e.key === 'Escape') {
                                          setEditingItemId(null);
                                          setEditItemName('');
                                        }
                                      }}
                                      className="flex-1 bg-white border border-blue-400 rounded px-1 py-0.5 text-xs outline-none"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <>
                                      <span className="truncate flex-1">{item.name}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingItem({ type: 'item', item });
                                          setIsDeleteConfirmOpen(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                                      >
                                        ×
                                      </button>
                                    </>
                                  )}
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
                    })
                  )}
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
          ) : (
            <button
              onClick={() => setIsObjectsSidebarOpen(true)}
              className="w-8 bg-white border-r border-zinc-100 flex flex-col items-center pt-3 hover:bg-zinc-50 transition-colors"
              title="Show contexts & objects"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Markdown Sidebar for Context (LEFT) */}
            {selectedContext && (
              <ContextMarkdownSidebar
                context={selectedContext}
                isOpen={isMarkdownSidebarOpen}
                onClose={() => setIsMarkdownSidebarOpen(false)}
              />
            )}

            <div className="flex-1 overflow-hidden bg-white">{renderView()}</div>

            {/* Right Sidebar - Resources + AI Chat */}
            {currentWorkspace && (
              <RightSidebar
                workspace={currentWorkspace}
                project={currentProject}
                context={selectedContext || undefined}
                object={selectedObject || undefined}
                item={selectedItem || undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddContextModal
        isOpen={isAddContextOpen}
        onClose={() => setIsAddContextOpen(false)}
        projectId={project}
        workspaceId={subproject}
        defaultScope="local"
        allowedScopes={['global', 'project', 'local']}
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
        defaultScope="local"
        allowedScopes={['global', 'project', 'local']}
      />

      <EditObjectModal
        isOpen={isEditObjectOpen}
        onClose={() => {
          setIsEditObjectOpen(false);
          setEditingObject(null);
        }}
        object={editingObject}
      />

      <EditWorkspaceModal
        isOpen={isEditWorkspaceOpen}
        onClose={() => {
          setIsEditWorkspaceOpen(false);
          setEditingWorkspace(null);
        }}
        workspace={editingWorkspace}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDelete}
        title={
          deletingItem?.type === 'context' ? 'Delete Context' :
          deletingItem?.type === 'workspace' ? 'Delete Workspace' :
          deletingItem?.type === 'item' ? 'Delete Item' :
          'Delete Object'
        }
        message={
          deletingItem?.type === 'context'
            ? `Are you sure you want to delete "${(deletingItem.item as Context).name}"? This will delete all nodes and connections.`
            : deletingItem?.type === 'workspace'
            ? `Are you sure you want to delete "${(deletingItem.item as Workspace).name}"? This will delete all contexts and objects in this workspace.`
            : deletingItem?.type === 'item'
            ? `Are you sure you want to delete "${(deletingItem.item as ObjectItem).name}"?`
            : `Are you sure you want to delete "${(deletingItem?.item as ObjectType)?.name}"? This will delete all items in this object.`
        }
      />

    </div>
  );
}
