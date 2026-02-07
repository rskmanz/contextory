'use client';

import React from 'react';
import { Context, Project, Workspace } from '@/types';
import { ContextItem, ScopeColumnsView, GroupByTabs, GroupedView } from '@/components/home';
import type { GroupByOption } from '@/components/home';

interface GroupedByScope<T> {
  global: T[];
  byProject: Record<string, T[]>;
  byWorkspace: Record<string, T[]>;
}

interface ContextsTabProps {
  groupBy: GroupByOption[];
  onGroupByChange: (value: GroupByOption[]) => void;
  groupedContexts: GroupedByScope<Context>;
  contextGroups: Record<string, Context[]>;
  projects: Project[];
  workspaces: Workspace[];
  projectFilter: string;
  workspaceFilter: string;
  onProjectFilterChange: (value: string) => void;
  onWorkspaceFilterChange: (value: string) => void;
}

export const ContextsTab: React.FC<ContextsTabProps> = ({
  groupBy,
  onGroupByChange,
  groupedContexts,
  contextGroups,
  projects,
  workspaces,
  projectFilter,
  workspaceFilter,
  onProjectFilterChange,
  onWorkspaceFilterChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Header row: Group by */}
      <div className="flex items-center gap-4">
        <GroupByTabs value={groupBy} onChange={onGroupByChange} />
      </div>

      {/* Conditional layout based on groupBy */}
      {groupBy.includes('scope') ? (
        <ScopeColumnsView<Context>
          data={groupedContexts}
          renderItem={(ctx) => (
            <ContextItem context={ctx} />
          )}
          getItemId={(ctx) => ctx.id}
          projects={projects}
          workspaces={workspaces}
          projectFilter={projectFilter}
          workspaceFilter={workspaceFilter}
          onProjectFilterChange={onProjectFilterChange}
          onWorkspaceFilterChange={onWorkspaceFilterChange}
          emptyMessages={{
            global: 'No global contexts',
            project: 'No workspace contexts',
            workspace: 'No project contexts',
          }}
        />
      ) : (
        <GroupedView<Context>
          groups={contextGroups}
          renderItem={(ctx) => (
            <ContextItem context={ctx} />
          )}
          getItemId={(ctx) => ctx.id}
          emptyMessage="No contexts"
        />
      )}
    </div>
  );
};
