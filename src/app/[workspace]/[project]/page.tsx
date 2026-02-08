'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddContextModal } from '@/components/modals/AddContextModal';
import { EditContextModal } from '@/components/modals/EditContextModal';
import { AddObjectModal } from '@/components/modals/AddObjectModal';
import { EditObjectModal } from '@/components/modals/EditObjectModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { WorkspacesPanel, ContextsObjectsPanel } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent';
import { RightSidebar } from '@/components/views/RightSidebar';
import { CollapsibleSidebar } from '@/components/ui/CollapsibleSidebar';
import { useModalState } from '@/hooks/useModalState';
import { useStore } from '@/lib/store';
import { Context, ObjectType, ObjectItem, Project, Workspace, ViewStyle, ContextType } from '@/types';

type ActiveTab = { type: 'context'; id: string } | { type: 'object'; id: string } | { type: 'item'; id: string };
type ModalName = 'addContext' | 'editContext' | 'addObject' | 'editObject' | 'editProject' | 'deleteConfirm';

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { workspace, project } = params as { workspace: string; project: string };

  const workspaces = useStore((state) => state.workspaces);
  const projects = useStore((state) => state.projects);
  const items = useStore((state) => state.items);
  const contexts = useStore((state) => state.contexts);
  const objects = useStore((state) => state.objects);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const addContext = useStore((state) => state.addContext);
  const updateContext = useStore((state) => state.updateContext);
  const deleteContext = useStore((state) => state.deleteContext);
  const deleteObject = useStore((state) => state.deleteObject);
  const addProject = useStore((state) => state.addProject);
  const deleteProject = useStore((state) => state.deleteProject);
  const deleteItem = useStore((state) => state.deleteItem);
  const updateObject = useStore((state) => state.updateObject);
  const updateItemContextType = useStore((state) => state.updateItemContextType);
  const updateItem = useStore((state) => state.updateItem);
  // Scope-based getters (subscribe to contexts/objects above to trigger re-renders)
  const getGlobalObjects = useStore((state) => state.getGlobalObjects);
  const getWorkspaceObjects = useStore((state) => state.getWorkspaceObjects);
  const getProjectObjects = useStore((state) => state.getProjectObjects);
  const getGlobalContexts = useStore((state) => state.getGlobalContexts);
  const getWorkspaceContexts = useStore((state) => state.getWorkspaceContexts);
  const getProjectContexts = useStore((state) => state.getProjectContexts);

  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [isMarkdownSidebarOpen, setIsMarkdownSidebarOpen] = useState(false);
  const [leftPinned, setLeftPinned] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [rightPinned, setRightPinned] = useState(false);
  const [viewLevel, setViewLevelRaw] = useState<'global' | 'workspace' | 'project'>('project');
  const setViewLevel = React.useCallback((level: 'global' | 'workspace' | 'project') => {
    setViewLevelRaw(level);
    if (level !== 'project') setActiveTab(null);
  }, []);
  const [objectViewScope, setObjectViewScope] = useState<'workspace' | 'project'>('project');
  const [contextViewScope, setContextViewScope] = useState<'workspace' | 'project'>('project');
  const userSettings = useStore((state) => state.userSettings);
  const [objectDisplayMode, setObjectDisplayMode] = useState<'grid' | 'list' | 'table' | 'kanban' | 'gantt'>(userSettings.defaultViewMode);

  const modal = useModalState<ModalName>();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Read ?item= query param to auto-open an item
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId && isLoaded) {
      setActiveTab({ type: 'item', id: itemId });
    }
  }, [searchParams, isLoaded]);

  const currentWorkspace = workspaces.find((p) => p.id === workspace);
  const currentProject = projects.find((w) => w.id === project);
  const workspaceProjects = projects.filter((w) => w.workspaceId === workspace);

  // Contexts by scope
  const globalContexts = getGlobalContexts();
  const workspaceContexts = getWorkspaceContexts(workspace);
  const projectContexts = getProjectContexts(project);
  const displayedContexts = [...projectContexts, ...workspaceContexts, ...globalContexts];
  const filteredContexts = contextViewScope === 'project'
    ? displayedContexts.filter(ctx => ctx.scope === 'project' && ctx.projectId === project)
    : displayedContexts.filter(ctx =>
        ctx.scope === 'workspace' && ctx.workspaceId === workspace ||
        ctx.scope === 'project' && ctx.workspaceId === workspace
      );

  // Objects by scope
  const globalObjects = getGlobalObjects();
  const workspaceObjects = getWorkspaceObjects(workspace);
  const projectObjects = getProjectObjects(project);
  const displayedObjects =
    viewLevel === 'global' ? globalObjects :
    viewLevel === 'workspace' ? [...workspaceObjects, ...globalObjects] :
    [...projectObjects, ...workspaceObjects, ...globalObjects];
  const filteredObjects = objectViewScope === 'project'
    ? displayedObjects.filter(obj =>
        obj.availableInProjects.includes('*') || obj.availableInProjects.includes(project))
    : displayedObjects.filter(obj =>
        obj.availableInWorkspaces.includes('*') || obj.availableInWorkspaces.includes(workspace));

  // Auto-select first context or object (only at project level)
  useEffect(() => {
    if (!activeTab && viewLevel === 'project') {
      if (projectContexts.length > 0) {
        setActiveTab({ type: 'context', id: projectContexts[0].id });
      } else if (projectObjects.length > 0) {
        setActiveTab({ type: 'object', id: projectObjects[0].id });
      }
    }
  }, [projectContexts, projectObjects, activeTab, viewLevel]);

  // Resolved selections
  const selectedContext = activeTab?.type === 'context'
    ? globalContexts.find((c) => c.id === activeTab.id) ||
      workspaceContexts.find((c) => c.id === activeTab.id) ||
      projectContexts.find((c) => c.id === activeTab.id)
    : null;

  const selectedObject = activeTab?.type === 'object'
    ? globalObjects.find((o) => o.id === activeTab.id) ||
      workspaceObjects.find((o) => o.id === activeTab.id) ||
      projectObjects.find((o) => o.id === activeTab.id)
    : null;

  const selectedItem = activeTab?.type === 'item'
    ? items.find((i) => i.id === activeTab.id)
    : null;

  const selectedItemObject = selectedItem
    ? globalObjects.find((o) => o.id === selectedItem.objectId) ||
      workspaceObjects.find((o) => o.id === selectedItem.objectId) ||
      projectObjects.find((o) => o.id === selectedItem.objectId)
    : null;

  // --- Handlers ---

  const handleRemoveObjectFromProject = async (obj: ObjectType) => {
    const updatedProjects = obj.availableInProjects.filter(
      pId => pId !== project && pId !== '*'
    );
    const updatedWorkspaces = obj.availableInWorkspaces.filter(
      wsId => wsId !== workspace && wsId !== '*'
    );
    const hasNoAvailability =
      updatedProjects.length === 0 && updatedWorkspaces.length === 0 && !obj.availableGlobal;

    if (hasNoAvailability) {
      await deleteObject(obj.id);
    } else {
      await updateObject(obj.id, {
        availableInProjects: updatedProjects,
        availableInWorkspaces: updatedWorkspaces,
      });
    }
    if (activeTab?.type === 'object' && activeTab.id === obj.id) {
      setActiveTab(null);
    }
  };

  const confirmDelete = async () => {
    const deletingItem = modal.getData<{ type: 'context' | 'object' | 'project' | 'item'; item: Context | ObjectType | Project | ObjectItem }>();
    if (!deletingItem) return;

    if (deletingItem.type === 'context') {
      await deleteContext(deletingItem.item.id);
      if (activeTab?.type === 'context' && activeTab.id === deletingItem.item.id) setActiveTab(null);
    } else if (deletingItem.type === 'object') {
      await deleteObject(deletingItem.item.id);
      if (activeTab?.type === 'object' && activeTab.id === deletingItem.item.id) setActiveTab(null);
    } else if (deletingItem.type === 'project') {
      await deleteProject(deletingItem.item.id);
      const remainingProjects = projects.filter(w => w.workspaceId === workspace && w.id !== deletingItem.item.id);
      if (remainingProjects.length > 0) {
        window.location.href = `/${workspace}/${remainingProjects[0].id}`;
      } else {
        window.location.href = '/dashboard';
      }
    } else if (deletingItem.type === 'item') {
      await deleteItem(deletingItem.item.id);
      if (activeTab?.type === 'item' && activeTab.id === deletingItem.item.id) setActiveTab(null);
    }
    modal.close();
  };

  const handleAddProject = async () => {
    const id = await addProject({
      name: 'Untitled Project',
      workspaceId: workspace,
      categoryIcon: '📁',
    });
    window.location.href = `/${workspace}/${id}`;
  };

  const handleQuickCreateContext = async () => {
    const id = await addContext({
      name: 'Untitled',
      icon: '📝',
      scope: 'project',
      workspaceId: workspace,
      projectId: project,
      data: { nodes: [], edges: [] },
    });
    setActiveTab({ type: 'context', id });
  };

  const handleSelectVisualization = async (viewStyle: ViewStyle, type: ContextType) => {
    if (selectedContext) {
      await updateContext(selectedContext.id, { viewStyle, type });
    }
  };

  const handleViewStyleChange = async (style: ViewStyle) => {
    if (selectedContext) {
      await updateContext(selectedContext.id, { viewStyle: style });
    } else if (selectedItem) {
      const itemType = selectedItem.contextData?.type || 'tree';
      await updateItemContextType(selectedItem.id, itemType, style);
    }
  };

  // --- Loading / Not Found ---

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace || !currentProject) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Project not found</div>
        </div>
      </div>
    );
  }

  // --- Delete modal helpers ---

  const deletingData = modal.getData<{ type: 'context' | 'object' | 'project' | 'item'; item: Context | ObjectType | Project | ObjectItem }>();

  const deleteTitle =
    deletingData?.type === 'context' ? 'Delete Context' :
    deletingData?.type === 'project' ? 'Delete Project' :
    deletingData?.type === 'item' ? 'Delete Item' :
    'Delete Object';

  const deleteMessage =
    deletingData?.type === 'context'
      ? `Are you sure you want to delete "${(deletingData.item as Context).name}"? This will delete all nodes and connections.`
      : deletingData?.type === 'project'
      ? `Are you sure you want to delete "${(deletingData.item as Project).name}"? This will delete all contexts and objects in this project.`
      : deletingData?.type === 'item'
      ? `Are you sure you want to delete "${(deletingData.item as ObjectItem).name}"?`
      : `Are you sure you want to delete "${(deletingData?.item as ObjectType)?.name}"? This will delete all items in this object.`;

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-zinc-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </Link>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <Breadcrumb
              items={[
                {
                  label: 'Global',
                  icon: '🌐',
                  onClick: () => setViewLevel('global'),
                },
                ...(viewLevel !== 'global' ? [{
                  label: currentWorkspace.name,
                  icon: currentWorkspace.icon,
                  onClick: () => router.push(`/${workspace}`),
                  options: workspaces.map(ws => {
                    const firstProj = projects.find(p => p.workspaceId === ws.id);
                    return {
                      label: ws.name,
                      icon: ws.icon,
                      href: firstProj ? `/${ws.id}/${firstProj.id}` : `/${ws.id}`
                    };
                  })
                }] : []),
                ...(viewLevel === 'project' ? [{
                  label: currentProject.name,
                  icon: currentProject.categoryIcon,
                  options: workspaceProjects.map(proj => ({
                    label: proj.name,
                    icon: proj.categoryIcon,
                    href: `/${workspace}/${proj.id}`
                  }))
                }] : []),
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
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

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          <CollapsibleSidebar
            side="left"
            defaultWidth={showWorkspaces ? 420 : 240}
            resizable
            pinned={leftPinned}
            onPinnedChange={setLeftPinned}
            label="Navigation"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            }
          >
            <div className="flex h-full w-full">
              {showWorkspaces && (
                <div className="w-48 flex-shrink-0 overflow-hidden">
                  <WorkspacesPanel
                    viewLevel={viewLevel}
                    setViewLevel={setViewLevel}
                    workspace={workspace}
                    project={project}
                    currentWorkspace={currentWorkspace}
                    workspaces={workspaces}
                    projects={projects}
                    workspaceProjects={workspaceProjects}
                    items={items}
                    onEditProject={(proj) => modal.open('editProject', proj)}
                    onDeleteProject={(proj) => modal.open('deleteConfirm', { type: 'project', item: proj })}
                    onAddProject={handleAddProject}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <ContextsObjectsPanel
                  viewLevel={viewLevel}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  filteredContexts={filteredContexts}
                  contextViewScope={contextViewScope}
                  setContextViewScope={setContextViewScope}
                  onQuickCreateContext={handleQuickCreateContext}
                  onEditContext={(ctx) => modal.open('editContext', ctx)}
                  onDeleteContext={(ctx) => modal.open('deleteConfirm', { type: 'context', item: ctx })}
                  filteredObjects={filteredObjects}
                  objectViewScope={objectViewScope}
                  setObjectViewScope={setObjectViewScope}
                  onAddObject={() => modal.open('addObject')}
                  onEditObject={(obj) => modal.open('editObject', obj)}
                  onRemoveObject={handleRemoveObjectFromProject}
                  items={items}
                  projects={projects}
                  workspace={workspace}
                  project={project}
                  onUpdateItem={(id, data) => updateItem(id, data)}
                  onDeleteItem={(item) => modal.open('deleteConfirm', { type: 'item', item })}
                  showWorkspacesToggle
                  isWorkspacesOpen={showWorkspaces}
                  onToggleWorkspaces={() => setShowWorkspaces(!showWorkspaces)}
                />
              </div>
            </div>
          </CollapsibleSidebar>

          <WorkspaceContent
            selectedContext={selectedContext || null}
            selectedObject={selectedObject || null}
            selectedItem={selectedItem || null}
            currentProject={currentProject}
            currentWorkspace={currentWorkspace}
            project={project}
            workspace={workspace}
            viewLevel={viewLevel}
            items={items}
            isMarkdownSidebarOpen={isMarkdownSidebarOpen}
            onCloseMarkdownSidebar={() => setIsMarkdownSidebarOpen(false)}
            objectDisplayMode={objectDisplayMode}
            onObjectDisplayModeChange={setObjectDisplayMode}
            setActiveTab={setActiveTab}
            onSelectVisualization={handleSelectVisualization}
            onQuickCreateContext={handleQuickCreateContext}
            globalContexts={globalContexts}
            workspaceContexts={workspaceContexts}
            projectContexts={projectContexts}
            globalObjects={globalObjects}
            workspaceObjects={workspaceObjects}
            projectObjects={projectObjects}
          />

          {/* Right Sidebar */}
          <CollapsibleSidebar
            side="right"
            defaultWidth={320}
            resizable
            pinned={rightPinned}
            onPinnedChange={setRightPinned}
            label="AI Chat"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            }
          >
            <RightSidebar
              workspace={currentWorkspace}
              project={currentProject}
              context={selectedContext || undefined}
              object={selectedObject || undefined}
              item={selectedItem || undefined}
            />
          </CollapsibleSidebar>
        </div>
      </div>

      {/* Modals */}
      <AddContextModal
        isOpen={modal.isOpen('addContext')}
        onClose={modal.close}
        workspaceId={workspace}
        projectId={project}
        defaultScope="project"
        allowedScopes={['global', 'workspace', 'project']}
        objects={objects}
      />

      <EditContextModal
        isOpen={modal.isOpen('editContext')}
        onClose={modal.close}
        context={modal.isOpen('editContext') ? modal.getData<Context>() ?? null : null}
        objects={objects}
      />

      <AddObjectModal
        isOpen={modal.isOpen('addObject')}
        onClose={modal.close}
        workspaceId={workspace}
        projectId={project}
        defaultScope="project"
        allowedScopes={['global', 'workspace', 'project']}
      />

      <EditObjectModal
        isOpen={modal.isOpen('editObject')}
        onClose={modal.close}
        object={modal.isOpen('editObject') ? modal.getData<ObjectType>() ?? null : null}
      />

      <EditProjectModal
        isOpen={modal.isOpen('editProject')}
        onClose={modal.close}
        project={modal.isOpen('editProject') ? modal.getData<Project>() ?? null : null}
      />

      <DeleteConfirmModal
        isOpen={modal.isOpen('deleteConfirm')}
        onClose={modal.close}
        onConfirm={confirmDelete}
        title={deleteTitle}
        message={deleteMessage}
      />
    </div>
  );
}
