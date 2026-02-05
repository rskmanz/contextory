'use client';

import React from 'react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-bold text-zinc-900">Context OS</span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800"
        >
          Try Demo
        </Link>
      </div>

      {/* Main Flow: Left to Right */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Column 1: Target User */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">TARGET USER</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-lg">
              👩‍💼
            </div>
            <div>
              <div className="font-semibold text-sm">VC Program Manager</div>
              <div className="text-xs text-zinc-500">Accelerator</div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 space-y-1">
            <div>• 20+ startups</div>
            <div>• 50+ investors</div>
            <div>• 100+ meetings/year</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 2: Project */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">PROJECT</div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚀</span>
            <div className="font-semibold text-sm">2025 Accelerator</div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-600">💻 Online Program</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-600">🏢 Offline Program</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-600">💰 Investor Relations</div>
            <div className="px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium">🎯 TechStart ←</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-600">🌱 GreenFuture</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-600">🏥 HealthAI</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 3: Workspace */}
        <div className="flex-shrink-0 w-72 bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-xs text-blue-500 mb-2">WORKSPACE</div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <div className="font-semibold text-sm">TechStart (Startup A)</div>
          </div>

          {/* Contexts */}
          <div className="mb-4">
            <div className="text-xs text-purple-500 mb-2">CONTEXTS (3)</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-50 rounded">
                <span>💡</span>
                <span>Business Idea Map</span>
                <span className="ml-auto text-purple-400">mindmap</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-50 rounded">
                <span>📋</span>
                <span>Sprint Board</span>
                <span className="ml-auto text-purple-400">kanban</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-50 rounded">
                <span>📅</span>
                <span>Meeting Schedule</span>
                <span className="ml-auto text-purple-400">gantt</span>
              </div>
            </div>
          </div>

          {/* Objects */}
          <div>
            <div className="text-xs text-green-500 mb-2">OBJECTS (4)</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="px-2 py-1.5 bg-green-50 rounded text-center">
                <div>👨‍💼</div>
                <div className="text-green-700">Entrepreneurs</div>
              </div>
              <div className="px-2 py-1.5 bg-green-50 rounded text-center">
                <div>💼</div>
                <div className="text-green-700">Investors</div>
              </div>
              <div className="px-2 py-1.5 bg-green-50 rounded text-center">
                <div>✅</div>
                <div className="text-green-700">Tasks</div>
              </div>
              <div className="px-2 py-1.5 bg-orange-50 rounded text-center border border-orange-200">
                <div>📅</div>
                <div className="text-orange-700">Meetings ←</div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 4: Items */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-orange-200 p-4">
          <div className="text-xs text-orange-500 mb-2">ITEMS (Meetings)</div>
          <div className="space-y-2 text-xs">
            <div className="px-2 py-2 bg-orange-50 rounded border border-orange-200">
              <div className="font-medium text-orange-800">Mentor Session ←</div>
              <div className="text-orange-500">Jan 15, 2025</div>
            </div>
            <div className="px-2 py-2 bg-zinc-50 rounded">
              <div className="font-medium text-zinc-600">Investor Intro</div>
              <div className="text-zinc-400">Jan 20, 2025</div>
            </div>
            <div className="px-2 py-2 bg-zinc-50 rounded">
              <div className="font-medium text-zinc-600">Demo Practice</div>
              <div className="text-zinc-400">Jan 25, 2025</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 5: Item Context */}
        <div className="flex-shrink-0 w-72 bg-white rounded-xl border border-cyan-200 p-4">
          <div className="text-xs text-cyan-500 mb-2">ITEM CONTEXT</div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📅</span>
            <div>
              <div className="font-semibold text-sm">Mentor Session</div>
              <div className="text-xs text-zinc-400">with Alex Kim</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-cyan-50 p-2 rounded">
              <div className="font-medium text-cyan-700 mb-1">📝 Agenda</div>
              <div className="text-cyan-600">1. Review pitch deck</div>
              <div className="text-cyan-600">2. Fundraising strategy</div>
              <div className="text-cyan-600">3. Q&A</div>
            </div>
            <div className="bg-cyan-50 p-2 rounded">
              <div className="font-medium text-cyan-700 mb-1">✅ Action Items</div>
              <div className="text-cyan-600">• Update financial model</div>
              <div className="text-cyan-600">• Schedule investor intro</div>
            </div>
            <div className="bg-cyan-50 p-2 rounded">
              <div className="font-medium text-cyan-700 mb-1">📄 Notes</div>
              <div className="text-cyan-600 italic">"Focus on enterprise..."</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Visualization Types */}
      <div className="mt-8 bg-white rounded-xl border border-zinc-200 p-4">
        <div className="text-xs text-zinc-400 mb-3">8 VISUALIZATION TYPES</div>
        <div className="flex gap-4 overflow-x-auto">
          {[
            { icon: '📝', name: 'List' },
            { icon: '🧠', name: 'Mindmap' },
            { icon: '📋', name: 'Kanban' },
            { icon: '🔲', name: 'Grid' },
            { icon: '🔀', name: 'Flow' },
            { icon: '📊', name: 'Table' },
            { icon: '📅', name: 'Gantt' },
            { icon: '🎨', name: 'Canvas' },
          ].map((v) => (
            <div key={v.name} className="flex-shrink-0 text-center">
              <div className="text-2xl">{v.icon}</div>
              <div className="text-xs text-zinc-600">{v.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Message */}
      <div className="mt-6 text-center text-sm text-zinc-500">
        Every level has its own context. Project → Workspace → Object → Item → Item Context.
      </div>
    </div>
  );
}
