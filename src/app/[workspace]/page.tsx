'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddWorkspaceModal as AddProjectModal } from '@/components/modals/AddWorkspaceModal';
import { AddObjectModal } from '@/components/modals/AddObjectModal';
import { AddContextModal } from '@/components/modals/AddContextModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useStore } from '@/lib/store';
import { Project } from '@/types';
import { useRouter } from 'next/navigation';

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const { workspace } = params as { workspace: string };

  const router = useRouter();
  const workspaces = useStore((state) => state.workspaces);
  const projects = useStore((state) => state.projects);
  const items = useStore((state) => state.items);
  const objects = useStore((state) => state.objects);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const deleteProject = useStore((state) => state.deleteProject);
  const getWorkspaceObjects = useStore((state) => state.getWorkspaceObjects);
  const getWorkspaceContexts = useStore((state) => state.getWorkspaceContexts);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddObjectOpen, setIsAddObjectOpen] = useState(false);
  const [isAddContextOpen, setIsAddContextOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentWorkspace = workspaces.find(p => p.id === workspace);
  const workspaceProjects = projects.filter(w => w.workspaceId === workspace);

  // Group projects by category
  const projectsByCategory = workspaceProjects.reduce((acc, proj) => {
    const cat = proj.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(proj);
    return acc;
  }, {} as Record<string, Project[]>);

  // Workspace-scoped only (no global)
  const wsObjects = getWorkspaceObjects(workspace);
  const wsContexts = getWorkspaceContexts(workspace);

  const handleEditProject = (proj: Project) => {
    setEditingProject(proj);
    setIsEditProjectOpen(true);
  };

  const handleDeleteProject = (proj: Project) => {
    setDeletingProject(proj);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
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

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Workspace not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <div className="flex-1 h-screen overflow-y-auto">
        {/* Header with Breadcrumb and Navigation */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-8 sm:px-12 py-3 z-10 flex items-center justify-between">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: currentWorkspace.name }
          ]} />
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

        <div className="p-8 sm:p-12">
          <div className="mx-auto max-w-[1200px]">
            {/* Workspace Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-16 h-16 rounded-2xl ${currentWorkspace.gradient} flex items-center justify-center text-3xl`}>
                {currentWorkspace.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{currentWorkspace.name}</h1>
                <p className="text-sm text-zinc-500">{currentWorkspace.category}</p>
              </div>
            </div>

            {/* Contexts Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-800">Contexts</h2>
                <button
                  onClick={() => setIsAddContextOpen(true)}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                >
                  + Add Context
                </button>
              </div>
              {wsContexts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wsContexts.map((ctx) => (
                    <button
                      key={ctx.id}
                      onClick={() => {
                        const firstProj = workspaceProjects[0];
                        if (firstProj) router.push(`/${workspace}/${firstProj.id}?tab=context:${ctx.id}`);
                      }}
                      className="flex flex-col items-start p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 hover:shadow-sm transition-all text-left"
                    >
                      <span className="text-2xl mb-2">{ctx.icon}</span>
                      <span className="font-medium text-zinc-800">{ctx.name}</span>
                      <span className="text-xs text-zinc-500 capitalize">{ctx.viewStyle || 'Not set'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-xl p-6 text-center">
                  <p className="text-zinc-500 text-sm">No workspace-scoped contexts yet</p>
                </div>
              )}
            </div>

            {/* Objects Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-800">Objects</h2>
                <button
                  onClick={() => setIsAddObjectOpen(true)}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                >
                  + Add Object
                </button>
              </div>
              {wsObjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wsObjects.map((obj) => {
                    const objItems = items.filter((i) =>
                      i.objectId === obj.id && i.workspaceId === workspace && !i.projectId
                    );
                    return (
                      <button
                        key={obj.id}
                        onClick={() => {
                          const firstProj = workspaceProjects[0];
                          if (firstProj) router.push(`/${workspace}/${firstProj.id}?tab=object:${obj.id}`);
                        }}
                        className="flex flex-col items-start p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 hover:shadow-sm transition-all text-left"
                      >
                        <span className="text-2xl mb-2">{obj.icon}</span>
                        <span className="font-medium text-zinc-800">{obj.name}</span>
                        <span className="text-xs text-zinc-500">{objItems.length} items</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-xl p-6 text-center">
                  <p className="text-zinc-500 text-sm">No workspace-scoped objects yet</p>
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-800">Projects</h2>
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                >
                  + Add Project
                </button>
              </div>

              {Object.keys(projectsByCategory).length === 0 ? (
                <div className="bg-zinc-50 rounded-xl p-8 text-center">
                  <p className="text-zinc-500 mb-4">No projects yet</p>
                  <button
                    onClick={() => setIsAddProjectOpen(true)}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm">{categoryProjects[0]?.categoryIcon}</span>
                        <h3 className="text-sm font-medium text-zinc-600">{category}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryProjects.map((proj) => (
                          <div
                            key={proj.id}
                            className="group relative bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-all"
                          >
                            <Link href={`/${workspace}/${proj.id}`} className="block">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{proj.categoryIcon}</span>
                                <span className="font-medium text-zinc-800">{proj.name}</span>
                              </div>
                            </Link>
                            {/* Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => handleEditProject(proj)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteProject(proj)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-red-100 text-xs"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        workspaceId={workspace}
      />

      <AddObjectModal
        isOpen={isAddObjectOpen}
        onClose={() => setIsAddObjectOpen(false)}
        workspaceId={workspace}
        projectId={null}
        defaultScope="workspace"
        allowedScopes={['global', 'workspace']}
      />

      <AddContextModal
        isOpen={isAddContextOpen}
        onClose={() => setIsAddContextOpen(false)}
        workspaceId={workspace}
        projectId={null}
        defaultScope="workspace"
        allowedScopes={['global', 'workspace']}
        objects={objects}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingProject(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This will also delete all associated data.`}
      />
    </div>
  );
}
