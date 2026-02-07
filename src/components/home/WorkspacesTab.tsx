'use client';

import React, { useState } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { AddCardButton } from '@/components/dashboard/AddCardButton';
import { Project, Workspace } from '@/types';
import type { GroupByOption } from '@/components/home';

interface WorkspacesTabProps {
  projects: Workspace[];
  workspaces: Project[];
  groupBy: GroupByOption[];
  onGroupByChange: (value: GroupByOption[]) => void;
  onAddProject: () => void;
  onEditProject: (project: Workspace) => void;
  onDeleteProject: (project: Workspace) => void;
  onAddWorkspace: (projectId: string) => void;
  onEditWorkspace: (workspace: Project) => void;
  onDeleteWorkspace: (workspace: Project) => void;
  updateProject: (id: string, data: Partial<Workspace>) => Promise<void>;
}

export const WorkspacesTab: React.FC<WorkspacesTabProps> = ({
  projects,
  workspaces,
  groupBy,
  onGroupByChange,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  updateProject,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  const projectCategories = Array.from(new Set(projects.map(p => p.category)));

  const getProjectWorkspaces = (projectId: string) => {
    return workspaces.filter(w => w.workspaceId === projectId);
  };

  const renameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    const projectsInCategory = projects.filter(p => p.category === oldName);
    for (const proj of projectsInCategory) {
      await updateProject(proj.id, { category: newName.trim() });
    }
    if (categoryFilter === oldName) {
      setCategoryFilter(newName.trim());
    }
  };

  const renderProjectCard = (project: Workspace) => (
    <ProjectCard
      key={project.id}
      title={project.name}
      gradient={project.gradient}
      icon={<span>{project.icon}</span>}
      workspaces={getProjectWorkspaces(project.id).map(w => ({ id: w.id, name: w.name }))}
      projectId={project.id}
      onEdit={() => onEditProject(project)}
      onDelete={() => onDeleteProject(project)}
      onAddWorkspace={() => onAddWorkspace(project.id)}
      onEditWorkspace={(ws) => {
        const fullWs = workspaces.find(w => w.id === ws.id);
        if (fullWs) onEditWorkspace(fullWs);
      }}
      onDeleteWorkspace={(ws) => {
        const fullWs = workspaces.find(w => w.id === ws.id);
        if (fullWs) onDeleteWorkspace(fullWs);
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('projectId', project.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    />
  );

  return (
    <div className="space-y-6">
      {/* Category sub-tabs + Group by toggle */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            All
          </button>
          {projectCategories.map((category) => (
            editingCategory === category ? (
              <input
                key={category}
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onBlur={async () => {
                  await renameCategory(category, editCategoryName);
                  setEditingCategory(null);
                  setEditCategoryName('');
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await renameCategory(category, editCategoryName);
                    setEditingCategory(null);
                    setEditCategoryName('');
                  }
                  if (e.key === 'Escape') {
                    setEditingCategory(null);
                    setEditCategoryName('');
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-300 outline-none focus:border-zinc-500 min-w-[80px]"
                autoFocus
              />
            ) : (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                onDoubleClick={() => {
                  setEditingCategory(category);
                  setEditCategoryName(category);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCategory(category);
                }}
                onDragLeave={() => setDragOverCategory(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverCategory(null);
                  const projectId = e.dataTransfer.getData('projectId');
                  if (projectId) {
                    await updateProject(projectId, { category });
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  dragOverCategory === category
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                    : categoryFilter === category
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                }`}
                title="Double-click to rename, or drop workspace here"
              >
                {category}
              </button>
            )
          ))}
        </div>
        {/* Group by toggle - only show when viewing All */}
        {categoryFilter === 'all' && (
          <button
            onClick={() => onGroupByChange(
              groupBy.includes('category')
                ? groupBy.filter(g => g !== 'category')
                : [...groupBy.filter(g => g !== 'none'), 'category']
            )}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              groupBy.includes('category')
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            Group by Category
          </button>
        )}
      </div>

      {/* Workspaces - grouped or flat */}
      {categoryFilter === 'all' && groupBy.includes('category') ? (
        <div className="space-y-8">
          {projectCategories.map((category) => {
            const categoryProjects = projects.filter(p => p.category === category);
            return (
              <div key={category}>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCategory(category);
                  }}
                  onDragLeave={() => setDragOverCategory(null)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverCategory(null);
                    const projectId = e.dataTransfer.getData('projectId');
                    if (projectId) {
                      await updateProject(projectId, { category });
                    }
                  }}
                  className={`flex items-center gap-2 mb-4 pb-2 border-b transition-all ${
                    dragOverCategory === category
                      ? 'border-blue-400 bg-blue-50 -mx-2 px-2 rounded-lg'
                      : 'border-zinc-200'
                  }`}
                >
                  <h3 className="text-sm font-semibold text-zinc-700">{category}</h3>
                  <span className="text-xs text-zinc-400">({categoryProjects.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryProjects.map(renderProjectCard)}
                </div>
              </div>
            );
          })}
          <AddCardButton onClick={onAddProject} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects
            .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
            .map(renderProjectCard)}
          <AddCardButton onClick={onAddProject} />
        </div>
      )}
    </div>
  );
};
