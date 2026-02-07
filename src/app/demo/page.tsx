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
          <span className="text-xl font-bold text-zinc-900">Contextory</span>
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
              👨‍💻
            </div>
            <div className="font-semibold text-sm">Founder</div>
          </div>
          <div className="text-xs text-zinc-400">
            <div>• 5+ projects</div>
            <div>• 3+ VCs</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 2: Project */}
        <div className="flex-shrink-0 w-52 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">WORKSPACE</div>
          <div className="flex items-center gap-2 mb-3">
            <span>🔥</span>
            <div className="font-semibold text-sm">Founder University</div>
          </div>
          <div className="text-xs text-zinc-400 mb-1">Projects:</div>
          <div className="space-y-1 text-xs">
            <div className="px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium border border-blue-200">📣 Pitch Deck ←</div>
            <div className="px-2 py-1 bg-zinc-50 rounded text-zinc-500">⚙️ Weekly Report</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 3: Workspace */}
        <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-xs text-blue-500 mb-2">PROJECT</div>
          <div className="flex items-center gap-2 mb-3">
            <span>📣</span>
            <div className="font-semibold text-sm">Pitch Deck</div>
          </div>

          {/* Contexts */}
          <div className="mb-3">
            <div className="text-xs text-zinc-400 mb-1">Contexts (2)</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded text-zinc-600">
                <span>🧠</span><span>Idea Map</span>
                <span className="ml-auto text-zinc-400 text-[10px]">mindmap</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded text-zinc-600">
                <span>📋</span><span>Sprint Board</span>
                <span className="ml-auto text-zinc-400 text-[10px]">kanban</span>
              </div>
            </div>
          </div>

          {/* Objects */}
          <div className="text-xs text-zinc-400 mb-1">Objects (4)</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="px-1 py-1 bg-blue-50 rounded text-center text-blue-700 border border-blue-200">👤 Product Idea←</div>
            <div className="px-1 py-1 bg-zinc-50 rounded text-center text-zinc-600">✅ Tasks</div>
            <div className="px-1 py-1 bg-zinc-50 rounded text-center text-zinc-600">🔧 Tools</div>
            <div className="px-1 py-1 bg-zinc-50 rounded text-center text-zinc-600">👥 Teams</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 4: Items */}
        <div className="flex-shrink-0 w-44 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">ITEMS</div>
          <div className="space-y-1 text-xs">
            <div className="px-2 py-1.5 bg-blue-50 rounded border border-blue-200">
              <div className="font-medium text-blue-700">🌀 Bayond ←</div>
              <div className="text-blue-400 text-[10px]">Contextory</div>
            </div>
            <div className="px-2 py-1.5 bg-zinc-50 rounded">
              <div className="text-zinc-600">🐹 HanRyo</div>
              <div className="text-zinc-400 text-[10px]">AI Companion</div>
            </div>
            <div className="px-2 py-1.5 bg-zinc-50 rounded">
              <div className="text-zinc-600">🚀 clawdbot</div>
              <div className="text-zinc-400 text-[10px]">AI Assistant</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Column 5: Item Context */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-blue-200 p-4">
          <div className="text-xs text-blue-500 mb-2">ITEM CONTEXT</div>
          <div className="flex items-center gap-2 mb-2">
            <span>🌀</span>
            <div className="font-semibold text-sm">Bayond</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Problem</div>
              <div className="text-zinc-500 text-[10px]">Context lost</div>
              <div className="text-zinc-500 text-[10px]">across tools</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Solution</div>
              <div className="text-zinc-500 text-[10px]">Contextory</div>
              <div className="text-zinc-500 text-[10px]">8 views</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Market</div>
              <div className="text-zinc-500 text-[10px]">Founders</div>
              <div className="text-zinc-500 text-[10px]">VCs/PMs</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Stage</div>
              <div className="text-zinc-500 text-[10px]">MVP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Nested Context */}
      <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
        <div className="flex-shrink-0 w-48"></div>
        <div className="flex-shrink-0 w-16"></div>
        <div className="flex-shrink-0 w-52"></div>
        <div className="flex-shrink-0 w-16"></div>
        <div className="flex-shrink-0 w-64"></div>
        <div className="flex-shrink-0 w-16"></div>
        <div className="flex-shrink-0 w-44"></div>

        {/* Arrow from Item Context */}
        <div className="flex-shrink-0 flex items-center text-zinc-300 text-2xl">→</div>

        {/* Nested Context */}
        <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 mb-2">NESTED CONTEXT</div>
          <div className="flex items-center gap-2 mb-2">
            <span>🎯</span>
            <div className="font-semibold text-sm">Feature: Views</div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Tree</div>
              <div className="text-zinc-500 text-[10px]">Mindmap, List</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Board</div>
              <div className="text-zinc-500 text-[10px]">Kanban, Grid, Flow</div>
            </div>
            <div className="bg-zinc-50 p-1.5 rounded">
              <div className="font-medium text-zinc-700">Canvas</div>
              <div className="text-zinc-500 text-[10px]">Freeform drawing</div>
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
        Every level has context: Workspace → Project → Object → Item → Item Context
      </div>
    </div>
  );
}
