'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ObjectType, ObjectItem as ObjectItemType, Project, Workspace } from '@/types';
import { ObjectTableView } from '@/components/views/ObjectTableView';
import { ObjectListView } from '@/components/views/ObjectListView';
import { ViewToggle } from '@/components/shared/ViewToggle';

interface PinnedObjectTabProps {
  objectId: string;
  objects: ObjectType[];
  items: ObjectItemType[];
  projects: Project[];
  workspaces: Workspace[];
  addItem: (data: { name: string; objectId: string; projectId: string | null }) => Promise<unknown>;
}

export const PinnedObjectTab: React.FC<PinnedObjectTabProps> = ({
  objectId,
  objects,
  items,
  projects,
  workspaces,
  addItem,
}) => {
  const router = useRouter();
  const [objectDisplayMode, setObjectDisplayMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemProjectId, setNewItemProjectId] = useState<string>('');

  const pinnedObject = objects.find((o) => o.id === objectId);
  if (!pinnedObject) return null;

  const objectItems = items.filter((i) => i.objectId === objectId);

  const groupedItems: Record<string, typeof objectItems> = {};
  objectItems.forEach((item) => {
    const proj = item.projectId ? projects.find((p) => p.id === item.projectId) : null;
    const ws = proj ? workspaces.find((w) => w.id === proj.workspaceId) : null;
    const key = ws && proj ? `${ws.name} / ${proj.name}` : 'Global';
    if (!groupedItems[key]) groupedItems[key] = [];
    groupedItems[key].push(item);
  });

  const handleSubmitItem = async () => {
    if (newItemName.trim() && newItemProjectId) {
      await addItem({ name: newItemName.trim(), objectId, projectId: newItemProjectId });
      setNewItemName('');
      setIsAddingItem(false);
    }
  };

  const navigateToItem = (itemId: string) => {
    const clickedItem = objectItems.find(i => i.id === itemId);
    const proj = clickedItem?.projectId ? projects.find((p) => p.id === clickedItem.projectId) : null;
    if (proj) router.push(`/${proj.workspaceId}/${proj.id}/item/${itemId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{pinnedObject.icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{pinnedObject.name}</h2>
            <p className="text-sm text-zinc-400">{objectItems.length} items across all workspaces</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle mode={objectDisplayMode} onChange={setObjectDisplayMode} />
          {/* Add button / form */}
          {isAddingItem ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                className="px-3 py-1.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-zinc-500"
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newItemName.trim() && newItemProjectId) {
                    await handleSubmitItem();
                  }
                  if (e.key === 'Escape') {
                    setNewItemName('');
                    setIsAddingItem(false);
                  }
                }}
              />
              <select
                value={newItemProjectId}
                onChange={(e) => setNewItemProjectId(e.target.value)}
                className="px-2 py-1.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-zinc-500"
              >
                <option value="">Select project</option>
                {projects.map((proj) => {
                  const ws = workspaces.find((w) => w.id === proj.workspaceId);
                  return (
                    <option key={proj.id} value={proj.id}>
                      {ws?.name} / {proj.name}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleSubmitItem}
                disabled={!newItemName.trim() || !newItemProjectId}
                className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setNewItemName('');
                  setIsAddingItem(false);
                }}
                className="px-2 py-1.5 text-sm text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Items - table, list, or grid view */}
      {objectDisplayMode === 'table' ? (
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <ObjectTableView
            object={pinnedObject}
            items={objectItems}
            workspaceId={newItemProjectId || projects[0]?.id || ''}
            onItemClick={navigateToItem}
          />
        </div>
      ) : objectDisplayMode === 'list' ? (
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <ObjectListView
            object={pinnedObject}
            items={objectItems}
            workspaceId={newItemProjectId || projects[0]?.id || ''}
            onItemClick={navigateToItem}
          />
        </div>
      ) : Object.keys(groupedItems).length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No items yet</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([location, locationItems]) => (
            <div key={location}>
              <h3 className="text-sm font-medium text-zinc-500 mb-3">{location}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {locationItems.map((item) => {
                  const proj = item.projectId ? projects.find((p) => p.id === item.projectId) : null;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (proj) router.push(`/${proj.workspaceId}/${proj.id}/item/${item.id}`);
                      }}
                      className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{pinnedObject.icon}</span>
                        <span className="text-sm font-medium text-zinc-800 truncate">{item.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
