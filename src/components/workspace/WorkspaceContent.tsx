'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { NoteView } from '@/components/views/NoteView';
import { MindmapView } from '@/components/views/MindmapView';
import { KanbanView } from '@/components/views/KanbanView';
import { GridView } from '@/components/views/GridView';
import { FreeformView } from '@/components/views/FreeformView';
import { FlowView } from '@/components/views/FlowView';
import { TableView } from '@/components/views/TableView';
import { GanttView } from '@/components/views/GanttView';
import { ObjectGridView } from '@/components/views/ObjectGridView';
import { ObjectTableView } from '@/components/views/ObjectTableView';
import { ObjectListView } from '@/components/views/ObjectListView';
import { ContextMarkdownSidebar } from '@/components/views/ContextMarkdownSidebar';
import { MarkdownView } from '@/components/views/MarkdownView';
import { RightSidebar } from '@/components/views/RightSidebar';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { Context, ObjectType, ObjectItem, Workspace, Project, ViewStyle, ContextType } from '@/types';
import { VISUALIZATION_OPTIONS } from './visualizationOptions';

type ActiveTab = { type: 'context'; id: string } | { type: 'object'; id: string } | { type: 'item'; id: string };
type ObjectDisplayMode = 'grid' | 'list' | 'table';

interface WorkspaceContentProps {
  selectedContext: Context | null;
  selectedObject: ObjectType | null;
  selectedItem: ObjectItem | null;
  currentProject: Project;
  currentWorkspace: Workspace;
  project: string;
  items: ObjectItem[];
  isMarkdownSidebarOpen: boolean;
  onCloseMarkdownSidebar: () => void;
  objectDisplayMode: ObjectDisplayMode;
  onObjectDisplayModeChange: (mode: ObjectDisplayMode) => void;
  setActiveTab: (tab: ActiveTab | null) => void;
  onSelectVisualization: (viewStyle: ViewStyle, type: ContextType) => void;
  onQuickCreateContext: () => void;
  // Dashboard data
  globalContexts: Context[];
  workspaceContexts: Context[];
  projectContexts: Context[];
  globalObjects: ObjectType[];
  workspaceObjects: ObjectType[];
  projectObjects: ObjectType[];
}

export function WorkspaceContent({
  selectedContext,
  selectedObject,
  selectedItem,
  currentProject,
  currentWorkspace,
  project,
  items,
  isMarkdownSidebarOpen,
  onCloseMarkdownSidebar,
  objectDisplayMode,
  onObjectDisplayModeChange,
  setActiveTab,
  onSelectVisualization,
  onQuickCreateContext,
  globalContexts,
  workspaceContexts,
  projectContexts,
  globalObjects,
  workspaceObjects,
  projectObjects,
}: WorkspaceContentProps) {
  const showRightSidebar = useStore((state) => state.userSettings.showRightSidebar);
  const theme = useStore((state) => state.userSettings.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Markdown Sidebar for Context (LEFT) */}
      {selectedContext && (
        <ContextMarkdownSidebar
          context={selectedContext}
          isOpen={isMarkdownSidebarOpen}
          onClose={onCloseMarkdownSidebar}
        />
      )}

      <div className="flex-1 overflow-hidden bg-white">
        <ContentView
          selectedContext={selectedContext}
          selectedObject={selectedObject}
          selectedItem={selectedItem}
          project={project}
          items={items}
          objectDisplayMode={objectDisplayMode}
          onObjectDisplayModeChange={onObjectDisplayModeChange}
          setActiveTab={setActiveTab}
          onSelectVisualization={onSelectVisualization}
          onQuickCreateContext={onQuickCreateContext}
          globalContexts={globalContexts}
          workspaceContexts={workspaceContexts}
          projectContexts={projectContexts}
          globalObjects={globalObjects}
          workspaceObjects={workspaceObjects}
          projectObjects={projectObjects}
        />
      </div>

      {/* Right Sidebar - Resources + AI Chat */}
      {showRightSidebar && (
        <RightSidebar
          workspace={currentWorkspace}
          project={currentProject}
          context={selectedContext || undefined}
          object={selectedObject || undefined}
          item={selectedItem || undefined}
        />
      )}
    </div>
  );
}

// --- Content View (renders the appropriate view for the active tab) ---

interface ContentViewProps {
  selectedContext: Context | null;
  selectedObject: ObjectType | null;
  selectedItem: ObjectItem | null;
  project: string;
  items: ObjectItem[];
  objectDisplayMode: ObjectDisplayMode;
  onObjectDisplayModeChange: (mode: ObjectDisplayMode) => void;
  setActiveTab: (tab: ActiveTab | null) => void;
  onSelectVisualization: (viewStyle: ViewStyle, type: ContextType) => void;
  onQuickCreateContext: () => void;
  globalContexts: Context[];
  workspaceContexts: Context[];
  projectContexts: Context[];
  globalObjects: ObjectType[];
  workspaceObjects: ObjectType[];
  projectObjects: ObjectType[];
}

function ContentView({
  selectedContext,
  selectedObject,
  selectedItem,
  project,
  items,
  objectDisplayMode,
  onObjectDisplayModeChange,
  setActiveTab,
  onSelectVisualization,
  onQuickCreateContext,
  globalContexts,
  workspaceContexts,
  projectContexts,
  globalObjects,
  workspaceObjects,
  projectObjects,
}: ContentViewProps) {
  if (selectedContext) {
    return <ContextView context={selectedContext} onSelectVisualization={onSelectVisualization} />;
  }

  if (selectedItem) {
    return <MarkdownView item={selectedItem} />;
  }

  if (selectedObject) {
    return (
      <ObjectView
        object={selectedObject}
        items={items}
        project={project}
        objectDisplayMode={objectDisplayMode}
        onObjectDisplayModeChange={onObjectDisplayModeChange}
        setActiveTab={setActiveTab}
      />
    );
  }

  // Dashboard view
  return (
    <DashboardView
      globalContexts={globalContexts}
      workspaceContexts={workspaceContexts}
      projectContexts={projectContexts}
      globalObjects={globalObjects}
      workspaceObjects={workspaceObjects}
      projectObjects={projectObjects}
      items={items}
      setActiveTab={setActiveTab}
      onQuickCreateContext={onQuickCreateContext}
    />
  );
}

// --- Context View ---

interface ContextViewProps {
  context: Context;
  onSelectVisualization: (viewStyle: ViewStyle, type: ContextType) => void;
}

function ContextView({ context, onSelectVisualization }: ContextViewProps) {
  const { type, viewStyle } = context;

  if (!viewStyle) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-lg text-zinc-700 mb-1">Choose a visualization</h2>
        <p className="text-sm text-zinc-400 mb-8">How do you want to organize this context?</p>
        <div className="grid grid-cols-4 gap-3 max-w-xl">
          {VISUALIZATION_OPTIONS.map((opt) => (
            <button
              key={opt.viewStyle}
              onClick={() => onSelectVisualization(opt.viewStyle, opt.type)}
              className="group flex flex-col items-center gap-2 p-5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md hover:scale-[1.02] bg-white transition-all duration-200"
            >
              <div className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                {opt.icon}
              </div>
              <span className="text-sm font-medium text-zinc-700">{opt.label}</span>
              <span className="text-[11px] text-zinc-400 text-center leading-tight">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Tree views
  if (type === 'tree') {
    if (viewStyle === 'mindmap') return <MindmapView context={context} />;
    return <NoteView context={context} />;
  }

  // Board views
  if (type === 'board') {
    if (viewStyle === 'kanban') return <KanbanView context={context} />;
    if (viewStyle === 'flow') return <FlowView context={context} />;
    if (viewStyle === 'table') return <TableView context={context} />;
    if (viewStyle === 'gantt') return <GanttView context={context} />;
    return <GridView context={context} />;
  }

  // Canvas view
  return <FreeformView context={context} />;
}

// --- Object View ---

interface ObjectViewProps {
  object: ObjectType;
  items: ObjectItem[];
  project: string;
  objectDisplayMode: ObjectDisplayMode;
  onObjectDisplayModeChange: (mode: ObjectDisplayMode) => void;
  setActiveTab: (tab: ActiveTab | null) => void;
}

function ObjectView({ object, items, project, objectDisplayMode, onObjectDisplayModeChange, setActiveTab }: ObjectViewProps) {
  const isGlobalOrAllProjects = object.availableGlobal || object.availableInProjects.includes('*');
  const objectItems = isGlobalOrAllProjects
    ? items.filter((i) => i.objectId === object.id)
    : items.filter((i) => i.objectId === object.id && i.projectId === project);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-end px-4 py-2 border-b border-zinc-100 bg-white">
        <ViewToggle mode={objectDisplayMode} onChange={onObjectDisplayModeChange} />
      </div>
      <div className="flex-1 overflow-hidden">
        {objectDisplayMode === 'table' ? (
          <ObjectTableView
            object={object}
            items={objectItems}
            workspaceId={project}
            onItemClick={(itemId) => setActiveTab({ type: 'item', id: itemId })}
          />
        ) : objectDisplayMode === 'list' ? (
          <ObjectListView
            object={object}
            items={objectItems}
            workspaceId={project}
            onItemClick={(itemId) => setActiveTab({ type: 'item', id: itemId })}
          />
        ) : (
          <ObjectGridView
            object={object}
            items={objectItems}
            workspaceId={project}
            onItemClick={(itemId) => setActiveTab({ type: 'item', id: itemId })}
          />
        )}
      </div>
    </div>
  );
}

// --- Dashboard View ---

interface DashboardViewProps {
  globalContexts: Context[];
  workspaceContexts: Context[];
  projectContexts: Context[];
  globalObjects: ObjectType[];
  workspaceObjects: ObjectType[];
  projectObjects: ObjectType[];
  items: ObjectItem[];
  setActiveTab: (tab: ActiveTab | null) => void;
  onQuickCreateContext: () => void;
}

function DashboardView({
  globalContexts,
  workspaceContexts,
  projectContexts,
  globalObjects,
  workspaceObjects,
  projectObjects,
  items,
  setActiveTab,
  onQuickCreateContext,
}: DashboardViewProps) {
  const allContexts = [...globalContexts, ...workspaceContexts, ...projectContexts];
  const allObjects = [...globalObjects, ...workspaceObjects, ...projectObjects];

  if (allContexts.length === 0 && allObjects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <p className="mb-4">No contexts or objects yet</p>
          <button
            onClick={onQuickCreateContext}
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
      {allContexts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-800">Contexts</h2>
            <button
              onClick={onQuickCreateContext}
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
}
