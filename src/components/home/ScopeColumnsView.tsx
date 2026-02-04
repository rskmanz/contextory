'use client';

import React, { ReactNode } from 'react';
import { FilterDropdown } from './FilterDropdown';
import { Project, Workspace } from '@/types';

interface GroupedData<T> {
  global: T[];
  byProject: Record<string, T[]>;
  byWorkspace: Record<string, T[]>;
}

interface ScopeColumnsViewProps<T> {
  data: GroupedData<T>;
  renderItem: (item: T) => ReactNode;
  getItemId: (item: T) => string;
  projects: Project[];
  workspaces: Workspace[];
  projectFilter: string;
  workspaceFilter: string;
  onProjectFilterChange: (value: string) => void;
  onWorkspaceFilterChange: (value: string) => void;
  emptyMessages?: {
    global?: string;
    project?: string;
    workspace?: string;
  };
}

export function ScopeColumnsView<T>({
  data,
  renderItem,
  getItemId,
  projects,
  workspaces,
  projectFilter,
  workspaceFilter,
  onProjectFilterChange,
  onWorkspaceFilterChange,
  emptyMessages = {},
}: ScopeColumnsViewProps<T>) {
  const {
    global: globalText = 'No global items',
    project: projectText = 'No project items',
    workspace: workspaceText = 'No workspace items',
  } = emptyMessages;

  const projectOptions = projects.map(p => ({
    id: p.id,
    label: p.name,
    icon: p.icon,
  }));

  const filteredWorkspaces = projectFilter === 'all'
    ? workspaces
    : workspaces.filter(w => w.projectId === projectFilter);

  const workspaceOptions = filteredWorkspaces.map(w => ({
    id: w.id,
    label: w.name,
    icon: w.categoryIcon,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Global Column */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">Global</h2>
        {data.global.length > 0 ? (
          <div className="space-y-2">
            {data.global.map((item) => (
              <div key={getItemId(item)}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">{globalText}</p>
        )}
      </div>

      {/* Project Column */}
      <div className="space-y-3">
        <FilterDropdown
          value={projectFilter}
          options={projectOptions}
          allLabel="All Projects"
          onChange={(value) => {
            onProjectFilterChange(value);
            if (value !== projectFilter) {
              onWorkspaceFilterChange('all');
            }
          }}
        />
        {Object.keys(data.byProject).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(data.byProject).map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                {projectFilter === 'all' && (
                  <h3 className="text-xs font-medium text-zinc-400">{groupName}</h3>
                )}
                {items.map((item) => (
                  <div key={getItemId(item)}>
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">{projectText}</p>
        )}
      </div>

      {/* Workspace Column */}
      <div className="space-y-3">
        <FilterDropdown
          value={workspaceFilter}
          options={workspaceOptions}
          allLabel="All Workspaces"
          onChange={onWorkspaceFilterChange}
        />
        {Object.keys(data.byWorkspace).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(data.byWorkspace).map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                {workspaceFilter === 'all' && (
                  <h3 className="text-xs font-medium text-zinc-400">{groupName}</h3>
                )}
                {items.map((item) => (
                  <div key={getItemId(item)}>
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">{workspaceText}</p>
        )}
      </div>
    </div>
  );
}
