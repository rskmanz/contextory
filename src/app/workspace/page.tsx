'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddWorkspaceModal } from '@/components/modals/AddWorkspaceModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useStore } from '@/lib/store';
import { Project } from '@/types';

export default function WorkspacesPage() {
    const projects = useStore((state) => state.projects);
    const workspaces = useStore((state) => state.workspaces);
    const loadData = useStore((state) => state.loadData);
    const isLoaded = useStore((state) => state.isLoaded);
    const deleteProject = useStore((state) => state.deleteProject);

    const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
    const [addWorkspaceProjectId, setAddWorkspaceProjectId] = useState<string>('');
    const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<Project | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deletingWorkspace, setDeletingWorkspace] = useState<Project | null>(null);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Group projects by workspace
    const projectsByWorkspace = projects.reduce((acc, proj) => {
        if (!acc[proj.workspaceId]) acc[proj.workspaceId] = [];
        acc[proj.workspaceId].push(proj);
        return acc;
    }, {} as Record<string, typeof projects>);

    const getWorkspaceById = (workspaceId: string) => {
        return workspaces.find(w => w.id === workspaceId);
    };

    const handleAddWorkspace = (projectId: string) => {
        setAddWorkspaceProjectId(projectId);
        setIsAddWorkspaceOpen(true);
    };

    const handleEditWorkspace = (workspace: Project) => {
        setEditingWorkspace(workspace);
        setIsEditWorkspaceOpen(true);
    };

    const handleDeleteWorkspace = (workspace: Project) => {
        setDeletingWorkspace(workspace);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteWorkspace = async () => {
        if (deletingWorkspace) {
            await deleteProject(deletingWorkspace.id);
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

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            <div className="flex-1 h-screen overflow-y-auto">
                {/* Header with Breadcrumb and Navigation */}
                <div className="sticky top-0 bg-white border-b border-zinc-100 px-8 sm:px-12 py-3 z-10 flex items-center justify-between">
                    <Breadcrumb items={[
                        { label: 'Home', href: '/' },
                        { label: 'Projects' }
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
                        {/* Page Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">Projects</h1>
                                <p className="text-sm text-zinc-500 mt-1">All projects across your workspaces</p>
                            </div>
                        </div>

                        {/* Projects by Workspace */}
                        {Object.keys(projectsByWorkspace).length === 0 ? (
                            <div className="bg-zinc-50 rounded-xl p-12 text-center">
                                <div className="text-4xl mb-4">📁</div>
                                <p className="text-zinc-600 font-medium mb-2">No projects yet</p>
                                <p className="text-zinc-400 text-sm mb-6">Create a project from a workspace page</p>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                                >
                                    Go to Workspaces
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(projectsByWorkspace).map(([workspaceId, wsProjects]) => {
                                    const workspace = getWorkspaceById(workspaceId);
                                    if (!workspace) return null;

                                    // Group by category within workspace
                                    const byCategory = wsProjects.reduce((acc, proj) => {
                                        const cat = proj.category || 'General';
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(proj);
                                        return acc;
                                    }, {} as Record<string, typeof wsProjects>);

                                    return (
                                        <div key={workspaceId} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                                            {/* Workspace Header */}
                                            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                                                <Link href={`/${workspaceId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                    <div className={`w-10 h-10 rounded-xl ${workspace.gradient} flex items-center justify-center text-lg`}>
                                                        {workspace.icon}
                                                    </div>
                                                    <div>
                                                        <h2 className="font-semibold text-zinc-900">{workspace.name}</h2>
                                                        <p className="text-xs text-zinc-500">{wsProjects.length} project{wsProjects.length !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={() => handleAddWorkspace(workspaceId)}
                                                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                                >
                                                    + Add
                                                </button>
                                            </div>

                                            {/* Projects */}
                                            <div className="p-5">
                                                {Object.entries(byCategory).map(([category, categoryProjects]) => (
                                                    <div key={category} className="mb-4 last:mb-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm">{categoryProjects[0]?.categoryIcon || '📁'}</span>
                                                            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{category}</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {categoryProjects.map((proj) => (
                                                                <div
                                                                    key={proj.id}
                                                                    className="group relative flex items-center gap-3 p-3 bg-white border border-zinc-100 rounded-xl hover:border-zinc-200 hover:shadow-sm transition-all"
                                                                >
                                                                    <Link href={`/${workspaceId}/${proj.id}`} className="flex-1 flex items-center gap-3">
                                                                        <span className="text-lg">{proj.categoryIcon || '📁'}</span>
                                                                        <span className="font-medium text-zinc-700 text-sm">{proj.name}</span>
                                                                    </Link>
                                                                    {/* Actions */}
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                                        <button
                                                                            onClick={() => handleEditWorkspace(proj)}
                                                                            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                                                                            title="Edit"
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteWorkspace(proj)}
                                                                            className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500"
                                                                            title="Delete"
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {addWorkspaceProjectId && (
                <AddWorkspaceModal
                    isOpen={isAddWorkspaceOpen}
                    onClose={() => {
                        setIsAddWorkspaceOpen(false);
                        setAddWorkspaceProjectId('');
                    }}
                    workspaceId={addWorkspaceProjectId}
                />
            )}

            <EditProjectModal
                isOpen={isEditWorkspaceOpen}
                onClose={() => {
                    setIsEditWorkspaceOpen(false);
                    setEditingWorkspace(null);
                }}
                project={editingWorkspace}
            />

            <DeleteConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeletingWorkspace(null);
                }}
                onConfirm={confirmDeleteWorkspace}
                title="Delete Project"
                message={`Are you sure you want to delete "${deletingWorkspace?.name}"? This will also delete all associated data.`}
            />
        </div>
    );
}
