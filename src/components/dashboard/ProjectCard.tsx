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
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    title,
    gradient,
    icon,
    workspaces = [],
    projectId,
    onEdit,
    onDelete,
}) => {
    const [showMenu, setShowMenu] = useState(false);

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
        <div className={`group relative flex flex-col p-6 transition-all duration-300 min-h-40 overflow-hidden ${styles.card}`}>
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
            {workspaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto">
                    {workspaces.map((ws) => (
                        <Link
                            key={ws.id}
                            href={`/${projectSlug}/${ws.id}`}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${styles.workspaceBg}`}
                        >
                            {ws.name}
                        </Link>
                    ))}
                </div>
            )}

            {workspaces.length === 0 && (
                <p className={`text-sm mt-auto ${styles.subText}`}>No workspaces</p>
            )}

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
