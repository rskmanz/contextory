'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Project, Workspace } from '@/types';

export default function DesignAPage() {
    const projects = useStore((state) => state.projects);
    const workspaces = useStore((state) => state.workspaces);
    const loadData = useStore((state) => state.loadData);
    const isLoaded = useStore((state) => state.isLoaded);

    const [activeProject, setActiveProject] = useState<string | null>(null);
    const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Set initial active state when data loads
    useEffect(() => {
        if (isLoaded && projects.length > 0 && !activeProject) {
            setActiveProject(projects[0].id);
        }
    }, [isLoaded, projects, activeProject]);

    const selectedProject = projects.find(p => p.id === activeProject);
    const projectWorkspaces = workspaces.filter(w => w.projectId === activeProject);

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-900 text-zinc-400">
                Loading Studio...
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-zinc-50 font-sans overflow-hidden text-zinc-900">
            {/* Sidebar - Dark & Professional */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-zinc-900 text-zinc-400 flex flex-col transition-all duration-300 border-r border-zinc-800`}>
                {/* Sidebar Header */}
                <div className="h-14 flex items-center px-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        {sidebarOpen && <span className="font-semibold text-zinc-100 whitespace-nowrap">Studio View</span>}
                    </div>
                </div>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto py-4 space-y-1">
                    {sidebarOpen && <div className="px-4 text-xs font-medium uppercase tracking-wider text-zinc-600 mb-2">Projects</div>}

                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => setActiveProject(project.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors ${activeProject === project.id ? 'bg-zinc-800 text-white border-l-2 border-indigo-500' : ''}`}
                        >
                            <span className="text-lg">{project.icon}</span>
                            {sidebarOpen && <span className="text-sm truncate">{project.name}</span>}
                        </button>
                    ))}
                </div>

                {/* User / Settings Footer */}
                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center p-2 rounded hover:bg-zinc-800 text-zinc-500"
                    >
                        {sidebarOpen ? '← Collapse' : '→'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <div className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg text-zinc-800">{selectedProject?.name || 'Select a Project'}</h1>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                            {projectWorkspaces.length} Workspaces
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-sm">
                            + New Workspace
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 p-6 overflow-y-auto bg-zinc-50">
                    {selectedProject ? (
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projectWorkspaces.map(ws => (
                                    <div
                                        key={ws.id}
                                        className="group bg-white rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                                    >
                                        <div className="h-2 bg-gradient-to-r from-zinc-200 to-zinc-300 group-hover:from-indigo-400 group-hover:to-purple-500 transition-colors" />
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xl">
                                                    {ws.categoryIcon || '📂'}
                                                </div>
                                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-100 rounded text-zinc-400">
                                                    •••
                                                </button>
                                            </div>
                                            <h3 className="font-semibold text-zinc-900 mb-1">{ws.name}</h3>
                                            <p className="text-sm text-zinc-500 line-clamp-2 flex-1">
                                                {ws.category || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-500 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                                            <span>Updated recently</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Card Placeholder */}
                                <button className="border-2 border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center p-6 text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/10 transition-all gap-2 h-full min-h-[180px]">
                                    <span className="text-2xl">+</span>
                                    <span className="font-medium text-sm">Create Workspace</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-zinc-400">
                            Select a project to view workspaces
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
