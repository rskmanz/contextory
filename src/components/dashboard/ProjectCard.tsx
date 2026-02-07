'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Workspace {
    id: string;
    name: string;
}

interface ProjectCardProps {
    title: string;
    gradient: string;
    icon?: React.ReactNode;
    workspaces?: Workspace[];
    projectId?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onAddWorkspace?: () => void;
    onEditWorkspace?: (workspace: Workspace) => void;
    onDeleteWorkspace?: (workspace: Workspace) => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    title,
    gradient,
    icon,
    workspaces = [],
    projectId,
    onEdit,
    onDelete,
    onAddWorkspace,
    onEditWorkspace,
    onDeleteWorkspace,
    draggable = false,
    onDragStart,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [workspaceMenuId, setWorkspaceMenuId] = useState<string | null>(null);

    // Minimal style only
    const styles = {
        card: 'bg-white border border-zinc-200 shadow-sm hover:shadow-md text-zinc-900 rounded-2xl',
        headerText: 'text-zinc-900',
        subText: 'text-zinc-500',
        iconBg: 'bg-zinc-100 text-zinc-700',
        workspaceBg: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
        menuBg: 'bg-white border border-zinc-200 shadow-lg',
        menuItem: 'text-zinc-700 hover:bg-zinc-100',
        menuItemDanger: 'text-red-600 hover:bg-red-50',
    };
    const projectSlug = projectId || title.toLowerCase().replace(/\s+/g, '-');

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onEdit?.();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onDelete?.();
    };

    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            className={`group relative flex flex-col p-6 transition-all duration-300 min-h-40 overflow-hidden ${styles.card} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                {icon && (
                    <div className={`text-2xl flex items-center justify-center w-12 h-12 rounded-xl ${styles.iconBg}`}>
                        {icon}
                    </div>
                )}
                <h3 className={`text-xl leading-tight ${styles.headerText}`}>{title}</h3>
            </div>

            {/* Workspaces */}
            <div className="flex flex-wrap gap-2 mt-auto">
                {workspaces.map((ws) => (
                    <div key={ws.id} className="relative group/ws">
                        <Link
                            href={`/${projectSlug}/${ws.id}`}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${styles.workspaceBg} inline-flex items-center gap-1`}
                        >
                            {ws.name}
                        </Link>
                        {/* Workspace menu trigger */}
                        {(onEditWorkspace || onDeleteWorkspace) && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setWorkspaceMenuId(workspaceMenuId === ws.id ? null : ws.id);
                                }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-300 hover:bg-zinc-400 text-zinc-600 rounded-full text-[10px] opacity-0 group-hover/ws:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                ⋯
                            </button>
                        )}
                        {/* Workspace dropdown menu */}
                        {workspaceMenuId === ws.id && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setWorkspaceMenuId(null)} />
                                <div className={`absolute left-0 top-full mt-1 w-24 rounded-lg overflow-hidden z-20 ${styles.menuBg}`}>
                                    {onEditWorkspace && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setWorkspaceMenuId(null);
                                                onEditWorkspace(ws);
                                            }}
                                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-1.5 ${styles.menuItem}`}
                                        >
                                            ✏️ Edit
                                        </button>
                                    )}
                                    {onDeleteWorkspace && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setWorkspaceMenuId(null);
                                                onDeleteWorkspace(ws);
                                            }}
                                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-1.5 ${styles.menuItemDanger}`}
                                        >
                                            🗑️ Delete
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {workspaces.length === 0 && (
                    <p className={`text-sm ${styles.subText}`}>No projects</p>
                )}
                {/* Add Workspace button */}
                {onAddWorkspace && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddWorkspace();
                        }}
                        className="px-2 py-1 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all flex items-center gap-1"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add
                    </button>
                )}
            </div>

            {/* Menu button */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-2 opacity-50 hover:opacity-100 transition-opacity"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                        <div className={`absolute right-0 top-10 w-32 rounded-lg overflow-hidden z-20 ${styles.menuBg}`}>
                            <button
                                onClick={handleEdit}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${styles.menuItem}`}
                            >
                                <span>✏️</span> Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${styles.menuItemDanger}`}
                            >
                                <span>🗑️</span> Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
