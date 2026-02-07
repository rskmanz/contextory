'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ObjectType, ObjectItem as ObjectItemType, Workspace, Project } from '@/types';

interface ObjectItemProps {
  object: ObjectType;
  items: ObjectItemType[];
  workspaces: Workspace[];
  projects?: Project[];
  expanded?: boolean;
  onToggleExpand?: () => void;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ObjectItem: React.FC<ObjectItemProps> = ({
  object,
  items,
  workspaces,
  projects = [],
  expanded = false,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const router = useRouter();
  const objectItems = items.filter(i => i.objectId === object.id);

  const handleCardClick = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  const handleItemClick = (item: ObjectItemType) => {
    const proj = item.projectId ? projects.find(p => p.id === item.projectId) : null;
    if (proj) {
      router.push(`/${proj.workspaceId}/${proj.id}?item=${item.id}`);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden group hover:border-zinc-300 hover:shadow-sm transition-all">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Expand/collapse chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-zinc-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span className="text-lg">{object.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-800 truncate">{object.name}</span>
          </div>
          <div className="text-xs text-zinc-400">{objectItems.length} items</div>
        </div>
        <div className="flex items-center gap-1">
          {(onEdit || onDelete || onSelect) && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onSelect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(); }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded"
                  title="Focus view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                  </svg>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded items list */}
      {expanded && objectItems.length > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2 space-y-1">
          {objectItems.slice(0, 5).map((item) => {
            const proj = item.projectId ? projects.find(p => p.id === item.projectId) : null;
            const ws = proj ? workspaces.find(w => w.id === proj.workspaceId) : null;
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 cursor-pointer transition-colors"
              >
                <span className="text-xs">{object.icon}</span>
                <span className="text-xs text-zinc-700 truncate flex-1">{item.name}</span>
                {ws && (
                  <span className="text-[10px] text-zinc-400 truncate">
                    {proj?.name} / {ws.name}
                  </span>
                )}
              </div>
            );
          })}
          {objectItems.length > 5 && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
              className="w-full text-xs text-zinc-500 hover:text-zinc-700 py-1"
            >
              +{objectItems.length - 5} more...
            </button>
          )}
          {objectItems.length === 0 && (
            <div className="text-xs text-zinc-400 py-1">No items</div>
          )}
        </div>
      )}

      {expanded && objectItems.length === 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2">
          <div className="text-xs text-zinc-400">No items</div>
        </div>
      )}
    </div>
  );
};
