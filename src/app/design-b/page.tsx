'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function DesignBPage() {
    const projects = useStore((state) => state.projects);
    const workspaces = useStore((state) => state.workspaces);
    const objects = useStore((state) => state.objects);
    const loadData = useStore((state) => state.loadData);
    const isLoaded = useStore((state) => state.isLoaded);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const recentWorkspaces = useMemo(() => workspaces.slice(0, 4), [workspaces]);
    const stats = useMemo(() => ({
        projects: projects.length,
        workspaces: workspaces.length,
        objects: objects.length,
        contexts: 0 // placeholder
    }), [projects, workspaces, objects]);

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F5F5F7] text-gray-400">
                Loading Hub...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-8 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 mt-1 font-medium">Welcome back, User.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-white rounded-full border-none shadow-sm text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                            />
                            <span className="absolute left-3.5 top-2 text-gray-400">🔍</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200">
                            U
                        </div>
                    </div>
                </header>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-6">

                    {/* Main Feature Card - 2x2 */}
                    <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">My Projects</h2>
                                <p className="text-gray-500 mb-6">Manage your ongoing work and archives.</p>
                            </div>

                            <div className="space-y-3">
                                {projects.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl group/item hover:bg-blue-50 transition-colors cursor-pointer">
                                        <span className="text-2xl">{p.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{p.name}</h3>
                                        </div>
                                        <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover/item:text-blue-500 transition-colors">→</span>
                                    </div>
                                ))}
                                {projects.length > 3 && (
                                    <div className="text-center pt-2">
                                        <span className="text-sm font-semibold text-blue-600 cursor-pointer">+ {projects.length - 3} more</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Decorative Circle */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    {/* Stats Widget - 1x1 */}
                    <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center gap-2 hover:translate-y-[-2px] transition-transform">
                        <span className="text-4xl font-black text-blue-600">{stats.workspaces}</span>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Workspaces</span>
                    </div>

                    {/* Quick Action - 1x1 */}
                    <button className="md:col-span-1 bg-gray-900 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:bg-black transition-all text-white flex flex-col justify-between group">
                        <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                        <span className="font-semibold text-lg text-left">Create New<br />Workspace</span>
                    </button>

                    {/* Recent Objects - 2x1 */}
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span>📊</span> Data Objects
                            </h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                {objects.slice(0, 4).map(obj => (
                                    <div key={obj.id} className="bg-white/10 backdrop-blur-md rounded-xl p-3 min-w-[100px] border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                        <div className="text-2xl mb-1">{obj.icon}</div>
                                        <div className="text-xs font-medium truncate opacity-90">{obj.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Background shine */}
                        <div className="absolute top-0 right-0 w-full h-full bg-white/5 skew-x-12 translate-x-1/2" />
                    </div>

                    {/* Calendar/Timeline Widget - 1x2 Vertical */}
                    <div className="md:col-span-1 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-4">Activity</h3>
                        <div className="flex-1 relative">
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
                            <div className="space-y-6 relative z-10">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500 mt-1" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">2h ago</p>
                                            <p className="text-sm font-medium text-gray-800">Updated "Q4 Roadmap"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Empty Spot filler for 4th column if needed, or expand others */}
                    <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center gap-2 hover:translate-y-[-2px] transition-transform">
                        <span className="text-4xl font-black text-purple-600">{stats.objects}</span>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Objects</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
