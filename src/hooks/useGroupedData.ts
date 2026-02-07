import { useMemo } from 'react';
import type { ObjectType, ObjectItem, Context, Project, Workspace } from '@/types';
import type { GroupByOption } from '@/components/home';

interface GroupedByScope<T> {
  global: T[];
  byProject: Record<string, T[]>;
  byWorkspace: Record<string, T[]>;
}

export function useGroupedObjects(
  objects: ObjectType[],
  projects: Project[],
  workspaces: Workspace[],
  projectFilter: string,
  workspaceFilter: string,
  objectFilter: string
): GroupedByScope<ObjectType> {
  return useMemo(() => {
    const filterByObject = (objs: ObjectType[]) => {
      if (objectFilter === 'all') return objs;
      return objs.filter(o => o.id === objectFilter);
    };

    const globalObjects = objects.filter(o => o.availableGlobal);
    const global = filterByObject(globalObjects);

    const projectObjects = objects.filter(o =>
      !o.availableGlobal &&
      o.availableInProjects.length > 0 &&
      o.availableInWorkspaces.length === 0
    );
    let filteredProjectObjects = projectFilter === 'all'
      ? projectObjects
      : projectObjects.filter(o =>
          o.availableInProjects.includes('*') || o.availableInProjects.includes(projectFilter)
        );
    filteredProjectObjects = filterByObject(filteredProjectObjects);

    const byProject: Record<string, ObjectType[]> = {};
    filteredProjectObjects.forEach(obj => {
      const primaryProjectId = obj.availableInProjects[0] === '*' ? 'all' : obj.availableInProjects[0];
      const project = projects.find(p => p.id === primaryProjectId);
      const key = project?.name || 'Multiple Workspaces';
      if (!byProject[key]) byProject[key] = [];
      byProject[key].push(obj);
    });

    const workspaceObjects = objects.filter(o =>
      !o.availableGlobal &&
      o.availableInWorkspaces.length > 0
    );
    let filteredWorkspaceObjects = workspaceObjects;

    if (projectFilter !== 'all') {
      const projectWorkspaceIds = projects
        .filter(p => p.workspaceId === projectFilter)
        .map(p => p.id);
      filteredWorkspaceObjects = filteredWorkspaceObjects.filter(o =>
        o.availableInWorkspaces.includes('*') ||
        o.availableInWorkspaces.some(wsId => projectWorkspaceIds.includes(wsId))
      );
    }

    if (workspaceFilter !== 'all') {
      filteredWorkspaceObjects = filteredWorkspaceObjects.filter(o =>
        o.availableInWorkspaces.includes('*') || o.availableInWorkspaces.includes(workspaceFilter)
      );
    }

    filteredWorkspaceObjects = filterByObject(filteredWorkspaceObjects);

    const byWorkspace: Record<string, ObjectType[]> = {};
    filteredWorkspaceObjects.forEach(obj => {
      const primaryWsId = obj.availableInWorkspaces[0] === '*' ? 'all' : obj.availableInWorkspaces[0];
      const workspace = workspaces.find(w => w.id === primaryWsId);
      const key = workspace?.name || 'Multiple Projects';
      if (!byWorkspace[key]) byWorkspace[key] = [];
      byWorkspace[key].push(obj);
    });

    return { global, byProject, byWorkspace };
  }, [objects, projects, workspaces, projectFilter, workspaceFilter, objectFilter]);
}

export function useGroupedContexts(
  contexts: Context[],
  projects: Project[],
  workspaces: Workspace[],
  projectFilter: string,
  workspaceFilter: string
): GroupedByScope<Context> {
  return useMemo(() => {
    const globalContexts = contexts.filter(c => c.scope === 'global');

    const projectContexts = contexts.filter(c => c.scope === 'workspace');
    const filteredProjectContexts = projectFilter === 'all'
      ? projectContexts
      : projectContexts.filter(c => c.projectId === projectFilter);

    const byProject: Record<string, Context[]> = {};
    filteredProjectContexts.forEach(ctx => {
      const project = projects.find(p => p.id === ctx.projectId);
      const key = project?.name || 'Unknown Workspace';
      if (!byProject[key]) byProject[key] = [];
      byProject[key].push(ctx);
    });

    const workspaceContexts = contexts.filter(c => c.scope === 'project');
    let filteredWorkspaceContexts = workspaceContexts;

    if (projectFilter !== 'all') {
      const projectWorkspaceIds = projects
        .filter(p => p.workspaceId === projectFilter)
        .map(p => p.id);
      filteredWorkspaceContexts = filteredWorkspaceContexts.filter(c =>
        projectWorkspaceIds.includes(c.workspaceId || '')
      );
    }

    if (workspaceFilter !== 'all') {
      filteredWorkspaceContexts = filteredWorkspaceContexts.filter(c => c.workspaceId === workspaceFilter);
    }

    const byWorkspace: Record<string, Context[]> = {};
    filteredWorkspaceContexts.forEach(ctx => {
      const workspace = workspaces.find(w => w.id === ctx.workspaceId);
      const key = workspace?.name || 'Unknown Project';
      if (!byWorkspace[key]) byWorkspace[key] = [];
      byWorkspace[key].push(ctx);
    });

    return { global: globalContexts, byProject, byWorkspace };
  }, [contexts, projects, workspaces, projectFilter, workspaceFilter]);
}

function getUniqueItems<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function useObjectGroups(
  groupedObjects: GroupedByScope<ObjectType>,
  groupBy: GroupByOption[],
  projects: Project[],
  workspaces: Workspace[]
): Record<string, ObjectType[]> {
  return useMemo(() => {
    const all = [
      ...groupedObjects.global,
      ...Object.values(groupedObjects.byProject).flat(),
      ...Object.values(groupedObjects.byWorkspace).flat(),
    ];
    const uniqueObjects = getUniqueItems(all);

    const getGroupKey = (obj: ObjectType): string => {
      const parts: string[] = [];

      if (groupBy.includes('project')) {
        let projectName = 'Global';
        if (!obj.availableGlobal && obj.availableInProjects.length > 0) {
          const primaryProjectId = obj.availableInProjects[0];
          if (primaryProjectId === '*') {
            projectName = 'All Workspaces';
          } else {
            const project = projects.find(p => p.id === primaryProjectId);
            projectName = project?.name || 'Unknown Workspace';
          }
        } else if (!obj.availableGlobal && obj.availableInWorkspaces.length > 0) {
          const primaryWsId = obj.availableInWorkspaces[0];
          if (primaryWsId !== '*') {
            const ws = workspaces.find(w => w.id === primaryWsId);
            projectName = ws?.name || 'Unknown Workspace';
          }
        }
        parts.push(projectName);
      }

      if (groupBy.includes('category')) {
        parts.push(obj.category || 'Uncategorized');
      }

      return parts.length > 0 ? parts.join(' / ') : 'All';
    };

    const groups: Record<string, ObjectType[]> = {};
    uniqueObjects.forEach(obj => {
      const key = getGroupKey(obj);
      if (!groups[key]) groups[key] = [];
      groups[key].push(obj);
    });
    return groups;
  }, [groupedObjects, groupBy, projects, workspaces]);
}

export function useContextGroups(
  groupedContexts: GroupedByScope<Context>,
  groupBy: GroupByOption[],
  projects: Project[],
  workspaces: Workspace[]
): Record<string, Context[]> {
  return useMemo(() => {
    const all = [
      ...groupedContexts.global,
      ...Object.values(groupedContexts.byProject).flat(),
      ...Object.values(groupedContexts.byWorkspace).flat(),
    ];
    const uniqueContexts = getUniqueItems(all);

    const getGroupKey = (ctx: Context): string => {
      const parts: string[] = [];

      if (groupBy.includes('project')) {
        let projectName = 'Global';
        if (ctx.scope === 'workspace' && ctx.projectId) {
          const project = projects.find(p => p.id === ctx.projectId);
          projectName = project?.name || 'Unknown Workspace';
        } else if (ctx.scope === 'project' && ctx.workspaceId) {
          const ws = workspaces.find(w => w.id === ctx.workspaceId);
          projectName = ws?.name || 'Unknown Workspace';
        }
        parts.push(projectName);
      }

      if (groupBy.includes('category')) {
        const ctxType = ctx.type || 'tree';
        parts.push(ctxType.charAt(0).toUpperCase() + ctxType.slice(1));
      }

      return parts.length > 0 ? parts.join(' / ') : 'All';
    };

    const groups: Record<string, Context[]> = {};
    uniqueContexts.forEach(ctx => {
      const key = getGroupKey(ctx);
      if (!groups[key]) groups[key] = [];
      groups[key].push(ctx);
    });
    return groups;
  }, [groupedContexts, groupBy, projects, workspaces]);
}

export function useProjectGroups(
  projects: Project[],
  groupBy: GroupByOption[]
): Record<string, Project[]> {
  return useMemo(() => {
    if (groupBy.includes('category')) {
      const groups: Record<string, Project[]> = {};
      projects.forEach(project => {
        const key = project.category || 'Uncategorized';
        if (!groups[key]) groups[key] = [];
        groups[key].push(project);
      });
      return groups;
    }
    return { 'All': projects };
  }, [projects, groupBy]);
}

export function useSelectedObjectItems(
  selectedObject: ObjectType | null,
  items: ObjectItem[],
  workspaces: Workspace[],
  projects: Project[],
  groupBy: GroupByOption[],
  projectFilter: string
): Record<string, ObjectItem[]> {
  return useMemo(() => {
    if (!selectedObject) return {};
    let objectItems = items.filter(i => i.objectId === selectedObject.id);

    if (projectFilter !== 'all') {
      const projectIds = projects
        .filter(p => p.workspaceId === projectFilter)
        .map(p => p.id);
      objectItems = objectItems.filter(item => item.projectId && projectIds.includes(item.projectId));
    }

    const getGroupKey = (item: ObjectItem): string => {
      const parts: string[] = [];
      const proj = projects.find(p => p.id === item.projectId);
      const ws = proj ? workspaces.find(w => w.id === proj.workspaceId) : null;

      if (groupBy.includes('scope')) {
        parts.push(proj ? 'Project' : 'Global');
      }

      if (groupBy.includes('project')) {
        parts.push(ws?.name || 'Unknown');
      }

      if (groupBy.includes('category')) {
        parts.push(proj?.category || 'Uncategorized');
      }

      return parts.length > 0 ? parts.join(' / ') : 'All';
    };

    const groups: Record<string, ObjectItem[]> = {};
    objectItems.forEach(item => {
      const key = getGroupKey(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [selectedObject, items, workspaces, projects, groupBy, projectFilter]);
}
