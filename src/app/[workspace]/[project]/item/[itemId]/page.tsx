'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ListView } from '@/components/views/ListView';
import { MindmapView } from '@/components/views/MindmapView';
import { KanbanView } from '@/components/views/KanbanView';
import { GridView } from '@/components/views/GridView';
import { FreeformView } from '@/components/views/FreeformView';
import { FlowView } from '@/components/views/FlowView';
import { TableView } from '@/components/views/TableView';
import { GanttView } from '@/components/views/GanttView';
import { TiptapEditor } from '@/components/editor';
import { FieldValueCell } from '@/components/fields';
import { useStore } from '@/lib/store';
import { Context, ContextType, VIEW_STYLES, ViewStyle, DEFAULT_VIEW_STYLE, ItemViewLayout, FieldValue } from '@/types';

export default function ItemContextPage() {
  const params = useParams();
  const router = useRouter();
  const { workspace, project, itemId } = params as { workspace: string; project: string; itemId: string };

  const workspaces = useStore((state) => state.workspaces);
  const projects = useStore((state) => state.projects);
  const objects = useStore((state) => state.objects);
  const items = useStore((state) => state.items);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const updateItemContextType = useStore((state) => state.updateItemContextType);
  const updateItem = useStore((state) => state.updateItem);
  const updateItemFieldValue = useStore((state) => state.updateItemFieldValue);

  const [contextType, setContextType] = useState<ContextType>('tree');
  const [viewLayout, setViewLayout] = useState<ItemViewLayout>('visualization');
  const [activeTab, setActiveTab] = useState<'markdown' | 'visualization'>('visualization');
  const [markdown, setMarkdown] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentWorkspace = workspaces.find((p) => p.id === workspace);
  const currentProject = projects.find((w) => w.id === project);
  const currentItem = items.find((i) => i.id === itemId);
  const currentObject = currentItem ? objects.find((o) => o.id === currentItem.objectId) : null;

  // Initialize from item data
  useEffect(() => {
    if (currentItem?.contextData?.type) {
      setContextType(currentItem.contextData.type);
    }
    if (currentItem?.viewLayout) {
      setViewLayout(currentItem.viewLayout);
    }
  }, [currentItem?.contextData?.type, currentItem?.viewLayout]);

  // Load markdown
  useEffect(() => {
    if (currentItem?.markdownId) {
      fetch(`/api/markdown?id=${currentItem.markdownId}&type=items`)
        .then((res) => res.json())
        .then((data) => setMarkdown(data.content || ''));
    } else {
      setMarkdown('');
    }
  }, [currentItem?.id, currentItem?.markdownId]);

  const handleSaveMarkdown = useCallback(async () => {
    if (!currentItem) return;
    setIsSaving(true);
    try {
      const markdownId = currentItem.markdownId || currentItem.id;
      await fetch('/api/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: markdownId, type: 'items', content: markdown }),
      });
      if (!currentItem.markdownId) {
        await updateItem(currentItem.id, { markdownId });
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentItem, markdown, updateItem]);

  const handleLayoutChange = async (layout: ItemViewLayout) => {
    setViewLayout(layout);
    if (currentItem) {
      await updateItem(currentItem.id, { viewLayout: layout });
    }
  };

  // Convert item to Context-like object for view components
  const itemAsContext: Context | null = currentItem && currentObject ? {
    id: currentItem.id,
    name: currentItem.name,
    icon: currentObject.icon,
    type: currentItem.contextData?.type || 'tree',
    viewStyle: currentItem.contextData?.viewStyle || DEFAULT_VIEW_STYLE[currentItem.contextData?.type || 'tree'],
    scope: 'project',
    workspaceId: workspace,
    projectId: currentItem.projectId || project,
    data: {
      nodes: currentItem.contextData?.nodes || [],
      edges: currentItem.contextData?.edges,
    },
  } : null;

  const handleViewStyleChange = async (style: ViewStyle) => {
    if (currentItem) {
      await updateItemContextType(currentItem.id, contextType, style);
    }
  };

  const handleContextTypeChange = async (type: ContextType) => {
    setContextType(type);
    const defaultStyle = DEFAULT_VIEW_STYLE[type];
    if (currentItem) {
      await updateItemContextType(currentItem.id, type, defaultStyle);
    }
  };

  const getAvailableStyles = () => {
    return VIEW_STYLES[contextType] as readonly string[];
  };

  const renderVisualization = () => {
    if (!itemAsContext) return null;

    const { type, viewStyle } = itemAsContext;

    if (type === 'tree') {
      if (viewStyle === 'mindmap') {
        return <MindmapView context={itemAsContext} isItemContext itemId={itemId} />;
      }
      return <ListView context={itemAsContext} isItemContext itemId={itemId} />;
    }

    if (type === 'board') {
      if (viewStyle === 'kanban') {
        return <KanbanView context={itemAsContext} isItemContext itemId={itemId} />;
      }
      if (viewStyle === 'flow') {
        return <FlowView context={itemAsContext} isItemContext itemId={itemId} />;
      }
      if (viewStyle === 'table') {
        return <TableView context={itemAsContext} isItemContext itemId={itemId} />;
      }
      if (viewStyle === 'gantt') {
        return <GanttView context={itemAsContext} isItemContext itemId={itemId} />;
      }
      return <GridView context={itemAsContext} isItemContext itemId={itemId} />;
    }

    return <FreeformView context={itemAsContext} isItemContext itemId={itemId} />;
  };

  const renderMarkdownPanel = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-3 border-b border-zinc-200">
        <h3 className="text-sm font-medium text-zinc-700">Notes</h3>
        <button
          onClick={handleSaveMarkdown}
          disabled={isSaving}
          className="text-xs px-2 py-1 rounded text-zinc-500 hover:bg-zinc-100"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <TiptapEditor
          content={markdown}
          onChange={setMarkdown}
          onSave={handleSaveMarkdown}
          placeholder="Add notes..."
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewLayout) {
      case 'side-by-side':
        return (
          <div className="flex h-full">
            <div className="w-80 border-r border-zinc-200 flex-shrink-0">
              {renderMarkdownPanel()}
            </div>
            <div className="flex-1 overflow-hidden">
              {renderVisualization()}
            </div>
          </div>
        );
      case 'tabs':
        return (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-zinc-200 px-4">
              <button
                onClick={() => setActiveTab('visualization')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'visualization'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Visualization
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'markdown'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Notes
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'visualization' ? renderVisualization() : renderMarkdownPanel()}
            </div>
          </div>
        );
      case 'stacked':
        return (
          <div className="flex flex-col h-full overflow-auto">
            <div className="h-64 border-b border-zinc-200 flex-shrink-0">
              {renderMarkdownPanel()}
            </div>
            <div className="flex-1 min-h-[400px]">
              {renderVisualization()}
            </div>
          </div>
        );
      case 'markdown':
        return renderMarkdownPanel();
      default: // 'visualization'
        return renderVisualization();
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace || !currentProject || !currentItem || !currentObject) {
    return (
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Item not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-zinc-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${workspace}/${project}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Back to project"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <Link
              href="/"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </Link>
            <Breadcrumb
              items={[
                { label: currentWorkspace.name, icon: currentWorkspace.icon, href: `/${workspace}/${project}` },
                { label: currentProject.name, icon: currentProject.categoryIcon, href: `/${workspace}/${project}` },
                { label: currentObject.name, icon: currentObject.icon },
                { label: currentItem.name, icon: currentObject.icon },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Layout switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
              {[
                { value: 'visualization', icon: '📊', title: 'Visualization only' },
                { value: 'markdown', icon: '📝', title: 'Notes only' },
                { value: 'side-by-side', icon: '◫', title: 'Side by side' },
                { value: 'tabs', icon: '▭', title: 'Tabs' },
                { value: 'stacked', icon: '▤', title: 'Stacked' },
              ].map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => handleLayoutChange(layout.value as ItemViewLayout)}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                    viewLayout === layout.value
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:bg-white/50'
                  }`}
                  title={layout.title}
                >
                  <span className="text-xs">{layout.icon}</span>
                </button>
              ))}
            </div>

            {/* Context type switcher - only show when visualization is visible */}
            {viewLayout !== 'markdown' && (
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                {(['tree', 'board', 'canvas'] as ContextType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleContextTypeChange(type)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                      contextType === type
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:bg-white/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* View style switcher */}
            {viewLayout !== 'markdown' && getAvailableStyles().length > 1 && (
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                {getAvailableStyles().map((style) => (
                  <button
                    key={style}
                    onClick={() => handleViewStyleChange(style as ViewStyle)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                      itemAsContext?.viewStyle === style
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:bg-white/50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}

            <Link
              href="/settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </Link>
          </div>
        </div>

        {/* Properties */}
        {currentObject?.fields && currentObject.fields.length > 0 && currentItem && (
          <div className="border-b border-zinc-100 px-6 py-3 bg-white">
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
              {currentObject.fields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-28 flex-shrink-0 truncate">{field.name}</span>
                  <div className="flex-1 min-w-0">
                    <FieldValueCell
                      field={field}
                      value={currentItem.fieldValues?.[field.id] ?? null}
                      onChange={(val: FieldValue) => updateItemFieldValue(currentItem.id, field.id, val)}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-white">
          {renderContent()}
        </div>
      </div>

    </div>
  );
}
