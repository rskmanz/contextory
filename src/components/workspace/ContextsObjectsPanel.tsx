'use client';

import React from 'react';
import { Context, ObjectType, ObjectItem, Project } from '@/types';

type ActiveTab = { type: 'context'; id: string } | { type: 'object'; id: string } | { type: 'item'; id: string };

interface ContextsObjectsPanelProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  viewLevel: 'global' | 'workspace' | 'project';
  activeTab: ActiveTab | null;
  setActiveTab: (tab: ActiveTab | null) => void;
  filteredContexts: Context[];
  contextViewScope: 'workspace' | 'project';
  setContextViewScope: (scope: 'workspace' | 'project') => void;
  onQuickCreateContext: () => void;
  onEditContext: (ctx: Context) => void;
  onDeleteContext: (ctx: Context) => void;
  filteredObjects: ObjectType[];
  objectViewScope: 'workspace' | 'project';
  setObjectViewScope: (scope: 'workspace' | 'project') => void;
  onAddObject: () => void;
  onEditObject: (obj: ObjectType) => void;
  onRemoveObject: (obj: ObjectType) => void;
  items: ObjectItem[];
  projects: Project[];
  workspace: string;
  project: string;
  onUpdateItem: (id: string, data: Partial<ObjectItem>) => Promise<void>;
  onDeleteItem: (item: ObjectItem) => void;
}

export function ContextsObjectsPanel({
  isOpen,
  onToggle,
  viewLevel,
  activeTab,
  setActiveTab,
  filteredContexts,
  contextViewScope,
  setContextViewScope,
  onQuickCreateContext,
  onEditContext,
  onDeleteContext,
  filteredObjects,
  objectViewScope,
  setObjectViewScope,
  onAddObject,
  onEditObject,
  onRemoveObject,
  items,
  projects,
  workspace,
  project,
  onUpdateItem,
  onDeleteItem,
}: ContextsObjectsPanelProps) {
  const [isContextsExpanded, setIsContextsExpanded] = React.useState(true);
  const [isObjectsExpanded, setIsObjectsExpanded] = React.useState(true);
  const [expandedObjects, setExpandedObjects] = React.useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editItemName, setEditItemName] = React.useState('');

  const toggleObjectExpand = (objId: string) => {
    setExpandedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(objId)) {
        next.delete(objId);
      } else {
        next.add(objId);
      }
      return next;
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => onToggle(true)}
        className="w-8 bg-white border-r border-zinc-100 flex flex-col items-center pt-3 hover:bg-zinc-50 transition-colors"
        title="Show contexts & objects"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    );
  }

  return (
    <div className="w-56 bg-white border-r border-zinc-100 flex flex-col overflow-hidden">
      <div className="px-2 pt-2 flex justify-end">
        <button
          onClick={() => onToggle(false)}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-100 transition-colors"
          title="Hide contexts & objects"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        {viewLevel === 'project' && (
          <ContextsList
            isExpanded={isContextsExpanded}
            onToggleExpanded={() => setIsContextsExpanded(!isContextsExpanded)}
            contexts={filteredContexts}
            contextViewScope={contextViewScope}
            setContextViewScope={setContextViewScope}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onQuickCreate={onQuickCreateContext}
            onEdit={onEditContext}
            onDelete={onDeleteContext}
          />
        )}

        <ObjectsList
          isExpanded={isObjectsExpanded}
          onToggleExpanded={() => setIsObjectsExpanded(!isObjectsExpanded)}
          objects={filteredObjects}
          objectViewScope={objectViewScope}
          setObjectViewScope={setObjectViewScope}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          expandedObjects={expandedObjects}
          toggleObjectExpand={toggleObjectExpand}
          items={items}
          projects={projects}
          workspace={workspace}
          project={project}
          editingItemId={editingItemId}
          setEditingItemId={setEditingItemId}
          editItemName={editItemName}
          setEditItemName={setEditItemName}
          onAddObject={onAddObject}
          onEditObject={onEditObject}
          onRemoveObject={onRemoveObject}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </div>
  );
}

// --- Contexts List ---

function ContextsList({
  isExpanded,
  onToggleExpanded,
  contexts,
  contextViewScope,
  setContextViewScope,
  activeTab,
  setActiveTab,
  onQuickCreate,
  onEdit,
  onDelete,
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  contexts: Context[];
  contextViewScope: 'workspace' | 'project';
  setContextViewScope: (scope: 'workspace' | 'project') => void;
  activeTab: ActiveTab | null;
  setActiveTab: (tab: ActiveTab | null) => void;
  onQuickCreate: () => void;
  onEdit: (ctx: Context) => void;
  onDelete: (ctx: Context) => void;
}) {
  return (
    <div className="px-3 mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-2 flex-1 text-left hover:bg-zinc-50 rounded-lg py-1 px-1 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Contexts</span>
        </button>
        <button
          onClick={onQuickCreate}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      {isExpanded && (
        <>
          <div className="flex items-center gap-1 mb-2 bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setContextViewScope('workspace')}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                contextViewScope === 'workspace'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setContextViewScope('project')}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                contextViewScope === 'project'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Project
            </button>
          </div>
          <div className="space-y-1">
            {contexts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2 text-center">No contexts</p>
            ) : (
              contexts.map((ctx) => (
                <div
                  key={ctx.id}
                  onClick={() => setActiveTab({ type: 'context', id: ctx.id })}
                  onDoubleClick={() => onEdit(ctx)}
                  className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab?.type === 'context' && activeTab.id === ctx.id
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-sm">{ctx.icon}</span>
                  <span className="flex-1 text-left truncate">{ctx.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ctx); }}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Objects List ---

function ObjectsList({
  isExpanded,
  onToggleExpanded,
  objects,
  objectViewScope,
  setObjectViewScope,
  activeTab,
  setActiveTab,
  expandedObjects,
  toggleObjectExpand,
  items,
  projects,
  workspace,
  project,
  editingItemId,
  setEditingItemId,
  editItemName,
  setEditItemName,
  onAddObject,
  onEditObject,
  onRemoveObject,
  onUpdateItem,
  onDeleteItem,
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  objects: ObjectType[];
  objectViewScope: 'workspace' | 'project';
  setObjectViewScope: (scope: 'workspace' | 'project') => void;
  activeTab: ActiveTab | null;
  setActiveTab: (tab: ActiveTab | null) => void;
  expandedObjects: Set<string>;
  toggleObjectExpand: (id: string) => void;
  items: ObjectItem[];
  projects: Project[];
  workspace: string;
  project: string;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  editItemName: string;
  setEditItemName: (name: string) => void;
  onAddObject: () => void;
  onEditObject: (obj: ObjectType) => void;
  onRemoveObject: (obj: ObjectType) => void;
  onUpdateItem: (id: string, data: Partial<ObjectItem>) => Promise<void>;
  onDeleteItem: (item: ObjectItem) => void;
}) {
  return (
    <div className="px-3">
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-2 flex-1 text-left hover:bg-zinc-50 rounded-lg py-1 px-1 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Objects</span>
        </button>
        <button
          onClick={onAddObject}
          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex items-center gap-1 mb-2 bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setObjectViewScope('workspace')}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                objectViewScope === 'workspace'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setObjectViewScope('project')}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                objectViewScope === 'project'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Project
            </button>
          </div>
          <div className="space-y-0.5">
            {objects.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2 text-center">No objects</p>
            ) : (
              objects.map((obj) => {
                const objectItems = items.filter((i) => {
                  if (i.objectId !== obj.id) return false;
                  if (objectViewScope === 'project') {
                    return i.projectId === project;
                  }
                  const proj = projects.find(p => p.id === i.projectId);
                  return proj?.workspaceId === workspace;
                });
                const isObjExpanded = expandedObjects.has(obj.id);
                return (
                  <ObjectSidebarItem
                    key={obj.id}
                    obj={obj}
                    objectItems={objectItems}
                    isExpanded={isObjExpanded}
                    toggleExpand={() => toggleObjectExpand(obj.id)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    editingItemId={editingItemId}
                    setEditingItemId={setEditingItemId}
                    editItemName={editItemName}
                    setEditItemName={setEditItemName}
                    onEditObject={onEditObject}
                    onRemoveObject={onRemoveObject}
                    onUpdateItem={onUpdateItem}
                    onDeleteItem={onDeleteItem}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Object Sidebar Item ---

function ObjectSidebarItem({
  obj,
  objectItems,
  isExpanded,
  toggleExpand,
  activeTab,
  setActiveTab,
  editingItemId,
  setEditingItemId,
  editItemName,
  setEditItemName,
  onEditObject,
  onRemoveObject,
  onUpdateItem,
  onDeleteItem,
}: {
  obj: ObjectType;
  objectItems: ObjectItem[];
  isExpanded: boolean;
  toggleExpand: () => void;
  activeTab: ActiveTab | null;
  setActiveTab: (tab: ActiveTab | null) => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  editItemName: string;
  setEditItemName: (name: string) => void;
  onEditObject: (obj: ObjectType) => void;
  onRemoveObject: (obj: ObjectType) => void;
  onUpdateItem: (id: string, data: Partial<ObjectItem>) => Promise<void>;
  onDeleteItem: (item: ObjectItem) => void;
}) {
  return (
    <div>
      <div
        className={`group w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab?.type === 'object' && activeTab.id === obj.id
            ? 'bg-zinc-100 text-zinc-900'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
          className="flex-shrink-0 p-0.5 hover:bg-zinc-200 rounded transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => setActiveTab({ type: 'object', id: obj.id })}
          onDoubleClick={() => onEditObject(obj)}
        >
          <span className="text-sm">{obj.icon}</span>
          <span className="flex-1 text-left truncate">{obj.name}</span>
        </div>
        <span className="text-[10px] text-zinc-400 tabular-nums">{objectItems.length}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemoveObject(obj); }}
          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
          title="Remove from this project"
        >
          &times;
        </button>
      </div>
      {isExpanded && objectItems.length > 0 && (
        <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5 space-y-0.5">
          {objectItems.map((item) => (
            <ItemSidebarRow
              key={item.id}
              item={item}
              objIcon={obj.icon}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              editingItemId={editingItemId}
              setEditingItemId={setEditingItemId}
              editItemName={editItemName}
              setEditItemName={setEditItemName}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
      {isExpanded && objectItems.length === 0 && (
        <div className="ml-5 pl-2 border-l border-zinc-200 mt-0.5">
          <p className="text-[11px] text-zinc-400 py-1.5 px-2">No items</p>
        </div>
      )}
    </div>
  );
}

// --- Item Sidebar Row ---

function ItemSidebarRow({
  item,
  objIcon,
  activeTab,
  setActiveTab,
  editingItemId,
  setEditingItemId,
  editItemName,
  setEditItemName,
  onUpdateItem,
  onDeleteItem,
}: {
  item: ObjectItem;
  objIcon: string;
  activeTab: ActiveTab | null;
  setActiveTab: (tab: ActiveTab | null) => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  editItemName: string;
  setEditItemName: (name: string) => void;
  onUpdateItem: (id: string, data: Partial<ObjectItem>) => Promise<void>;
  onDeleteItem: (item: ObjectItem) => void;
}) {
  const finishEdit = async () => {
    if (editItemName.trim() && editItemName !== item.name) {
      await onUpdateItem(item.id, { name: editItemName.trim() });
    }
    setEditingItemId(null);
    setEditItemName('');
  };

  return (
    <div
      draggable={editingItemId !== item.id}
      onDragStart={(e) => {
        if (editingItemId === item.id) { e.preventDefault(); return; }
        e.dataTransfer.setData('application/json', JSON.stringify({
          itemId: item.id,
          itemName: item.name,
          objectIcon: objIcon,
        }));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer ${
        activeTab?.type === 'item' && activeTab.id === item.id
          ? 'bg-zinc-100 text-zinc-900 font-medium'
          : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
      }`}
      onClick={() => { if (editingItemId !== item.id) setActiveTab({ type: 'item', id: item.id }); }}
      onDoubleClick={() => { setEditingItemId(item.id); setEditItemName(item.name); }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0"></span>
      {editingItemId === item.id ? (
        <input
          type="text"
          value={editItemName}
          onChange={(e) => setEditItemName(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') await finishEdit();
            if (e.key === 'Escape') { setEditingItemId(null); setEditItemName(''); }
          }}
          className="flex-1 bg-white border border-blue-400 rounded px-1 py-0.5 text-xs outline-none"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="truncate flex-1">{item.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteItem(item); }}
            className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            &times;
          </button>
        </>
      )}
    </div>
  );
}
