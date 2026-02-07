'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Workspace, Resource, Project, Context, ObjectType, ObjectItem, ConnectionType } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { SourcesTab } from '@/components/sidebar/SourcesTab';
import { type ActionLogEntry } from '@/components/sidebar/ChatPanel';
import { ActionsTab } from '@/components/sidebar/ActionsTab';
import { ChatPanel, type ChatPanelHandle } from '@/components/sidebar/ChatPanel';

interface RightSidebarProps {
  workspace: Workspace;
  project?: Project;
  context?: Context;
  object?: ObjectType;
  item?: ObjectItem;
}

/* ─── Collapsible Flow Section ─── */

interface FlowSectionProps {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  isLast?: boolean;
  children: React.ReactNode;
}

const FlowSection: React.FC<FlowSectionProps> = ({ step, title, subtitle, icon, collapsed, onToggle, isLast, children }) => {
  return (
    <div className="relative">
      {/* Thin connector line between steps */}
      {!isLast && !collapsed && (
        <div
          className="absolute left-[18px] top-[34px] w-px bg-zinc-200 transition-all"
          style={{ height: 'calc(100% - 34px)' }}
        />
      )}

      <button
        onClick={onToggle}
        className="group w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50/80 transition-colors"
      >
        {/* Step indicator — small, minimal */}
        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 z-10 transition-colors ${
          collapsed
            ? 'bg-zinc-100 text-zinc-400'
            : 'bg-zinc-900 text-white'
        }`}>
          {step}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <span className={`text-[11px] font-medium transition-colors ${
            collapsed ? 'text-zinc-400' : 'text-zinc-700'
          }`}>
            {title}
          </span>
          {collapsed && (
            <p className="text-[9px] text-zinc-300 leading-tight">{subtitle}</p>
          )}
        </div>

        <span className={`text-zinc-300 group-hover:text-zinc-400 transition-colors shrink-0 ${collapsed ? '' : 'text-zinc-500'}`}>
          {icon}
        </span>

        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-zinc-300 group-hover:text-zinc-400 transition-all shrink-0 ${collapsed ? '' : 'rotate-180'}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="ml-[18px] pl-4 pr-0 pb-1">
          {children}
        </div>
      )}

      <div className="border-b border-zinc-100/80" />
    </div>
  );
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  workspace,
  project,
  context,
  object,
  item,
}) => {
  const updateProject = useStore((state) => state.updateProject);
  const updateWorkspace = useStore((state) => state.updateWorkspace);
  const connections = useStore((state) => state.connections);
  const addConnection = useStore((state) => state.addConnection);
  const deleteConnection = useStore((state) => state.deleteConnection);

  const [isDragOver, setIsDragOver] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);

  // Section collapse state
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [analyzeCollapsed, setAnalyzeCollapsed] = useState(false);
  const [actionsCollapsed, setActionsCollapsed] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<ChatPanelHandle>(null);

  const workspaceResources: Resource[] = workspace.resources || [];
  const projectResources: Resource[] = project?.resources || [];
  const resources: Resource[] = [...workspaceResources, ...projectResources];

  const relevantConnections = connections.filter(
    (c) =>
      c.scope === 'global' ||
      (c.scope === 'workspace' && c.workspaceId === workspace.id) ||
      (c.scope === 'project' && project && c.projectId === project.id)
  );

  // ─── Resource handlers ───

  const saveNewResource = useCallback(async (newResource: Resource) => {
    if (project) {
      await updateProject(project.id, {
        resources: [...projectResources, newResource],
      });
    } else {
      await updateWorkspace(workspace.id, {
        resources: [...workspaceResources, newResource],
      });
    }
  }, [project, projectResources, workspaceResources, updateProject, updateWorkspace, workspace.id]);

  const handleQuickAddResource = useCallback(async (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    let fetchedContent = '';
    let fetchedTitle = '';

    try {
      const hostname = new URL(fullUrl).hostname;
      fetchedTitle = hostname || url;
      const res = await fetch('/api/resources/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl }),
      });
      const data = await res.json();
      if (data.success) {
        fetchedContent = data.data.content || '';
        fetchedTitle = data.data.title || fetchedTitle;
      }
    } catch {
      fetchedTitle = url;
    }

    const newResource: Resource = {
      id: generateId(),
      name: fetchedTitle,
      type: 'url',
      url: fullUrl,
      content: fetchedContent,
      addedAt: new Date().toISOString(),
    };
    await saveNewResource(newResource);
  }, [saveNewResource]);

  const handleAddNote = useCallback(async () => {
    const newResource: Resource = {
      id: generateId(),
      name: 'New Note',
      type: 'note',
      content: '',
      addedAt: new Date().toISOString(),
    };
    await saveNewResource(newResource);
    setEditingNoteId(newResource.id);
  }, [saveNewResource]);

  const handleUpdateNote = useCallback(async (resourceId: string, content: string) => {
    const updateResource = (r: Resource) =>
      r.id === resourceId ? { ...r, content, name: content.slice(0, 50) || 'Note' } : r;

    if (project && projectResources.some(r => r.id === resourceId)) {
      await updateProject(project.id, { resources: projectResources.map(updateResource) });
    } else {
      await updateWorkspace(workspace.id, { resources: workspaceResources.map(updateResource) });
    }
    setEditingNoteId(null);
  }, [project, projectResources, workspaceResources, updateProject, updateWorkspace, workspace.id]);

  const handleDeleteResource = useCallback(async (resourceId: string) => {
    if (project && projectResources.some(r => r.id === resourceId)) {
      await updateProject(project.id, { resources: projectResources.filter((r: Resource) => r.id !== resourceId) });
    } else {
      await updateWorkspace(workspace.id, { resources: workspaceResources.filter((r: Resource) => r.id !== resourceId) });
    }
    if (editingNoteId === resourceId) setEditingNoteId(null);
  }, [project, projectResources, workspaceResources, updateProject, updateWorkspace, workspace.id, editingNoteId]);

  const handleResourceClick = useCallback((resource: Resource) => {
    if (resource.type === 'note') { setEditingNoteId(resource.id); return; }
    if (resource.url) window.open(resource.url, '_blank');
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      await saveNewResource({
        id: generateId(),
        name: file.name,
        type: 'file',
        content: content.slice(0, 50000),
        addedAt: new Date().toISOString(),
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [saveNewResource]);

  // ─── Connection handlers ───

  const handleAddConnection = useCallback(async (type: ConnectionType, name: string, url?: string) => {
    await addConnection({
      name, type,
      url: url || undefined,
      scope: project ? 'project' : 'workspace',
      workspaceId: workspace.id,
      projectId: project?.id,
    });
  }, [addConnection, project, workspace.id]);

  const handleDeleteConnection = useCallback(async (id: string) => {
    await deleteConnection(id);
  }, [deleteConnection]);

  // ─── Drag & Drop ───

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const text = e.dataTransfer.getData('text');
    if (text && /^(https?:\/\/|www\.)/.test(text.trim())) {
      await handleQuickAddResource(text.trim());
    }
  }, [handleQuickAddResource]);

  const handleSummarizeResource = useCallback(() => {}, []);

  // ─── Actions log ───

  const handleActionsCreated = useCallback((entries: ActionLogEntry[]) => {
    setActionLog(prev => [...entries, ...prev]);
    setActionsCollapsed(false);
  }, []);

  const currentDocName = item?.name || context?.name;
  const currentDocType = item ? 'item' as const : context ? 'context' as const : undefined;

  const resourcesWithContent = resources.filter(r => r.content).length;
  const hasAnalyzableContent = resourcesWithContent > 0 || !!currentDocName;

  const handleAnalyze = useCallback(() => {
    if (!chatRef.current) return;

    const analyzableResources = resources
      .filter(r => r.content || r.url)
      .map(r => ({
        name: r.name,
        content: r.content,
        summary: r.summary,
        url: r.url,
      }));

    chatRef.current.runAnalysis({
      resources: analyzableResources,
      workspaceId: workspace.id,
      projectId: project?.id,
    });
  }, [resources, workspace.id, project?.id]);

  return (
    <div
      className={`w-80 border-l flex flex-col h-full transition-colors ${
        isDragOver ? 'border-blue-300 bg-blue-50/30' : 'border-zinc-100 bg-zinc-50/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Scrollable flow pipeline */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 1. Sources */}
        <FlowSection
          step={1}
          title="Sources"
          subtitle="Add resources and connections"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
          collapsed={sourcesCollapsed}
          onToggle={() => setSourcesCollapsed(v => !v)}
        >
          <SourcesTab
            currentDocName={currentDocName}
            currentDocType={currentDocType}
            resources={resources}
            onAddUrl={handleQuickAddResource}
            onAddNote={handleAddNote}
            onFileUpload={() => fileInputRef.current?.click()}
            onWebResearch={() => {}}
            onResourceClick={handleResourceClick}
            onSummarizeResource={handleSummarizeResource}
            onDeleteResource={handleDeleteResource}
            onUpdateNote={handleUpdateNote}
            editingNoteId={editingNoteId}
            setEditingNoteId={setEditingNoteId}
            connections={relevantConnections}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
          />
        </FlowSection>

        {/* 2. Analyze */}
        <FlowSection
          step={2}
          title="Analyze"
          subtitle="AI-powered analysis"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          collapsed={analyzeCollapsed}
          onToggle={() => setAnalyzeCollapsed(v => !v)}
        >
          <div className="px-3 py-3">
            {hasAnalyzableContent ? (
              <>
                <p className="text-[10px] text-zinc-500 mb-2">
                  {currentDocName && (
                    <span className="block mb-1">
                      Current: <span className="font-medium text-zinc-700">{currentDocName}</span>
                    </span>
                  )}
                  {resourcesWithContent > 0 && (
                    <span className="block">
                      {resourcesWithContent} source{resourcesWithContent !== 1 ? 's' : ''} loaded
                    </span>
                  )}
                </p>
                <button
                  onClick={handleAnalyze}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-lg text-[11px] font-medium hover:bg-zinc-800 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Analyze
                </button>
              </>
            ) : (
              <p className="text-[10px] text-zinc-400 italic">
                Add sources or open an item to analyze
              </p>
            )}
          </div>
        </FlowSection>

        {/* 3. Actions */}
        <FlowSection
          step={3}
          title="Actions"
          subtitle="View created items"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          }
          collapsed={actionsCollapsed}
          onToggle={() => setActionsCollapsed(v => !v)}
          isLast
        >
          <ActionsTab
            actionLog={actionLog}
            onClearLog={() => setActionLog([])}
          />
        </FlowSection>
      </div>

      {/* Chat (always at bottom, collapsible) */}
      <ChatPanel
        ref={chatRef}
        workspace={workspace}
        project={project}
        resources={resources}
        object={object}
        item={item}
        context={context}
        onUrlPasted={handleQuickAddResource}
        onActionsCreated={handleActionsCreated}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};
