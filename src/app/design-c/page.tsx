'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Project, Workspace } from '@/types';

type StreamItem =
    | { type: 'header'; label: string }
    | { type: 'project'; data: Project }
    | { type: 'workspace'; data: Workspace };

export default function DesignCPage() {
    const projects = useStore((state) => state.projects);
    const workspaces = useStore((state) => state.workspaces);
    const loadData = useStore((state) => state.loadData);
    const isLoaded = useStore((state) => state.isLoaded);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white text-zinc-300 font-serif">
                <span className="animate-pulse">Loading stream...</span>
            </div>
        );
    }

    // Interleave content for a "Stream" feel
    // We'll create a simple timeline of items
    const streamItems: StreamItem[] = [
        { type: 'header', label: 'Today' },
        ...projects.map(p => ({ type: 'project' as const, data: p })),
        { type: 'header', label: 'Earlier' },
        ...workspaces.map(w => ({ type: 'workspace' as const, data: w })),
    ];

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-100 selection:text-zinc-900">
            <div className="max-w-2xl mx-auto px-6 py-20">

                {/* Navigation / Header */}
                <nav className="mb-20 flex items-center justify-between">
                    <Link href="/" className="text-sm font-semibold tracking-tight hover:underline underline-offset-4 decoration-zinc-300">
                        InfoDashboard
                    </Link>
                    <div className="flex gap-6 text-sm text-zinc-400">
                        <span className="text-zinc-900 cursor-pointer">Stream</span>
                        <span className="hover:text-zinc-600 cursor-pointer transition-colors">Archive</span>
                        <span className="hover:text-zinc-600 cursor-pointer transition-colors">Settings</span>
                    </div>
                </nav>

                {/* Main Feed */}
                <div className="space-y-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-800">
                            Good afternoon.
                        </h1>
                        <p className="text-zinc-400 text-lg font-light">
                            Here is your work stream for today.
                        </p>
                    </div>

                    <div className="relative border-l border-zinc-100 ml-3 space-y-10 py-2">
                        {streamItems.map((item, index) => {
                            if (item.type === 'header') {
                                return (
                                    <div key={`header-${index}`} className="-ml-[17px] flex items-center gap-4 mt-8 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-zinc-200 ring-4 ring-white" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">{item.label}</span>
                                    </div>
                                );
                            }

                            if (item.type === 'project') {
                                const p = item.data;
                                return (
                                    <div key={`proj-${p.id}`} className="pl-8 relative group cursor-pointer">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-zinc-300 bg-white group-hover:border-zinc-900 group-hover:bg-zinc-900 transition-colors" />
                                        <div className="space-y-1">
                                            <div className="flex items-baseline gap-3">
                                                <h3 className="text-xl font-medium text-zinc-800 group-hover:underline underline-offset-4 decoration-1 decoration-zinc-300">
                                                    {p.name}
                                                </h3>
                                                <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-100">Project</span>
                                            </div>
                                            <p className="text-zinc-500 leading-relaxed max-w-md">
                                                {p.category || "No description provided for this project."}
                                            </p>
                                            <div className="pt-2 flex gap-4 text-xs text-zinc-400">
                                                <span>{p.category || 'Uncategorized'}</span>
                                                <span>•</span>
                                                <span>Updated 2d ago</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (item.type === 'workspace') {
                                const w = item.data;
                                return (
                                    <div key={`ws-${w.id}`} className="pl-8 relative group cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border border-zinc-100 bg-zinc-50 group-hover:border-zinc-400 transition-colors" />
                                        <div className="flex items-center gap-4 bg-zinc-50/50 p-4 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                                            <span className="text-xl grayscale opacity-70">{w.categoryIcon || '📄'}</span>
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium text-zinc-700">{w.name}</h4>
                                                <p className="text-xs text-zinc-400 mt-0.5">Workspace in <span className="text-zinc-500">Parent Project</span></p>
                                            </div>
                                            <span className="text-zinc-300 text-lg">→</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>

                <footer className="mt-32 border-t border-zinc-100 pt-8 flex justify-between text-xs text-zinc-300">
                    <span>InfoDashboard Minimal</span>
                    <span>v0.1.0</span>
                </footer>

            </div>
        </div>
    );
}
