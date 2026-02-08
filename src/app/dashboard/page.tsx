'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { AddObjectModal } from '@/components/modals/AddObjectModal';
import { AddWorkspaceModal } from '@/components/modals/AddWorkspaceModal';
import { EditWorkspaceModal } from '@/components/modals/EditWorkspaceModal';
import { EditObjectModal } from '@/components/modals/EditObjectModal';
import { WorkspacesTab, ObjectsTab, ContextsTab, PinnedObjectTab } from '@/components/home';
import type { GroupByOption } from '@/components/home';
import { useStore } from '@/lib/store';
import { useModalState } from '@/hooks/useModalState';
import { useGroupedObjects, useGroupedContexts, useObjectGroups, useContextGroups, useSelectedObjectItems } from '@/hooks/useGroupedData';
import { Project, ObjectType, Workspace } from '@/types';

type ModalName =
  | 'addProject'
  | 'editProject'
  | 'deleteProject'
  | 'addObject'
  | 'editObject'
  | 'deleteObject'
  | 'addWorkspace'
  | 'editWorkspace'
  | 'deleteWorkspace';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('workspaces');
  const [groupBy, setGroupBy] = useState<GroupByOption[]>(['scope']);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [workspaceFilter, setWorkspaceFilter] = useState<string>('all');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [globalDropdownOpen, setGlobalDropdownOpen] = useState(false);
  const [isAddTabOpen, setIsAddTabOpen] = useState(false);

  const modal = useModalState<ModalName>();

  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const objects = useStore((state) => state.objects);
  const contexts = useStore((state) => state.contexts);
  const items = useStore((state) => state.items);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const deleteProject = useStore((state) => state.deleteProject);
  const deleteWorkspace = useStore((state) => state.deleteWorkspace);
  const updateProject = useStore((state) => state.updateProject);
  const updateWorkspace = useStore((state) => state.updateWorkspace);
  const deleteObject = useStore((state) => state.deleteObject);
  const pinnedObjectTabs = useStore((state) => state.pinnedObjectTabs);
  const pinObjectTab = useStore((state) => state.pinObjectTab);
  const unpinObjectTab = useStore((state) => state.unpinObjectTab);
  const updateObject = useStore((state) => state.updateObject);
  const addItem = useStore((state) => state.addItem);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedObjects = useGroupedObjects(objects, projects, workspaces, projectFilter, workspaceFilter, objectFilter);
  const groupedContexts = useGroupedContexts(contexts, projects, workspaces, projectFilter, workspaceFilter);
  const objectGroups = useObjectGroups(groupedObjects, groupBy, projects, workspaces);
  const contextGroups = useContextGroups(groupedContexts, groupBy, projects, workspaces);
  const selectedObject = objectFilter !== 'all' ? objects.find(o => o.id === objectFilter) ?? null : null;
  const selectedObjectItems = useSelectedObjectItems(selectedObject, items, workspaces, projects, groupBy, projectFilter);

  const projectCategories = Array.from(new Set(projects.map(p => p.category).filter((c): c is string => c !== undefined)));

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      ) : (
        <div className="flex-1 h-screen overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10">
            <div className="border-b border-zinc-100 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-900 bg-zinc-100"
                  title="Home"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
                  title="Search"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                >
                  <span>🌐</span>
                  <span>Global</span>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setGlobalDropdownOpen(!globalDropdownOpen)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    <span>/</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`opacity-50 transition-transform ${globalDropdownOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {globalDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setGlobalDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 min-w-[200px] max-h-80 overflow-y-auto py-1">
                        {workspaces.map((w) => {
                          const firstProj = projects.find(p => p.workspaceId === w.id);
                          return (
                            <button
                              key={w.id}
                              onClick={() => {
                                setGlobalDropdownOpen(false);
                                if (firstProj) {
                                  router.push(`/${w.id}/${firstProj.id}`);
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            >
                              <span>{w.icon}</span>
                              <span>{w.name}</span>
                            </button>
                          );
                        })}
                        {workspaces.length === 0 && (
                          <div className="px-3 py-2 text-xs text-zinc-400">No workspaces yet</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Link
                href="/settings"
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </Link>
            </div>
            {/* Sub-navigation */}
            <div className="border-b border-zinc-100 px-4">
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => setActiveTab('workspaces')}
                  className={`py-3 px-3 text-sm font-medium -mb-px ${
                    activeTab === 'workspaces'
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Workspaces
                </button>
                <button
                  onClick={() => setActiveTab('objects')}
                  className={`py-3 px-3 text-sm font-medium -mb-px ${
                    activeTab === 'objects'
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Objects
                </button>
                <button
                  onClick={() => setActiveTab('contexts')}
                  className={`py-3 px-3 text-sm font-medium -mb-px ${
                    activeTab === 'contexts'
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Contexts
                </button>
                {/* Pinned Object Tabs */}
                {pinnedObjectTabs.map((objectId) => {
                  const obj = objects.find((o) => o.id === objectId);
                  if (!obj) return null;
                  return (
                    <div key={objectId} className="relative group">
                      <button
                        onClick={() => setActiveTab(objectId)}
                        className={`py-3 px-3 text-sm font-medium -mb-px flex items-center gap-1.5 ${
                          activeTab === objectId
                            ? 'text-zinc-900 border-b-2 border-zinc-900'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        <span>{obj.icon}</span>
                        <span>{obj.name}</span>
                      </button>
                      <button
                        onClick={() => unpinObjectTab(objectId)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-200 hover:bg-red-100 text-zinc-500 hover:text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Unpin tab"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {/* Add tab button */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsAddTabOpen(!isAddTabOpen)}
                    className="py-3 px-2 text-zinc-400 hover:text-zinc-600 -mb-px"
                    title="Add tab"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  {isAddTabOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAddTabOpen(false)} />
                      <div className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                        <div className="px-3 py-1.5 text-xs text-zinc-400 font-medium">Pin object as tab</div>
                        {objects.filter((o) => !pinnedObjectTabs.includes(o.id)).map((obj) => (
                          <button
                            key={obj.id}
                            onClick={() => {
                              pinObjectTab(obj.id);
                              setIsAddTabOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                          >
                            <span>{obj.icon}</span>
                            <span>{obj.name}</span>
                          </button>
                        ))}
                        {objects.filter((o) => !pinnedObjectTabs.includes(o.id)).length === 0 && (
                          <div className="px-3 py-2 text-xs text-zinc-400">All objects pinned</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            <div className="mx-auto max-w-[1600px]">
              {activeTab === 'workspaces' && (
                <WorkspacesTab
                  projects={workspaces}
                  workspaces={projects}
                  groupBy={groupBy}
                  onGroupByChange={setGroupBy}
                  onAddProject={() => modal.open('addProject')}
                  onEditProject={(project) => modal.open('editProject', project)}
                  onDeleteProject={(project) => modal.open('deleteProject', project)}
                  onAddWorkspace={(projectId) => modal.open('addWorkspace', projectId)}
                  onEditWorkspace={(workspace) => modal.open('editWorkspace', workspace)}
                  onDeleteWorkspace={(workspace) => modal.open('deleteWorkspace', workspace)}
                  updateProject={updateWorkspace as (id: string, data: Partial<Workspace>) => Promise<void>}
                />
              )}

              {pinnedObjectTabs.includes(activeTab) && (
                <PinnedObjectTab
                  objectId={activeTab}
                  objects={objects}
                  items={items}
                  projects={projects}
                  workspaces={workspaces}
                  addItem={addItem}
                />
              )}

              {activeTab === 'objects' && (
                <ObjectsTab
                  objects={objects}
                  items={items}
                  projects={projects}
                  workspaces={workspaces}
                  groupBy={groupBy}
                  onGroupByChange={setGroupBy}
                  projectFilter={projectFilter}
                  workspaceFilter={workspaceFilter}
                  onProjectFilterChange={setProjectFilter}
                  onWorkspaceFilterChange={setWorkspaceFilter}
                  objectFilter={objectFilter}
                  onObjectFilterChange={setObjectFilter}
                  groupedObjects={groupedObjects}
                  objectGroups={objectGroups}
                  selectedObject={selectedObject}
                  selectedObjectItems={selectedObjectItems}
                  pinnedObjectTabs={pinnedObjectTabs}
                  onPinObject={pinObjectTab}
                  onUnpinObject={unpinObjectTab}
                  onAddObject={() => modal.open('addObject')}
                  onEditObject={(obj) => modal.open('editObject', obj)}
                  onDeleteObject={(obj) => modal.open('deleteObject', obj)}
                  updateObject={updateObject}
                />
              )}

              {activeTab === 'contexts' && (
                <ContextsTab
                  groupBy={groupBy}
                  onGroupByChange={setGroupBy}
                  groupedContexts={groupedContexts}
                  contextGroups={contextGroups}
                  projects={projects}
                  workspaces={workspaces}
                  projectFilter={projectFilter}
                  workspaceFilter={workspaceFilter}
                  onProjectFilterChange={setProjectFilter}
                  onWorkspaceFilterChange={setWorkspaceFilter}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProjectModal
        isOpen={modal.isOpen('addProject')}
        onClose={modal.close}
        defaultCategory={projectCategories.length > 0 ? projectCategories[0] : ''}
        existingCategories={projectCategories}
      />

      <EditWorkspaceModal
        isOpen={modal.isOpen('editProject')}
        onClose={modal.close}
        workspace={modal.getData<Workspace>()}
      />

      <DeleteConfirmModal
        isOpen={modal.isOpen('deleteProject')}
        onClose={modal.close}
        onConfirm={async () => {
          const ws = modal.getData<Workspace>();
          if (ws) {
            await deleteWorkspace(ws.id);
            modal.close();
          }
        }}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${modal.getData<Workspace>()?.name}"? This will also delete all associated projects.`}
      />

      <AddObjectModal
        isOpen={modal.isOpen('addObject')}
        onClose={modal.close}
        projectId={null}
        workspaceId={null}
        defaultScope="global"
        allowedScopes={['global', 'workspace', 'project']}
      />

      <EditObjectModal
        isOpen={modal.isOpen('editObject')}
        onClose={modal.close}
        object={modal.getData<ObjectType>()}
      />

      <DeleteConfirmModal
        isOpen={modal.isOpen('deleteObject')}
        onClose={modal.close}
        onConfirm={async () => {
          const obj = modal.getData<ObjectType>();
          if (obj) {
            await deleteObject(obj.id);
            modal.close();
          }
        }}
        title="Delete Object"
        message={`Are you sure you want to delete "${modal.getData<ObjectType>()?.name}"? This will also delete all items of this type.`}
      />

      <AddWorkspaceModal
        isOpen={modal.isOpen('addWorkspace')}
        onClose={modal.close}
        workspaceId={modal.getData<string>() || undefined}
      />

      <EditProjectModal
        isOpen={modal.isOpen('editWorkspace')}
        onClose={modal.close}
        project={modal.getData<Project>()}
      />

      <DeleteConfirmModal
        isOpen={modal.isOpen('deleteWorkspace')}
        onClose={modal.close}
        onConfirm={async () => {
          const proj = modal.getData<Project>();
          if (proj) {
            await deleteProject(proj.id);
            modal.close();
          }
        }}
        title="Delete Project"
        message={`Are you sure you want to delete "${modal.getData<Project>()?.name}"? This will also delete all items in this project.`}
      />
    </div>
  );
}
