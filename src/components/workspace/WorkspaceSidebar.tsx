'use client';

import React from 'react';
import Link from 'next/link';
import { ObjectItem, Project, Workspace } from '@/types';

// Re-export ContextsObjectsPanel for backward compatibility
export { ContextsObjectsPanel } from './ContextsObjectsPanel';

// --- Projects Panel ---

interface WorkspacesPanelProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  viewLevel: 'global' | 'workspace' | 'project';
  setViewLevel: (level: 'global' | 'workspace' | 'project') => void;
  workspace: string;
  project: string;
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  projects: Project[];
  workspaceProjects: Project[];
  items: ObjectItem[];
  onEditProject: (proj: Project) => void;
  onDeleteProject: (proj: Project) => void;
}

export function WorkspacesPanel({
  isOpen,
  onToggle,
  viewLevel,
  setViewLevel,
  workspace,
  project,
  workspaces,
  projects,
  workspaceProjects,
  items,
  onEditProject,
  onDeleteProject,
}: WorkspacesPanelProps) {
  const [isProjectsExpanded, setIsProjectsExpanded] = React.useState(true);
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = React.useState(true);
  const [expandedWorkspaces, setExpandedWorkspaces] = React.useState<Set<string>>(new Set());

  const topLevelProjects = workspaceProjects.filter((p) => !p.parentItemId);
  const subProjects = workspaceProjects.filter((p) => p.parentItemId);

  if (!isOpen) {
    return (
      <button
        onClick={() => onToggle(true)}
        className="w-8 bg-zinc-50/50 border-r border-zinc-100 flex flex-col items-center pt-3 hover:bg-zinc-100/50 transition-colors"
        title="Show projects"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    );
  }

  return (
    <div className="w-48 bg-zinc-50/50 border-r border-zinc-100 flex flex-col overflow-hidden">
      <div className="px-2 pt-2 flex justify-end">
        <button
          onClick={() => onToggle(false)}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-white/80 transition-colors"
          title="Hide projects"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {viewLevel === 'global' ? (
          <GlobalWorkspacesList
            isExpanded={isWorkspacesExpanded}
            onToggleExpanded={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
            workspaces={workspaces}
            projects={projects}
            workspace={workspace}
            expandedWorkspaces={expandedWorkspaces}
            setExpandedWorkspaces={setExpandedWorkspaces}
            setViewLevel={setViewLevel}
          />
        ) : (
          <ProjectsList
            isExpanded={isProjectsExpanded}
            onToggleExpanded={() => setIsProjectsExpanded(!isProjectsExpanded)}
            workspaceProjects={workspaceProjects}
            topLevelProjects={topLevelProjects}
            subProjects={subProjects}
            items={items}
            workspace={workspace}
            project={project}
            viewLevel={viewLevel}
            setViewLevel={setViewLevel}
            onEditProject={onEditProject}
            onDeleteProject={onDeleteProject}
          />
        )}
      </div>
    </div>
  );
}

// --- Global Workspaces List ---

function GlobalWorkspacesList({
  isExpanded,
  onToggleExpanded,
  workspaces,
  projects,
  workspace,
  expandedWorkspaces,
  setExpandedWorkspaces,
  setViewLevel,
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  workspaces: Workspace[];
  projects: Project[];
  workspace: string;
  expandedWorkspaces: Set<string>;
  setExpandedWorkspaces: React.Dispatch<React.SetStateAction<Set<string>>>;
  setViewLevel: (level: 'global' | 'workspace' | 'project') => void;
}) {
  return (
    <>
      <button
        onClick={onToggleExpanded}
        className="w-full flex items-center gap-2 px-3 mb-1 text-left hover:bg-white/60 rounded-lg py-1 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Workspaces</span>
        <span className="text-[10px] text-zinc-400 ml-auto">{workspaces.length}</span>
      </button>
      {isExpanded && (
        <div className="px-2 space-y-0.5">
          {workspaces.map((ws) => {
            const wsProjects = projects.filter(p => p.workspaceId === ws.id);
            const isWsExpanded = expandedWorkspaces.has(ws.id);
            return (
              <div key={ws.id}>
                <div
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    ws.id === workspace
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
                  }`}
                >
                  <button
                    onClick={() => {
                      setExpandedWorkspaces(prev => {
                        const next = new Set(prev);
                        if (next.has(ws.id)) {
                          next.delete(ws.id);
                        } else {
                          next.add(ws.id);
                        }
                        return next;
                      });
                    }}
                    className="flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`transition-transform ${isWsExpanded ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                  <div
                    className="flex items-center gap-2 flex-1 min-w-0"
                    onClick={() => {
                      setViewLevel('workspace');
                      if (ws.id !== workspace) {
                        const firstProj = projects.find(p => p.workspaceId === ws.id);
                        if (firstProj) {
                          window.location.href = `/${ws.id}/${firstProj.id}`;
                        }
                      }
                    }}
                  >
                    <span className="text-sm">{ws.icon || '📁'}</span>
                    <span className="truncate flex-1">{ws.name}</span>
                    <span className="text-[10px] text-zinc-400">{wsProjects.length}</span>
                  </div>
                </div>
                {isWsExpanded && wsProjects.length > 0 && (
                  <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5 space-y-0.5">
                    {wsProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-white/60 rounded-md cursor-pointer"
                        onClick={() => {
                          setViewLevel('project');
                          window.location.href = `/${ws.id}/${proj.id}`;
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0"></span>
                        <span className="text-sm">{proj.categoryIcon || '📁'}</span>
                        <span className="truncate">{proj.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isWsExpanded && wsProjects.length === 0 && (
                  <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5">
                    <p className="text-[11px] text-zinc-400 py-1.5 px-2">No projects</p>
                  </div>
                )}
              </div>
            );
          })}
          {workspaces.length === 0 && (
            <p className="text-xs text-zinc-400 px-3 py-2">No workspaces yet</p>
          )}
        </div>
      )}
    </>
  );
}

// --- Projects List ---

function ProjectsList({
  isExpanded,
  onToggleExpanded,
  workspaceProjects,
  topLevelProjects,
  subProjects,
  items,
  workspace,
  project,
  viewLevel,
  setViewLevel,
  onEditProject,
  onDeleteProject,
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  workspaceProjects: Project[];
  topLevelProjects: Project[];
  subProjects: Project[];
  items: ObjectItem[];
  workspace: string;
  project: string;
  viewLevel: 'global' | 'workspace' | 'project';
  setViewLevel: (level: 'global' | 'workspace' | 'project') => void;
  onEditProject: (proj: Project) => void;
  onDeleteProject: (proj: Project) => void;
}) {
  return (
    <>
      <button
        onClick={onToggleExpanded}
        className="w-full flex items-center gap-2 px-3 mb-1 text-left hover:bg-white/60 rounded-lg py-1 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Projects</span>
        <span className="text-[10px] text-zinc-400 ml-auto">{workspaceProjects.length}</span>
      </button>
      {isExpanded && (
        <div className="px-2 space-y-0.5">
          {topLevelProjects.map((proj) => (
            <ProjectItem
              key={proj.id}
              proj={proj}
              workspace={workspace}
              project={project}
              viewLevel={viewLevel}
              setViewLevel={setViewLevel}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
            />
          ))}
          {subProjects.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider px-3">Sub-projects</span>
              </div>
              {subProjects.map((proj) => {
                const parentItem = items.find((i) => i.id === proj.parentItemId);
                return (
                  <SubProjectItem
                    key={proj.id}
                    proj={proj}
                    parentItem={parentItem}
                    workspace={workspace}
                    project={project}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
                  />
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
}

// --- Project Item ---

function ProjectItem({ proj, workspace, project, viewLevel, setViewLevel, onEdit, onDelete }: {
  proj: Project;
  workspace: string;
  project: string;
  viewLevel: 'global' | 'workspace' | 'project';
  setViewLevel: (level: 'global' | 'workspace' | 'project') => void;
  onEdit: (proj: Project) => void;
  onDelete: (proj: Project) => void;
}) {
  return (
    <div className="group relative">
      <Link
        href={`/${workspace}/${proj.id}`}
        onClick={() => setViewLevel('project')}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          proj.id === project && viewLevel === 'project'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
        }`}
      >
        <span className="text-sm">{proj.categoryIcon || '📁'}</span>
        <span className="truncate flex-1">{proj.name}</span>
      </Link>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(proj); }}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-white/80"
          title="Edit project"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(proj); }}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded hover:bg-white/80"
          title="Delete project"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

// --- Sub-Project Item ---

function SubProjectItem({ proj, parentItem, workspace, project, onEdit, onDelete }: {
  proj: Project;
  parentItem: ObjectItem | undefined;
  workspace: string;
  project: string;
  onEdit: (proj: Project) => void;
  onDelete: (proj: Project) => void;
}) {
  return (
    <div className="group relative">
      <Link
        href={`/${workspace}/${proj.id}`}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          proj.id === project
            ? 'bg-purple-50 text-purple-900 shadow-sm border border-purple-200'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
        }`}
      >
        <span className="text-sm">🔗</span>
        <span className="truncate flex-1">{proj.name}</span>
        {parentItem && (
          <span className="text-[10px] text-zinc-400 truncate max-w-[60px]" title={`From: ${parentItem.name}`}>
            ← {parentItem.name}
          </span>
        )}
      </Link>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(proj); }}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-white/80"
          title="Edit project"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(proj); }}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded hover:bg-white/80"
          title="Delete project"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
