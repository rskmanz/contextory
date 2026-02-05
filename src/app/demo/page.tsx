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
        <div className="flex-shrink-0 w-48 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">TARGET</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              👩‍💼
            </div>
            <div className="font-semibold text-sm">VC PM</div>
          </div>
          <div className="text-xs text-zinc-400">
            <div>• 20+ startups</div>
            <div>• 50+ investors</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 2: Project */}
        <div className="flex-shrink-0 w-52 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">PROJECT</div>
          <div className="flex items-center gap-2 mb-3">
            <span>🚀</span>
            <div className="font-semibold text-sm">2025 Accelerator</div>
          </div>
          <div className="text-xs text-zinc-400 mb-1">Workspaces:</div>
          <div className="space-y-1 text-xs">
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-500">💻 Online Program</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-500">💰 Investor Relations</div>
            <div className="px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium border border-blue-200">🎯 TechStart ←</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-500">🌱 GreenFuture</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-500">🏥 HealthAI</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 3: Workspace */}
        <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-xs text-blue-500 mb-2">WORKSPACE</div>
          <div className="flex items-center gap-2 mb-3">
            <span>🎯</span>
            <div className="font-semibold text-sm">TechStart</div>
          </div>

          {/* Contexts */}
          <div className="mb-3">
            <div className="text-xs text-zinc-400 mb-1">Contexts (3)</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded text-zinc-600">
                <span>💡</span><span>Idea Map</span>
                <span className="ml-auto text-zinc-400 text-[10px]">mindmap</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded text-zinc-600">
                <span>📋</span><span>Sprint</span>
                <span className="ml-auto text-zinc-400 text-[10px]">kanban</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded text-zinc-600">
                <span>📅</span><span>Schedule</span>
                <span className="ml-auto text-zinc-400 text-[10px]">gantt</span>
              </div>
            </div>
          </div>

          {/* Objects */}
          <div className="text-xs text-zinc-400 mb-1">Objects (4)</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="px-1 py-1 bg-zinc-50 rounded text-center text-zinc-600">👨‍💼 People</div>
            <div className="px-1 py-1 bg-zinc-50 rounded text-center text-zinc-600">💼 Investors</div>
            <div className="px-1 py-1 bg-zinc-50 rounded text-center text-zinc-600">✅ Tasks</div>
            <div className="px-1 py-1 bg-blue-50 rounded text-center text-blue-700 border border-blue-200">📅 Meetings←</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 4: Items */}
        <div className="flex-shrink-0 w-44 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">ITEMS</div>
          <div className="space-y-1 text-xs">
            <div className="px-2 py-1.5 bg-blue-50 rounded border border-blue-200">
              <div className="font-medium text-blue-700">Mentor Session ←</div>
              <div className="text-blue-400 text-[10px]">Jan 15</div>
            </div>
            <div className="px-2 py-1.5 bg-zinc-50 rounded">
              <div className="text-zinc-600">Investor Intro</div>
              <div className="text-zinc-400 text-[10px]">Jan 20</div>
            </div>
            <div className="px-2 py-1.5 bg-zinc-50 rounded">
              <div className="text-zinc-600">Demo Practice</div>
              <div className="text-zinc-400 text-[10px]">Jan 25</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 5: Item Context */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-xs text-blue-500 mb-2">ITEM CONTEXT</div>
          <div className="flex items-center gap-2 mb-2">
            <span>📅</span>
            <div className="font-semibold text-sm">Mentor Session</div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">📝 Agenda</div>
              <div className="text-zinc-500 text-[10px]">1. Pitch deck review</div>
              <div className="text-zinc-500 text-[10px]">2. Fundraising</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">✅ Actions</div>
              <div className="text-zinc-500 text-[10px]">• Update model</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">📄 Notes</div>
              <div className="text-zinc-500 text-[10px] italic">"Enterprise first..."</div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Startup as Item with Context */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        <div className="flex-shrink-0 w-48"></div>
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl"></div>

        {/* Project has Startups as Items */}
        <div className="flex-shrink-0 w-52 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">OBJECT: Startups</div>
          <div className="space-y-1 text-xs">
            <div className="px-2 py-1.5 bg-blue-50 rounded border border-blue-200">
              <div className="font-medium text-blue-700">🎯 TechStart ←</div>
              <div className="text-blue-400 text-[10px]">AI Hiring Platform</div>
            </div>
            <div className="px-2 py-1.5 bg-zinc-50 rounded">
              <div className="text-zinc-600">🌱 GreenFuture</div>
              <div className="text-zinc-400 text-[10px]">Carbon Capture</div>
            </div>
            <div className="px-2 py-1.5 bg-zinc-50 rounded">
              <div className="text-zinc-600">🏥 HealthAI</div>
              <div className="text-zinc-400 text-[10px]">AI Diagnostics</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Startup Item Context */}
        <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-xs text-blue-500 mb-2">STARTUP CONTEXT</div>
          <div className="flex items-center gap-2 mb-2">
            <span>🎯</span>
            <div className="font-semibold text-sm">TechStart</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Company</div>
              <div className="text-zinc-500 text-[10px]">Pre-Seed</div>
              <div className="text-zinc-500 text-[10px]">Founded 2024</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Team</div>
              <div className="text-zinc-500 text-[10px]">Alex Kim (CEO)</div>
              <div className="text-zinc-500 text-[10px]">2 engineers</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Metrics</div>
              <div className="text-zinc-500 text-[10px]">5 pilots</div>
              <div className="text-zinc-500 text-[10px]">$10K MRR</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Raise</div>
              <div className="text-zinc-500 text-[10px]">$500K @ $3M</div>
            </div>
          </div>
        </div>

        {/* Arrow to Person */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Person Context */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">PERSON CONTEXT</div>
          <div className="flex items-center gap-2 mb-2">
            <span>👨‍💼</span>
            <div className="font-semibold text-sm">Alex Kim</div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Background</div>
              <div className="text-zinc-500 text-[10px]">Google 5y (Sr PM)</div>
              <div className="text-zinc-500 text-[10px]">Stanford MBA</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Skills</div>
              <div className="text-zinc-500 text-[10px]">AI/ML, Product</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Notes</div>
              <div className="text-zinc-500 text-[10px] italic">"Strong founder"</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Visualization Types */}
      <div className="mt-6 bg-white rounded-xl border border-zinc-200 p-4">
        <div className="text-xs text-zinc-400 mb-2">8 VIEWS</div>
        <div className="flex gap-6">
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
            <div key={v.name} className="text-center">
              <div className="text-xl">{v.icon}</div>
              <div className="text-xs text-zinc-400">{v.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Message */}
      <div className="mt-4 text-center text-sm text-zinc-400">
        Every level has context: Project → Workspace → Object → Item → Item Context
      </div>
    </div>
  );
}
