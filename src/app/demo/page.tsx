'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('workspace');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-zinc-900">Context OS</span>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Try Demo
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">
          Context Management for Complex Projects
        </h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
          One place to organize, visualize, and never lose context about your projects, people, and meetings.
        </p>
      </section>

      {/* Target User Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl">
              👩‍💼
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Use Case: VC Program Manager</h2>
              <p className="text-zinc-600 mb-6">
                Manages accelerator programs with 20+ startups, 50+ investors/mentors, and hundreds of meetings per year.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
                    <span className="text-red-500">😫</span> Pain Points
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-600">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      Information scattered across Notion, Slack, Sheets, Email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      "What did we discuss last meeting?" - context lost
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      Hard to see relationships between investors and startups
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      Hours spent compiling weekly/monthly reports
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
                    <span className="text-green-500">✨</span> With Context OS
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      One workspace per startup with full context history
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      Click any person/meeting to see all related context
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      Visual maps showing connections and relationships
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      Project-level views for instant reporting
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Hierarchy Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">How It Works</h2>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          {/* Project Level */}
          <div className="border-b border-zinc-100">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <div className="font-semibold text-zinc-900">2025 VC Accelerator</div>
                <div className="text-xs text-zinc-500">Project with 6 workspaces</div>
              </div>
            </div>
          </div>

          {/* Meta Context */}
          <div className="p-4 border-b border-zinc-100 bg-amber-50/50">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 text-center text-zinc-300">│</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">META-CONTEXT</span>
              <span className="text-zinc-700">Program Roadmap</span>
              <span className="text-zinc-400 text-xs">→ Visible across all workspaces</span>
            </div>
            <div className="ml-9 mt-2 flex gap-4 text-xs text-zinc-500">
              <span className="px-2 py-1 bg-zinc-100 rounded">Phase 1: Selection</span>
              <span>→</span>
              <span className="px-2 py-1 bg-zinc-100 rounded">Phase 2: Mentoring</span>
              <span>→</span>
              <span className="px-2 py-1 bg-zinc-100 rounded">Phase 3: Demo Day</span>
            </div>
          </div>

          {/* Workspaces List */}
          <div className="p-4 border-b border-zinc-100">
            <div className="flex items-center gap-3 text-sm mb-3">
              <span className="w-6 text-center text-zinc-300">├</span>
              <span className="font-medium text-zinc-700">Workspaces:</span>
            </div>
            <div className="ml-9 grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { icon: '💻', name: 'Online Program', active: false },
                { icon: '🏢', name: 'Offline Program', active: false },
                { icon: '💰', name: 'Investor Relations', active: false },
                { icon: '🎯', name: 'TechStart', active: true },
                { icon: '🌱', name: 'GreenFuture', active: false },
                { icon: '🏥', name: 'HealthAI', active: false },
              ].map((ws) => (
                <button
                  key={ws.name}
                  onClick={() => setExpandedSection(ws.active ? 'workspace' : null)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    ws.active
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span>{ws.icon}</span>
                  <span>{ws.name}</span>
                  {ws.active && <span className="text-xs ml-auto">▼</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Expanded Workspace: TechStart */}
          {expandedSection === 'workspace' && (
            <div className="bg-blue-50/30">
              {/* Workspace Header */}
              <div className="p-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-zinc-300">│</span>
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-semibold text-zinc-900">TechStart (Startup A)</div>
                    <div className="text-xs text-zinc-500">AI Hiring Platform - Alex Kim, CEO</div>
                  </div>
                </div>
              </div>

              {/* Contexts */}
              <div className="p-4 border-b border-zinc-100">
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="w-6 text-center text-zinc-300">│</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">CONTEXTS</span>
                  <span className="text-zinc-500 text-xs">3 visualizations</span>
                </div>
                <div className="ml-9 grid md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>💡</span>
                      <span className="font-medium text-sm">Business Idea Map</span>
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">Mindmap View</div>
                    <div className="bg-zinc-50 rounded p-2 text-xs text-zinc-600">
                      <div className="font-medium mb-1">AI Hiring Platform</div>
                      <div className="ml-2 text-zinc-400">├ Skill Matching</div>
                      <div className="ml-2 text-zinc-400">├ AI Interview</div>
                      <div className="ml-2 text-zinc-400">└ Analytics</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📋</span>
                      <span className="font-medium text-sm">Sprint Board</span>
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">Kanban View</div>
                    <div className="bg-zinc-50 rounded p-2 text-xs">
                      <div className="flex gap-2">
                        <div className="flex-1 text-center text-zinc-400">To Do</div>
                        <div className="flex-1 text-center text-zinc-400">Doing</div>
                        <div className="flex-1 text-center text-zinc-400">Done</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📅</span>
                      <span className="font-medium text-sm">Meeting Schedule</span>
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">Gantt View</div>
                    <div className="bg-zinc-50 rounded p-2 text-xs text-zinc-600">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-2 bg-blue-300 rounded"></div>
                        <span className="text-zinc-400">Mentor Sessions</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-4 h-2 bg-green-300 rounded"></div>
                        <span className="text-zinc-400">Investor Intros</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objects */}
              <div className="p-4 border-b border-zinc-100">
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="w-6 text-center text-zinc-300">│</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">OBJECTS</span>
                  <span className="text-zinc-500 text-xs">4 types</span>
                </div>
                <div className="ml-9 grid md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>👨‍💼</span>
                      <span className="font-medium text-sm">Entrepreneurs</span>
                    </div>
                    <div className="text-xs text-zinc-500">1 person</div>
                    <div className="mt-2 px-2 py-1 bg-zinc-50 rounded text-xs text-zinc-600">
                      Alex Kim (CEO)
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>💼</span>
                      <span className="font-medium text-sm">Investors</span>
                    </div>
                    <div className="text-xs text-zinc-500">2 matched</div>
                    <div className="mt-2 space-y-1">
                      <div className="px-2 py-1 bg-zinc-50 rounded text-xs text-zinc-600">John Smith</div>
                      <div className="px-2 py-1 bg-zinc-50 rounded text-xs text-zinc-600">Sarah Johnson</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>✅</span>
                      <span className="font-medium text-sm">Tasks</span>
                    </div>
                    <div className="text-xs text-zinc-500">5 items</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📅</span>
                      <span className="font-medium text-sm">Meetings</span>
                    </div>
                    <div className="text-xs text-zinc-500">3 scheduled</div>
                  </div>
                </div>
              </div>

              {/* Person Context */}
              <div className="p-4 border-b border-zinc-100 bg-orange-50/30">
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="w-6 text-center text-zinc-300">│</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">ITEM CONTEXT</span>
                  <span className="text-zinc-700">Alex Kim (CEO)</span>
                </div>
                <div className="ml-9 bg-white p-4 rounded-lg border border-zinc-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center text-xl">
                      👨‍💼
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-zinc-900">Alex Kim</div>
                      <div className="text-xs text-zinc-500 mb-3">TechStart CEO - AI Hiring Platform</div>
                      <div className="grid md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="font-medium text-zinc-700 mb-1">Background</div>
                          <div className="text-zinc-500">• Google 5 years</div>
                          <div className="text-zinc-500">• Stanford MBA</div>
                        </div>
                        <div>
                          <div className="font-medium text-zinc-700 mb-1">Skills</div>
                          <div className="text-zinc-500">• AI/ML</div>
                          <div className="text-zinc-500">• Product Management</div>
                        </div>
                        <div>
                          <div className="font-medium text-zinc-700 mb-1">Notes</div>
                          <div className="text-zinc-500 italic">"Strong technical founder, good market fit"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Context */}
              <div className="p-4 bg-cyan-50/30">
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="w-6 text-center text-zinc-300">│</span>
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">MEETING CONTEXT</span>
                  <span className="text-zinc-700">Mentor Session with Alex</span>
                </div>
                <div className="ml-9 bg-white p-4 rounded-lg border border-zinc-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <div className="font-semibold text-zinc-900">Mentor Session</div>
                      <div className="text-xs text-zinc-500">Jan 15, 2025 - 2:00 PM</div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-zinc-50 p-2 rounded">
                      <div className="font-medium text-zinc-700 mb-1">📝 Agenda</div>
                      <div className="text-zinc-500">1. Review pitch deck</div>
                      <div className="text-zinc-500">2. Fundraising strategy</div>
                      <div className="text-zinc-500">3. Q&A with mentor</div>
                    </div>
                    <div className="bg-zinc-50 p-2 rounded">
                      <div className="font-medium text-zinc-700 mb-1">✅ Action Items</div>
                      <div className="text-zinc-500">• Update financial model</div>
                      <div className="text-zinc-500">• Schedule investor intro</div>
                    </div>
                    <div className="bg-zinc-50 p-2 rounded">
                      <div className="font-medium text-zinc-700 mb-1">📄 Notes</div>
                      <div className="text-zinc-500 italic">"Focus on enterprise sales, defer consumer market..."</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Visualization Types */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">8 Visualization Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📝', name: 'List', desc: 'Simple hierarchies' },
            { icon: '🧠', name: 'Mindmap', desc: 'Brainstorming' },
            { icon: '📋', name: 'Kanban', desc: 'Workflows' },
            { icon: '🔲', name: 'Grid', desc: 'Grouped cards' },
            { icon: '🔀', name: 'Flow', desc: 'Processes' },
            { icon: '📊', name: 'Table', desc: 'Data & sorting' },
            { icon: '📅', name: 'Gantt', desc: 'Timelines' },
            { icon: '🎨', name: 'Canvas', desc: 'Freeform' },
          ].map((view) => (
            <div key={view.name} className="bg-white p-4 rounded-xl border border-zinc-200 text-center hover:border-zinc-300 hover:shadow-sm transition-all">
              <div className="text-3xl mb-2">{view.icon}</div>
              <div className="font-medium text-zinc-900">{view.name}</div>
              <div className="text-xs text-zinc-500">{view.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-zinc-200">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="font-semibold text-zinc-900 mb-2">Flexible Structure</h3>
            <p className="text-sm text-zinc-600">Define your own objects - Investors, Startups, Tasks, Meetings. Each project can have different structures.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-zinc-200">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-zinc-900 mb-2">Multi-level Context</h3>
            <p className="text-sm text-zinc-600">From project overview to individual meeting notes. Every level can have its own context and visualizations.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-zinc-200">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-zinc-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-zinc-600">Chat to create and update context. AI helps organize information and suggests connections.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">See It In Action</h2>
        <p className="text-zinc-600 mb-8">Explore the demo with real data</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <span>Try the Demo</span>
          <span>→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-zinc-500">
          Context OS - Organize, visualize, and never lose context.
        </div>
      </footer>
    </div>
  );
}
