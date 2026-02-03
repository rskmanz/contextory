'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddWorkspaceModal } from '@/components/modals/AddWorkspaceModal';
import { EditWorkspaceModal } from '@/components/modals/EditWorkspaceModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useStore } from '@/lib/store';
import { Workspace } from '@/types';

export default function ProjectOverviewPage() {
  const params = useParams();
  const { project } = params as { project: string };

  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const deleteWorkspace = useStore((state) => state.deleteWorkspace);

  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProject = projects.find(p => p.id === project);
  const projectWorkspaces = workspaces.filter(w => w.projectId === project);

  // Group workspaces by category
  const workspacesByCategory = projectWorkspaces.reduce((acc, ws) => {
    const cat = ws.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ws);
    return acc;
  }, {} as Record<string, Workspace[]>);

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setIsEditWorkspaceOpen(true);
  };

  const handleDeleteWorkspace = (workspace: Workspace) => {
    setDeletingWorkspace(workspace);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteWorkspace = async () => {
    if (deletingWorkspace) {
      await deleteWorkspace(deletingWorkspace.id);
      setDeletingWorkspace(null);
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

  if (!currentProject) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Project not found</div>
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
            { label: currentProject.name }
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
            {/* Project Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-16 h-16 rounded-2xl ${currentProject.gradient} flex items-center justify-center text-3xl`}>
                {currentProject.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{currentProject.name}</h1>
                <p className="text-sm text-zinc-500">{currentProject.category}</p>
              </div>
            </div>

            {/* Workspaces Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-800">Workspaces</h2>
                <button
                  onClick={() => setIsAddWorkspaceOpen(true)}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                >
                  + Add Workspace
                </button>
              </div>

              {Object.keys(workspacesByCategory).length === 0 ? (
                <div className="bg-zinc-50 rounded-xl p-8 text-center">
                  <p className="text-zinc-500 mb-4">No workspaces yet</p>
                  <button
                    onClick={() => setIsAddWorkspaceOpen(true)}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                  >
                    Create your first workspace
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(workspacesByCategory).map(([category, categoryWorkspaces]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm">{categoryWorkspaces[0]?.categoryIcon}</span>
                        <h3 className="text-sm font-medium text-zinc-600">{category}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryWorkspaces.map((ws) => (
                          <div
                            key={ws.id}
                            className="group relative bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-all"
                          >
                            <Link href={`/${project}/${ws.id}`} className="block">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{ws.categoryIcon}</span>
                                <span className="font-medium text-zinc-800">{ws.name}</span>
                              </div>
                            </Link>
                            {/* Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => handleEditWorkspace(ws)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteWorkspace(ws)}
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
      <AddWorkspaceModal
        isOpen={isAddWorkspaceOpen}
        onClose={() => setIsAddWorkspaceOpen(false)}
        projectId={project}
      />

      <EditWorkspaceModal
        isOpen={isEditWorkspaceOpen}
        onClose={() => {
          setIsEditWorkspaceOpen(false);
          setEditingWorkspace(null);
        }}
        workspace={editingWorkspace}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingWorkspace(null);
        }}
        onConfirm={confirmDeleteWorkspace}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${deletingWorkspace?.name}"? This will also delete all associated data.`}
      />
    </div>
  );
}
