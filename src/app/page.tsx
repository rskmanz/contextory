'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { AddCardButton } from '@/components/dashboard/AddCardButton';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { AddObjectModal } from '@/components/modals/AddObjectModal';
import { EditObjectModal } from '@/components/modals/EditObjectModal';
import { FilterDropdown, ObjectFilterTabs, ObjectItem, ContextItem, ScopeColumnsView, GroupByTabs, GroupedView } from '@/components/home';
import type { GroupByOption } from '@/components/home';
import { useStore } from '@/lib/store';
import { Project, ObjectType, Context } from '@/types';

export default function Home() {
  const router = useRouter();
  // activeTab can be 'projects', 'objects', 'contexts', or an object ID (for pinned tabs)
  const [activeTab, setActiveTab] = useState<string>('projects');
  const [groupBy, setGroupBy] = useState<GroupByOption[]>(['scope']);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [workspaceFilter, setWorkspaceFilter] = useState<string>('all');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
  const [globalDropdownOpen, setGlobalDropdownOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  // Object CRUD state
  const [isAddObjectOpen, setIsAddObjectOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectType | null>(null);
  const [deletingObject, setDeletingObject] = useState<ObjectType | null>(null);
  // Category rename state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  // Drag and drop state
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  // Quick add item state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemWorkspaceId, setNewItemWorkspaceId] = useState<string>('');
  // Add tab dropdown state
  const [isAddTabOpen, setIsAddTabOpen] = useState(false);
  // Object card expanded state
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());

  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const objects = useStore((state) => state.objects);
  const contexts = useStore((state) => state.contexts);
  const items = useStore((state) => state.items);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const deleteProject = useStore((state) => state.deleteProject);
  const updateProject = useStore((state) => state.updateProject);
  const deleteObject = useStore((state) => state.deleteObject);
  const pinnedObjectTabs = useStore((state) => state.pinnedObjectTabs);
  const pinObjectTab = useStore((state) => state.pinObjectTab);
  const unpinObjectTab = useStore((state) => state.unpinObjectTab);
  const updateObject = useStore((state) => state.updateObject);
  const addItem = useStore((state) => state.addItem);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProjectWorkspaces = (projectId: string) => {
    return workspaces.filter(w => w.projectId === projectId);
  };

  // Group objects by scope with filters + inheritance
  const groupedObjects = useMemo(() => {
    // Filter by specific object if selected
    const filterByObject = (objs: typeof objects) => {
      if (objectFilter === 'all') return objs;
      return objs.filter(o => o.id === objectFilter);
    };

    // Check if global object is available in a project
    const isAvailableInProject = (obj: typeof objects[0], projId: string) => {
      const avail = obj.availableInProjects || [];
      return avail.includes('*') || avail.includes(projId);
    };

    // Check if global object is available in a workspace
    const isAvailableInWorkspace = (obj: typeof objects[0], wsId: string) => {
      const avail = obj.availableInWorkspaces || [];
      return avail.includes('*') || avail.includes(wsId);
    };

    // Global objects (availableGlobal = true)
    const globalObjects = objects.filter(o => o.availableGlobal);
    const global = filterByObject(globalObjects);


    // Project objects - objects available in projects but not global
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

    const byProject: Record<string, typeof objects> = {};
    // Group project objects by their primary project
    filteredProjectObjects.forEach(obj => {
      const primaryProjectId = obj.availableInProjects[0] === '*' ? 'all' : obj.availableInProjects[0];
      const project = projects.find(p => p.id === primaryProjectId);
      const key = project?.name || 'Multiple Projects';
      if (!byProject[key]) byProject[key] = [];
      byProject[key].push(obj);
    });

    // Workspace objects - objects available in workspaces but not global
    const workspaceObjects = objects.filter(o =>
      !o.availableGlobal &&
      o.availableInWorkspaces.length > 0
    );
    let filteredWorkspaceObjects = workspaceObjects;

    // Filter by project if selected
    if (projectFilter !== 'all') {
      const projectWorkspaceIds = workspaces
        .filter(w => w.projectId === projectFilter)
        .map(w => w.id);
      filteredWorkspaceObjects = filteredWorkspaceObjects.filter(o =>
        o.availableInWorkspaces.includes('*') ||
        o.availableInWorkspaces.some(wsId => projectWorkspaceIds.includes(wsId))
      );
    }

    // Filter by specific workspace if selected
    if (workspaceFilter !== 'all') {
      filteredWorkspaceObjects = filteredWorkspaceObjects.filter(o =>
        o.availableInWorkspaces.includes('*') || o.availableInWorkspaces.includes(workspaceFilter)
      );
    }

    filteredWorkspaceObjects = filterByObject(filteredWorkspaceObjects);

    const byWorkspace: Record<string, typeof objects> = {};
    filteredWorkspaceObjects.forEach(obj => {
      const primaryWsId = obj.availableInWorkspaces[0] === '*' ? 'all' : obj.availableInWorkspaces[0];
      const workspace = workspaces.find(w => w.id === primaryWsId);
      const key = workspace?.name || 'Multiple Workspaces';
      if (!byWorkspace[key]) byWorkspace[key] = [];
      byWorkspace[key].push(obj);
    });

    return { global, byProject, byWorkspace };
  }, [objects, projects, workspaces, projectFilter, workspaceFilter, objectFilter]);

  // Group contexts by scope with filters
  const groupedContexts = useMemo(() => {
    // Global contexts
    const globalContexts = contexts.filter(c => c.scope === 'global');

    // Project contexts - filter by selected project
    const projectContexts = contexts.filter(c => c.scope === 'project');
    let filteredProjectContexts = projectFilter === 'all'
      ? projectContexts
      : projectContexts.filter(c => c.projectId === projectFilter);

    const byProject: Record<string, typeof contexts> = {};
    filteredProjectContexts.forEach(ctx => {
      const project = projects.find(p => p.id === ctx.projectId);
      const key = project?.name || 'Unknown Project';
      if (!byProject[key]) byProject[key] = [];
      byProject[key].push(ctx);
    });

    // Workspace contexts - filter by project and workspace
    const workspaceContexts = contexts.filter(c => c.scope === 'local');
    let filteredWorkspaceContexts = workspaceContexts;

    // Filter by project if selected
    if (projectFilter !== 'all') {
      const projectWorkspaceIds = workspaces
        .filter(w => w.projectId === projectFilter)
        .map(w => w.id);
      filteredWorkspaceContexts = filteredWorkspaceContexts.filter(c =>
        projectWorkspaceIds.includes(c.workspaceId || '')
      );
    }

    // Filter by specific workspace if selected
    if (workspaceFilter !== 'all') {
      filteredWorkspaceContexts = filteredWorkspaceContexts.filter(c => c.workspaceId === workspaceFilter);
    }

    const byWorkspace: Record<string, typeof contexts> = {};
    filteredWorkspaceContexts.forEach(ctx => {
      const workspace = workspaces.find(w => w.id === ctx.workspaceId);
      const key = workspace?.name || 'Unknown Workspace';
      if (!byWorkspace[key]) byWorkspace[key] = [];
      byWorkspace[key].push(ctx);
    });

    return { global: globalContexts, byProject, byWorkspace };
  }, [contexts, projects, workspaces, projectFilter, workspaceFilter]);

  // Object filter options for the dropdown
  const objectFilterOptions = objects.map(obj => ({
    id: obj.id,
    label: obj.name,
    icon: obj.icon,
  }));

  // Compute object groups based on groupBy option (use first non-scope option for grouped view)
  const objectGroups = useMemo((): Record<string, ObjectType[]> => {
    // First, get all unique objects
    const all = [
      ...groupedObjects.global,
      ...Object.values(groupedObjects.byProject).flat(),
      ...Object.values(groupedObjects.byWorkspace).flat(),
    ];
    const seen = new Set<string>();
    const uniqueObjects = all.filter(obj => {
      if (seen.has(obj.id)) return false;
      seen.add(obj.id);
      return true;
    });

    // Build composite key from selected groupings
    const getGroupKey = (obj: ObjectType): string => {
      const parts: string[] = [];

      if (groupBy.includes('project')) {
        let projectName = 'Global';
        if (!obj.availableGlobal && obj.availableInProjects.length > 0) {
          const primaryProjectId = obj.availableInProjects[0];
          if (primaryProjectId === '*') {
            projectName = 'All Projects';
          } else {
            const project = projects.find(p => p.id === primaryProjectId);
            projectName = project?.name || 'Unknown Project';
          }
        } else if (!obj.availableGlobal && obj.availableInWorkspaces.length > 0) {
          const primaryWsId = obj.availableInWorkspaces[0];
          if (primaryWsId !== '*') {
            const ws = workspaces.find(w => w.id === primaryWsId);
            const project = ws ? projects.find(p => p.id === ws.projectId) : null;
            projectName = project?.name || 'Unknown Project';
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

  // Compute context groups based on groupBy option
  const contextGroups = useMemo((): Record<string, Context[]> => {
    const all = [
      ...groupedContexts.global,
      ...Object.values(groupedContexts.byProject).flat(),
      ...Object.values(groupedContexts.byWorkspace).flat(),
    ];
    const seen = new Set<string>();
    const uniqueContexts = all.filter(ctx => {
      if (seen.has(ctx.id)) return false;
      seen.add(ctx.id);
      return true;
    });

    // Build composite key from selected groupings
    const getGroupKey = (ctx: Context): string => {
      const parts: string[] = [];

      if (groupBy.includes('project')) {
        let projectName = 'Global';
        if (ctx.scope === 'project' && ctx.projectId) {
          const project = projects.find(p => p.id === ctx.projectId);
          projectName = project?.name || 'Unknown Project';
        } else if (ctx.scope === 'local' && ctx.workspaceId) {
          const ws = workspaces.find(w => w.id === ctx.workspaceId);
          const project = ws ? projects.find(p => p.id === ws.projectId) : null;
          projectName = project?.name || 'Unknown Project';
        }
        parts.push(projectName);
      }

      if (groupBy.includes('category')) {
        // Contexts don't have category, use type instead
        parts.push(ctx.type.charAt(0).toUpperCase() + ctx.type.slice(1));
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

  // Compute project groups based on groupBy option
  const projectGroups = useMemo((): Record<string, Project[]> => {
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

  // Get selected object and its items when filtering by specific object
  const selectedObject = objectFilter !== 'all' ? objects.find(o => o.id === objectFilter) : null;
  const selectedObjectItems = useMemo(() => {
    if (!selectedObject) return {};
    let objectItems = items.filter(i => i.objectId === selectedObject.id);

    // Filter by project if selected
    if (projectFilter !== 'all') {
      const projectWorkspaceIds = workspaces
        .filter(w => w.projectId === projectFilter)
        .map(w => w.id);
      objectItems = objectItems.filter(item => item.workspaceId && projectWorkspaceIds.includes(item.workspaceId));
    }

    // Build composite key from selected groupings
    const getGroupKey = (item: typeof items[0]): string => {
      const parts: string[] = [];
      const ws = workspaces.find(w => w.id === item.workspaceId);

      if (groupBy.includes('scope')) {
        parts.push(ws ? 'Workspace' : 'Global');
      }

      if (groupBy.includes('project')) {
        const project = ws ? projects.find(p => p.id === ws.projectId) : null;
        parts.push(project?.name || 'Unknown');
      }

      if (groupBy.includes('category')) {
        parts.push(ws?.category || 'Uncategorized');
      }

      return parts.length > 0 ? parts.join(' / ') : 'All';
    };

    const groups: Record<string, typeof items> = {};
    objectItems.forEach(item => {
      const key = getGroupKey(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [selectedObject, items, workspaces, projects, groupBy, projectFilter]);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  const handleEditObject = (obj: ObjectType) => {
    setEditingObject(obj);
  };

  const handleDeleteObject = (obj: ObjectType) => {
    setDeletingObject(obj);
  };

  const confirmDeleteObject = async () => {
    if (deletingObject) {
      await deleteObject(deletingObject.id);
      setDeletingObject(null);
    }
  };

  // Get unique categories from projects
  const projectCategories = Array.from(new Set(projects.map(p => p.category)));

  // Rename all projects in a category
  const renameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    const projectsInCategory = projects.filter(p => p.category === oldName);
    for (const proj of projectsInCategory) {
      await updateProject(proj.id, { category: newName.trim() });
    }
    // Update filter if we renamed the currently selected category
    if (categoryFilter === oldName) {
      setCategoryFilter(newName.trim());
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      ) : (
        <div className="flex-1 h-screen overflow-y-auto">
          {/* Header - same pattern as workspace editor */}
          <div className="sticky top-0 bg-white z-10">
            <div className="border-b border-zinc-100 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Home icon - active (black) since we're on home */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-900 bg-zinc-100"
                  title="Home"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
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
                {/* Global link */}
                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                >
                  <span>🌐</span>
                  <span>Global</span>
                </Link>
                {/* Projects dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setGlobalDropdownOpen(!globalDropdownOpen)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    <span>/</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`opacity-50 transition-transform ${globalDropdownOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {globalDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setGlobalDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 min-w-[200px] max-h-80 overflow-y-auto py-1">
                        {projects.map((p) => {
                          const firstWs = workspaces.find(w => w.projectId === p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                setGlobalDropdownOpen(false);
                                if (firstWs) {
                                  router.push(`/${p.id}/${firstWs.id}`);
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            >
                              <span>{p.icon}</span>
                              <span>{p.name}</span>
                            </button>
                          );
                        })}
                        {projects.length === 0 && (
                          <div className="px-3 py-2 text-xs text-zinc-400">No projects yet</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Link
                href="/settings"
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </Link>
            </div>
            {/* Sub-navigation */}
            <div className="border-b border-zinc-100 px-4">
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`py-3 px-3 text-sm font-medium -mb-px ${
                    activeTab === 'projects'
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setActiveTab('objects')}
                  className={`py-3 px-3 text-sm font-medium -mb-px ${
                    activeTab === 'objects'
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Objects
                </button>
                <button
                  onClick={() => setActiveTab('contexts')}
                  className={`py-3 px-3 text-sm font-medium -mb-px ${
                    activeTab === 'contexts'
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Contexts
                </button>
                {/* Pinned Object Tabs */}
                {pinnedObjectTabs.map((objectId) => {
                  const obj = objects.find((o) => o.id === objectId);
                  if (!obj) return null;
                  return (
                    <div key={objectId} className="relative group">
                      <button
                        onClick={() => setActiveTab(objectId)}
                        className={`py-3 px-3 text-sm font-medium -mb-px flex items-center gap-1.5 ${
                          activeTab === objectId
                            ? 'text-zinc-900 border-b-2 border-zinc-900'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        <span>{obj.icon}</span>
                        <span>{obj.name}</span>
                      </button>
                      {/* Unpin button */}
                      <button
                        onClick={() => unpinObjectTab(objectId)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-200 hover:bg-red-100 text-zinc-500 hover:text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Unpin tab"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {/* Add tab button */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsAddTabOpen(!isAddTabOpen)}
                    className="py-3 px-2 text-zinc-400 hover:text-zinc-600 -mb-px"
                    title="Add tab"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  {isAddTabOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAddTabOpen(false)} />
                      <div className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                        <div className="px-3 py-1.5 text-xs text-zinc-400 font-medium">Pin object as tab</div>
                        {objects.filter((o) => !pinnedObjectTabs.includes(o.id)).map((obj) => (
                          <button
                            key={obj.id}
                            onClick={() => {
                              pinObjectTab(obj.id);
                              setIsAddTabOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                          >
                            <span>{obj.icon}</span>
                            <span>{obj.name}</span>
                          </button>
                        ))}
                        {objects.filter((o) => !pinnedObjectTabs.includes(o.id)).length === 0 && (
                          <div className="px-3 py-2 text-xs text-zinc-400">All objects pinned</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            <div className="mx-auto max-w-[1600px]">
              {activeTab === 'projects' && (
                /* Projects View */
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
                          title="Double-click to rename, or drop project here"
                        >
                          {category}
                        </button>
                      )
                    ))}
                    </div>
                    {/* Group by toggle - only show when viewing All */}
                    {categoryFilter === 'all' && (
                      <button
                        onClick={() => setGroupBy(prev =>
                          prev.includes('category')
                            ? prev.filter(g => g !== 'category')
                            : [...prev.filter(g => g !== 'none'), 'category']
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

                  {/* Projects - grouped or flat */}
                  {categoryFilter === 'all' && groupBy.includes('category') ? (
                    /* Grouped by category view */
                    <div className="space-y-8">
                      {projectCategories.map((category) => {
                        const categoryProjects = projects.filter(p => p.category === category);
                        return (
                          <div key={category}>
                            {/* Category header - droppable */}
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
                              {categoryProjects.map((project) => (
                                <ProjectCard
                                  key={project.id}
                                  title={project.name}
                                  gradient={project.gradient}
                                  icon={<span>{project.icon}</span>}
                                  workspaces={getProjectWorkspaces(project.id).map(w => ({ id: w.id, name: w.name }))}
                                  projectId={project.id}
                                  onEdit={() => handleEditProject(project)}
                                  onDelete={() => handleDeleteProject(project)}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('projectId', project.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <AddCardButton onClick={() => setIsAddProjectOpen(true)} />
                    </div>
                  ) : (
                    /* Flat grid view */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {projects
                        .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
                        .map((project) => (
                          <ProjectCard
                            key={project.id}
                            title={project.name}
                            gradient={project.gradient}
                            icon={<span>{project.icon}</span>}
                            workspaces={getProjectWorkspaces(project.id).map(w => ({ id: w.id, name: w.name }))}
                            projectId={project.id}
                            onEdit={() => handleEditProject(project)}
                            onDelete={() => handleDeleteProject(project)}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('projectId', project.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                          />
                        ))}
                      <AddCardButton onClick={() => setIsAddProjectOpen(true)} />
                    </div>
                  )}
                </div>
              )}

              {/* Pinned Object Tab Content */}
              {pinnedObjectTabs.includes(activeTab) && (() => {
                const pinnedObject = objects.find((o) => o.id === activeTab);
                if (!pinnedObject) return null;
                const objectItems = items.filter((i) => i.objectId === activeTab);

                // Group items by workspace/project
                const groupedItems: Record<string, typeof objectItems> = {};
                objectItems.forEach((item) => {
                  const ws = workspaces.find((w) => w.id === item.workspaceId);
                  const proj = ws ? projects.find((p) => p.id === ws.projectId) : null;
                  const key = proj ? `${proj.name} / ${ws?.name || 'Unknown'}` : 'Global';
                  if (!groupedItems[key]) groupedItems[key] = [];
                  groupedItems[key].push(item);
                });

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pinnedObject.icon}</span>
                        <div>
                          <h2 className="text-lg font-semibold text-zinc-900">{pinnedObject.name}</h2>
                          <p className="text-sm text-zinc-400">{objectItems.length} items across all workspaces</p>
                        </div>
                      </div>
                      {/* Add button / form */}
                      {isAddingItem ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Item name"
                            className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-zinc-500"
                            autoFocus
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && newItemName.trim() && newItemWorkspaceId) {
                                await addItem({ name: newItemName.trim(), objectId: activeTab, workspaceId: newItemWorkspaceId });
                                setNewItemName('');
                                setIsAddingItem(false);
                              }
                              if (e.key === 'Escape') {
                                setNewItemName('');
                                setIsAddingItem(false);
                              }
                            }}
                          />
                          <select
                            value={newItemWorkspaceId}
                            onChange={(e) => setNewItemWorkspaceId(e.target.value)}
                            className="px-2 py-1.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-zinc-500"
                          >
                            <option value="">Select workspace</option>
                            {workspaces.map((ws) => {
                              const proj = projects.find((p) => p.id === ws.projectId);
                              return (
                                <option key={ws.id} value={ws.id}>
                                  {proj?.name} / {ws.name}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            onClick={async () => {
                              if (newItemName.trim() && newItemWorkspaceId) {
                                await addItem({ name: newItemName.trim(), objectId: activeTab, workspaceId: newItemWorkspaceId });
                                setNewItemName('');
                                setIsAddingItem(false);
                              }
                            }}
                            disabled={!newItemName.trim() || !newItemWorkspaceId}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setNewItemName('');
                              setIsAddingItem(false);
                            }}
                            className="px-2 py-1.5 text-sm text-zinc-500 hover:text-zinc-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAddingItem(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          <span>Add</span>
                        </button>
                      )}
                    </div>

                    {/* Items grouped by location */}
                    {Object.keys(groupedItems).length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-8">No items yet</p>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupedItems).map(([location, locationItems]) => (
                          <div key={location}>
                            <h3 className="text-sm font-medium text-zinc-500 mb-3">{location}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {locationItems.map((item) => {
                                const ws = workspaces.find((w) => w.id === item.workspaceId);
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => {
                                      if (ws) router.push(`/${ws.projectId}/${ws.id}/item/${item.id}`);
                                    }}
                                    className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{pinnedObject.icon}</span>
                                      <span className="text-sm font-medium text-zinc-800 truncate">{item.name}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeTab === 'objects' && (
                /* Objects View */
                <div className="space-y-6">
                  {/* Object sub-tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-zinc-100">
                    <button
                      onClick={() => setObjectFilter('all')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                        objectFilter === 'all'
                          ? 'bg-zinc-100 text-zinc-900'
                          : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      All
                    </button>
                    {objects.map((obj) => {
                      const isPinned = pinnedObjectTabs.includes(obj.id);
                      return (
                        <div key={obj.id} className="relative group flex items-center">
                          <button
                            onClick={() => setObjectFilter(obj.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                              objectFilter === obj.id
                                ? 'bg-zinc-100 text-zinc-900'
                                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <span>{obj.icon}</span>
                            <span>{obj.name}</span>
                          </button>
                          {/* Pin/Unpin button */}
                          <button
                            onClick={() => isPinned ? unpinObjectTab(obj.id) : pinObjectTab(obj.id)}
                            className={`ml-1 w-5 h-5 flex items-center justify-center rounded text-xs transition-all ${
                              isPinned
                                ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                                : 'text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isPinned ? 'Unpin from tabs' : 'Pin as tab'}
                          >
                            📌
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Header row: Add, Project filter, Group by */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsAddObjectOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Add</span>
                    </button>
                    <FilterDropdown
                      value={projectFilter}
                      options={projects.map(p => ({ id: p.id, label: p.name, icon: p.icon }))}
                      allLabel="All Projects"
                      onChange={setProjectFilter}
                    />
                    <GroupByTabs value={groupBy} onChange={setGroupBy} />
                  </div>


                  {/* Show items when specific object selected, otherwise show objects */}
                  {selectedObject ? (
                    /* Items view for selected object */
                    <div className="space-y-6">
                      {/* Object header with availability toggle */}
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{selectedObject.icon}</span>
                          <h2 className="text-lg font-semibold text-zinc-900">{selectedObject.name}</h2>
                          <span className="text-sm text-zinc-400">
                            {items.filter(i => i.objectId === selectedObject.id).length} items
                          </span>
                        </div>
                        <button
                          onClick={() => setObjectFilter('all')}
                          className="text-sm text-zinc-500 hover:text-zinc-700"
                        >
                          ← Back to all
                        </button>
                      </div>

                      {/* Where to use (collapsible) */}
                      <div className="bg-zinc-50 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setAvailabilityExpanded(!availabilityExpanded)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                        >
                          <span>Where to use</span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`text-zinc-400 transition-transform ${availabilityExpanded ? 'rotate-180' : ''}`}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        {availabilityExpanded && (
                          <div className="px-4 pb-4 pt-1 space-y-3">
                            {/* Home */}
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedObject.availableGlobal}
                                onChange={(e) => updateObject(selectedObject.id, { availableGlobal: e.target.checked })}
                                className="rounded border-zinc-300"
                              />
                              <span className="text-sm">🌐 Home</span>
                            </label>

                            {/* Projects */}
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 font-medium">Projects</span>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {projects.map((p) => (
                                  <label key={p.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedObject.availableInProjects.includes('*') || selectedObject.availableInProjects.includes(p.id)}
                                      onChange={(e) => {
                                        const current = selectedObject.availableInProjects.filter(id => id !== '*');
                                        const updated = e.target.checked
                                          ? [...current, p.id]
                                          : current.filter(id => id !== p.id);
                                        updateObject(selectedObject.id, { availableInProjects: updated });
                                      }}
                                      className="rounded border-zinc-300"
                                    />
                                    <span className="text-sm">{p.icon} {p.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Workspaces */}
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 font-medium">Workspaces</span>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {workspaces.map((w) => {
                                  const project = projects.find(pr => pr.id === w.projectId);
                                  return (
                                    <label key={w.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedObject.availableInWorkspaces.includes('*') || selectedObject.availableInWorkspaces.includes(w.id)}
                                        onChange={(e) => {
                                          const current = selectedObject.availableInWorkspaces.filter(id => id !== '*');
                                          const updated = e.target.checked
                                            ? [...current, w.id]
                                            : current.filter(id => id !== w.id);
                                          updateObject(selectedObject.id, { availableInWorkspaces: updated });
                                        }}
                                        className="rounded border-zinc-300"
                                      />
                                      <span className="text-sm">{w.name}</span>
                                      <span className="text-xs text-zinc-400">({project?.name})</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <GroupedView<typeof items[0]>
                        groups={selectedObjectItems}
                        renderItem={(item) => {
                          const ws = workspaces.find(w => w.id === item.workspaceId);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (ws) router.push(`/${ws.projectId}/${ws.id}/item/${item.id}`);
                              }}
                              className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-zinc-800 truncate">{item.name}</h4>
                                  {ws && (
                                    <p className="text-xs text-zinc-400 mt-1 truncate">
                                      {ws.name}
                                    </p>
                                  )}
                                </div>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-zinc-300 group-hover:text-zinc-400 flex-shrink-0"
                                >
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                              </div>
                            </div>
                          );
                        }}
                        getItemId={(item) => item.id}
                        emptyMessage="No items yet"
                      />
                    </div>
                  ) : (
                    /* Objects view */
                    groupBy.includes('scope') ? (
                      <ScopeColumnsView<ObjectType>
                        data={groupedObjects}
                        renderItem={(obj) => (
                          <ObjectItem
                            object={obj}
                            items={items}
                            workspaces={workspaces}
                            projects={projects}
                            expanded={expandedObjects.has(obj.id)}
                            onToggleExpand={() => setExpandedObjects(prev => {
                              const next = new Set(prev);
                              if (next.has(obj.id)) next.delete(obj.id);
                              else next.add(obj.id);
                              return next;
                            })}
                            onSelect={() => setObjectFilter(obj.id)}
                            onEdit={() => handleEditObject(obj)}
                            onDelete={() => handleDeleteObject(obj)}
                          />
                        )}
                        getItemId={(obj) => obj.id}
                        projects={projects}
                        workspaces={workspaces}
                        projectFilter={projectFilter}
                        workspaceFilter={workspaceFilter}
                        onProjectFilterChange={setProjectFilter}
                        onWorkspaceFilterChange={setWorkspaceFilter}
                        emptyMessages={{
                          global: 'No global objects',
                          project: 'No project objects',
                          workspace: 'No workspace objects',
                        }}
                      />
                    ) : (
                      <GroupedView<ObjectType>
                        groups={objectGroups}
                        renderItem={(obj) => (
                          <ObjectItem
                            object={obj}
                            items={items}
                            workspaces={workspaces}
                            projects={projects}
                            expanded={expandedObjects.has(obj.id)}
                            onToggleExpand={() => setExpandedObjects(prev => {
                              const next = new Set(prev);
                              if (next.has(obj.id)) next.delete(obj.id);
                              else next.add(obj.id);
                              return next;
                            })}
                            onSelect={() => setObjectFilter(obj.id)}
                            onEdit={() => handleEditObject(obj)}
                            onDelete={() => handleDeleteObject(obj)}
                          />
                        )}
                        getItemId={(obj) => obj.id}
                        emptyMessage="No objects"
                      />
                    )
                  )}
                </div>
              )}

              {activeTab === 'contexts' && (
                /* Contexts View */
                <div className="space-y-6">
                  {/* Header row: Group by */}
                  <div className="flex items-center gap-4">
                    <GroupByTabs value={groupBy} onChange={setGroupBy} />
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
                      onProjectFilterChange={setProjectFilter}
                      onWorkspaceFilterChange={setWorkspaceFilter}
                      emptyMessages={{
                        global: 'No global contexts',
                        project: 'No project contexts',
                        workspace: 'No workspace contexts',
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
              )}
            </div>
          </div>
        </div>
      )}

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        defaultCategory={categoryFilter !== 'all' ? categoryFilter : 'Main'}
        existingCategories={projectCategories}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        existingCategories={projectCategories}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingProject(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This will also delete all associated workspaces.`}
      />

      {/* Object Modals */}
      <AddObjectModal
        isOpen={isAddObjectOpen}
        onClose={() => setIsAddObjectOpen(false)}
        projectId={null}
        workspaceId={null}
        defaultScope="global"
        allowedScopes={['global', 'project', 'local']}
      />

      <EditObjectModal
        isOpen={!!editingObject}
        onClose={() => setEditingObject(null)}
        object={editingObject}
      />

      <DeleteConfirmModal
        isOpen={!!deletingObject}
        onClose={() => setDeletingObject(null)}
        onConfirm={confirmDeleteObject}
        title="Delete Object"
        message={`Are you sure you want to delete "${deletingObject?.name}"? This will also delete all items of this type.`}
      />
    </div>
  );
}
