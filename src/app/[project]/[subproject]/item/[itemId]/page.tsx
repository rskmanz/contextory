'use client';

import React, { useState, useEffect } from 'react';
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
import { FloatingChat } from '@/components/ai/FloatingChat';
import { useStore } from '@/lib/store';
import { Context, ContextType, VIEW_STYLES, ViewStyle, DEFAULT_VIEW_STYLE } from '@/types';

export default function ItemContextPage() {
  const params = useParams();
  const router = useRouter();
  const { project, subproject, itemId } = params as { project: string; subproject: string; itemId: string };

  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const objects = useStore((state) => state.objects);
  const items = useStore((state) => state.items);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const updateItemContextType = useStore((state) => state.updateItemContextType);

  const [contextType, setContextType] = useState<ContextType>('tree');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProject = projects.find((p) => p.id === project);
  const currentWorkspace = workspaces.find((w) => w.id === subproject);
  const currentItem = items.find((i) => i.id === itemId);
  const currentObject = currentItem ? objects.find((o) => o.id === currentItem.objectId) : null;

  // Initialize context type from item data
  useEffect(() => {
    if (currentItem?.contextData?.type) {
      setContextType(currentItem.contextData.type);
    }
  }, [currentItem?.contextData?.type]);

  // Convert item to Context-like object for view components
  const itemAsContext: Context | null = currentItem && currentObject ? {
    id: currentItem.id,
    name: currentItem.name,
    icon: currentObject.icon,
    type: currentItem.contextData?.type || 'tree',
    viewStyle: currentItem.contextData?.viewStyle || DEFAULT_VIEW_STYLE[currentItem.contextData?.type || 'tree'],
    scope: 'local',
    projectId: project,
    workspaceId: currentItem.workspaceId || subproject,
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

  const renderView = () => {
    if (!itemAsContext) return null;

    const { type, viewStyle } = itemAsContext;

    // Tree views
    if (type === 'tree') {
      if (viewStyle === 'mindmap') {
        return <MindmapView context={itemAsContext} isItemContext itemId={itemId} />;
      }
      return <ListView context={itemAsContext} isItemContext itemId={itemId} />;
    }

    // Board views
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

    // Canvas view
    return <FreeformView context={itemAsContext} isItemContext itemId={itemId} />;
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

  if (!currentProject || !currentWorkspace || !currentItem || !currentObject) {
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
            {/* Back button */}
            <button
              onClick={() => router.push(`/${project}/${subproject}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
              title="Back to workspace"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            {/* Home */}
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
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                {
                  label: currentProject.name,
                  icon: currentProject.icon,
                  href: `/${project}/${subproject}`,
                },
                {
                  label: currentWorkspace.name,
                  icon: currentWorkspace.categoryIcon,
                  href: `/${project}/${subproject}`,
                },
                {
                  label: currentObject.name,
                  icon: currentObject.icon,
                },
                {
                  label: currentItem.name,
                  icon: currentObject.icon,
                },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Context type switcher */}
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

            {/* View style switcher */}
            {getAvailableStyles().length > 1 && (
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

            {/* Settings */}
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

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-white">
          {renderView()}
        </div>
      </div>

      {/* Floating AI Chat */}
      <FloatingChat
        project={currentProject}
        workspace={currentWorkspace}
        object={currentObject}
        item={currentItem}
      />
    </div>
  );
}
