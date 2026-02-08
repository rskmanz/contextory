'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

interface MetaSidebarProps {
    activePage?: 'home' | 'workspace' | 'workspaces' | 'settings';
}

export const MetaSidebar: React.FC<MetaSidebarProps> = ({ activePage = 'home' }) => {
    const isWorkspace = activePage === 'workspace' || activePage === 'workspaces';
    const workspaces = useStore((state) => state.workspaces);
    const projects = useStore((state) => state.projects);
    const userEmail = useStore((state) => state.userEmail);
    const userAvatarUrl = useStore((state) => state.userAvatarUrl);

    const userInitial = userEmail ? userEmail[0].toUpperCase() : '?';

    // Get the first project to link directly to editor
    const firstProject = projects[0];
    const firstWorkspace = firstProject ? workspaces.find(ws => ws.id === firstProject.workspaceId) : workspaces[0];
    const workspaceHref = firstWorkspace && firstProject
        ? `/${firstWorkspace.id}/${firstProject.id}`
        : '/workspace';

    return (
        <aside className="w-16 bg-zinc-50 border-r border-zinc-100 flex flex-col items-center py-4 gap-2">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-lg mb-4">
                I
            </div>

            {/* Home */}
            <Link
                href="/dashboard"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activePage === 'home' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                    }`}
                title="Home"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </Link>

            {/* Workspaces */}
            <Link
                href={workspaceHref}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isWorkspace ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                    }`}
                title="Workspaces"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            </Link>

            {/* Search */}
            <button
                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
                title="Search"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </button>

            <div className="flex-1" />

            {/* Settings */}
            <Link
                href="/settings"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activePage === 'settings' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                    }`}
                title="Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </Link>

            {/* User Avatar */}
            <Link
                href="/settings"
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-zinc-200 hover:border-zinc-400 transition-all"
                title={userEmail || 'Account'}
            >
                {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-sm font-semibold text-zinc-500 bg-zinc-100 w-full h-full flex items-center justify-center">
                        {userInitial}
                    </span>
                )}
            </Link>
        </aside>
    );
};
