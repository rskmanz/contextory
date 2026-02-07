'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ObjectType, ObjectItem as ObjectItemType, Context, Project, Workspace } from '@/types';
import { FilterDropdown, ObjectItem, ScopeColumnsView, GroupByTabs, GroupedView } from '@/components/home';
import type { GroupByOption } from '@/components/home';
import { ObjectTableView } from '@/components/views/ObjectTableView';
import { ObjectListView } from '@/components/views/ObjectListView';
import { ViewToggle } from '@/components/shared/ViewToggle';

interface GroupedByScope<T> {
  global: T[];
  byProject: Record<string, T[]>;
  byWorkspace: Record<string, T[]>;
}

interface ObjectsTabProps {
  objects: ObjectType[];
  items: ObjectItemType[];
  projects: Project[];
  workspaces: Workspace[];
  groupBy: GroupByOption[];
  onGroupByChange: (value: GroupByOption[]) => void;
  projectFilter: string;
  workspaceFilter: string;
  onProjectFilterChange: (value: string) => void;
  onWorkspaceFilterChange: (value: string) => void;
  objectFilter: string;
  onObjectFilterChange: (value: string) => void;
  groupedObjects: GroupedByScope<ObjectType>;
  objectGroups: Record<string, ObjectType[]>;
  selectedObject: ObjectType | null;
  selectedObjectItems: Record<string, ObjectItemType[]>;
  pinnedObjectTabs: string[];
  onPinObject: (id: string) => void;
  onUnpinObject: (id: string) => void;
  onAddObject: () => void;
  onEditObject: (obj: ObjectType) => void;
  onDeleteObject: (obj: ObjectType) => void;
  updateObject: (id: string, data: Partial<ObjectType>) => Promise<void>;
}

export const ObjectsTab: React.FC<ObjectsTabProps> = ({
  objects,
  items,
  projects,
  workspaces,
  groupBy,
  onGroupByChange,
  projectFilter,
  workspaceFilter,
  onProjectFilterChange,
  onWorkspaceFilterChange,
  objectFilter,
  onObjectFilterChange,
  groupedObjects,
  objectGroups,
  selectedObject,
  selectedObjectItems,
  pinnedObjectTabs,
  onPinObject,
  onUnpinObject,
  onAddObject,
  onEditObject,
  onDeleteObject,
  updateObject,
}) => {
  const router = useRouter();
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [objectDisplayMode, setObjectDisplayMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);

  const navigateToItem = (itemId: string) => {
    const clickedItem = items.find(i => i.id === itemId);
    const proj = clickedItem?.projectId ? projects.find(p => p.id === clickedItem.projectId) : null;
    if (proj) router.push(`/${proj.workspaceId}/${proj.id}?item=${itemId}`);
  };

  return (
    <div className="space-y-6">
      {/* Object sub-tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-zinc-100">
        <button
          onClick={() => onObjectFilterChange('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
            objectFilter === 'all'
              ? 'bg-zinc-100 text-zinc-900'
              : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          All
        </button>
        {objects.map((obj) => {
          const isPinned = pinnedObjectTabs.includes(obj.id);
          return (
            <div key={obj.id} className="relative group flex items-center">
              <button
                onClick={() => onObjectFilterChange(obj.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  objectFilter === obj.id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>{obj.icon}</span>
                <span>{obj.name}</span>
              </button>
              <button
                onClick={() => isPinned ? onUnpinObject(obj.id) : onPinObject(obj.id)}
                className={`ml-1 w-5 h-5 flex items-center justify-center rounded text-xs transition-all ${
                  isPinned
                    ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                    : 'text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 opacity-0 group-hover:opacity-100'
                }`}
                title={isPinned ? 'Unpin from tabs' : 'Pin as tab'}
              >
                📌
              </button>
            </div>
          );
        })}
      </div>

      {/* Header row: Add, Project filter, Group by */}
      <div className="flex items-center gap-4">
        <button
          onClick={onAddObject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add</span>
        </button>
        <FilterDropdown
          value={projectFilter}
          options={projects.map(p => ({ id: p.id, label: p.name, icon: p.categoryIcon || '📁' }))}
          allLabel="All Workspaces"
          onChange={onProjectFilterChange}
        />
        <GroupByTabs value={groupBy} onChange={onGroupByChange} />
      </div>

      {/* Show items when specific object selected, otherwise show objects */}
      {selectedObject ? (
        <SelectedObjectView
          selectedObject={selectedObject}
          items={items}
          projects={projects}
          workspaces={workspaces}
          objectDisplayMode={objectDisplayMode}
          onDisplayModeChange={setObjectDisplayMode}
          availabilityExpanded={availabilityExpanded}
          onAvailabilityToggle={() => setAvailabilityExpanded(!availabilityExpanded)}
          selectedObjectItems={selectedObjectItems}
          onObjectFilterChange={onObjectFilterChange}
          onItemClick={navigateToItem}
          updateObject={updateObject}
        />
      ) : (
        groupBy.includes('scope') ? (
          <ScopeColumnsView<ObjectType>
            data={groupedObjects}
            renderItem={(obj) => (
              <ObjectItem
                object={obj}
                items={items}
                workspaces={workspaces}
                projects={projects}
                expanded={expandedObjects.has(obj.id)}
                onToggleExpand={() => setExpandedObjects(prev => {
                  const next = new Set(prev);
                  if (next.has(obj.id)) next.delete(obj.id);
                  else next.add(obj.id);
                  return next;
                })}
                onSelect={() => onObjectFilterChange(obj.id)}
                onEdit={() => onEditObject(obj)}
                onDelete={() => onDeleteObject(obj)}
              />
            )}
            getItemId={(obj) => obj.id}
            projects={projects}
            workspaces={workspaces}
            projectFilter={projectFilter}
            workspaceFilter={workspaceFilter}
            onProjectFilterChange={onProjectFilterChange}
            onWorkspaceFilterChange={onWorkspaceFilterChange}
            emptyMessages={{
              global: 'No global objects',
              project: 'No workspace objects',
              workspace: 'No project objects',
            }}
          />
        ) : (
          <GroupedView<ObjectType>
            groups={objectGroups}
            renderItem={(obj) => (
              <ObjectItem
                object={obj}
                items={items}
                workspaces={workspaces}
                projects={projects}
                expanded={expandedObjects.has(obj.id)}
                onToggleExpand={() => setExpandedObjects(prev => {
                  const next = new Set(prev);
                  if (next.has(obj.id)) next.delete(obj.id);
                  else next.add(obj.id);
                  return next;
                })}
                onSelect={() => onObjectFilterChange(obj.id)}
                onEdit={() => onEditObject(obj)}
                onDelete={() => onDeleteObject(obj)}
              />
            )}
            getItemId={(obj) => obj.id}
            emptyMessage="No objects"
          />
        )
      )}
    </div>
  );
};

/* Sub-component for the selected object detail view */
interface SelectedObjectViewProps {
  selectedObject: ObjectType;
  items: ObjectItemType[];
  projects: Project[];
  workspaces: Workspace[];
  objectDisplayMode: 'grid' | 'list' | 'table';
  onDisplayModeChange: (mode: 'grid' | 'list' | 'table') => void;
  availabilityExpanded: boolean;
  onAvailabilityToggle: () => void;
  selectedObjectItems: Record<string, ObjectItemType[]>;
  onObjectFilterChange: (value: string) => void;
  onItemClick: (itemId: string) => void;
  updateObject: (id: string, data: Partial<ObjectType>) => Promise<void>;
}

const SelectedObjectView: React.FC<SelectedObjectViewProps> = ({
  selectedObject,
  items,
  projects,
  workspaces,
  objectDisplayMode,
  onDisplayModeChange,
  availabilityExpanded,
  onAvailabilityToggle,
  selectedObjectItems,
  onObjectFilterChange,
  onItemClick,
  updateObject,
}) => {
  const router = useRouter();
  const objectItems = items.filter(i => i.objectId === selectedObject.id);

  return (
    <div className="space-y-6">
      {/* Object header with availability toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="text-xl">{selectedObject.icon}</span>
          <h2 className="text-lg font-semibold text-zinc-900">{selectedObject.name}</h2>
          <span className="text-sm text-zinc-400">
            {objectItems.length} items
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle mode={objectDisplayMode} onChange={onDisplayModeChange} />
          <button
            onClick={() => onObjectFilterChange('all')}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Back to all
          </button>
        </div>
      </div>

      {/* Where to use (collapsible) */}
      <div className="bg-zinc-50 rounded-lg overflow-hidden">
        <button
          onClick={onAvailabilityToggle}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <span>Where to use</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-zinc-400 transition-transform ${availabilityExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {availabilityExpanded && (
          <div className="px-4 pb-4 pt-1 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedObject.availableGlobal}
                onChange={(e) => updateObject(selectedObject.id, { availableGlobal: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <span className="text-sm">🌐 Home</span>
            </label>

            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Workspaces</span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedObject.availableInProjects.includes('*') || selectedObject.availableInProjects.includes(p.id)}
                      onChange={(e) => {
                        const current = selectedObject.availableInProjects.filter(id => id !== '*');
                        const updated = e.target.checked
                          ? [...current, p.id]
                          : current.filter(id => id !== p.id);
                        updateObject(selectedObject.id, { availableInProjects: updated });
                      }}
                      className="rounded border-zinc-300"
                    />
                    <span className="text-sm">{p.categoryIcon || '📁'} {p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Projects</span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {workspaces.map((w) => {
                  return (
                    <label key={w.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedObject.availableInWorkspaces.includes('*') || selectedObject.availableInWorkspaces.includes(w.id)}
                        onChange={(e) => {
                          const current = selectedObject.availableInWorkspaces.filter(id => id !== '*');
                          const updated = e.target.checked
                            ? [...current, w.id]
                            : current.filter(id => id !== w.id);
                          updateObject(selectedObject.id, { availableInWorkspaces: updated });
                        }}
                        className="rounded border-zinc-300"
                      />
                      <span className="text-sm">{w.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {objectDisplayMode === 'table' ? (
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <ObjectTableView
            object={selectedObject}
            items={objectItems}
            workspaceId={workspaces[0]?.id || ''}
            onItemClick={onItemClick}
          />
        </div>
      ) : objectDisplayMode === 'list' ? (
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <ObjectListView
            object={selectedObject}
            items={objectItems}
            workspaceId={workspaces[0]?.id || ''}
            onItemClick={onItemClick}
          />
        </div>
      ) : (
        <GroupedView<ObjectItemType>
          groups={selectedObjectItems}
          renderItem={(item) => {
            const proj = item.projectId ? projects.find(p => p.id === item.projectId) : null;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (proj) router.push(`/${proj.workspaceId}/${proj.id}?item=${item.id}`);
                }}
                className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-800 truncate">{item.name}</h4>
                    {proj && (
                      <p className="text-xs text-zinc-400 mt-1 truncate">
                        {proj.name}
                      </p>
                    )}
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-300 group-hover:text-zinc-400 flex-shrink-0"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            );
          }}
          getItemId={(item) => item.id}
          emptyMessage="No items yet"
        />
      )}
    </div>
  );
};
