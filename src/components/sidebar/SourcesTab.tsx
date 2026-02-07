'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Resource, Connection, ConnectionType, CONNECTION_TYPE_INFO } from '@/types';

/* ─── Helpers ─── */

const getHostname = (url: string): string | null => {
  try { return new URL(url).hostname; } catch { return null; }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'url': return '\u{1F517}';
    case 'note': return '\u{1F4DD}';
    case 'research': return '\u{1F50D}';
    case 'file': return '\u{1F4C4}';
    default: return '\u{1F517}';
  }
};

const getWordCount = (content?: string) => {
  if (!content) return null;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  if (words === 0) return null;
  return words >= 1000 ? `${(words / 1000).toFixed(1)}k words` : `${words} words`;
};

/* ─── Props ─── */

interface SourcesTabProps {
  // Internal context
  currentDocName?: string;
  currentDocType?: 'item' | 'context';

  // Resources
  resources: Resource[];
  onAddUrl: (url: string) => Promise<void>;
  onAddNote: () => void;
  onFileUpload: () => void;
  onWebResearch: () => void;
  onResourceClick: (resource: Resource) => void;
  onSummarizeResource: (resource: Resource) => void;
  onDeleteResource: (resourceId: string) => void;
  onUpdateNote: (resourceId: string, content: string) => void;
  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;

  // Connections
  connections: Connection[];
  onAddConnection: (type: ConnectionType, name: string, url?: string) => void;
  onDeleteConnection: (id: string) => void;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({
  currentDocName,
  currentDocType,
  resources,
  onAddUrl,
  onAddNote,
  onFileUpload,
  onWebResearch,
  onResourceClick,
  onSummarizeResource,
  onDeleteResource,
  onUpdateNote,
  editingNoteId,
  setEditingNoteId,
  connections,
  onAddConnection,
  onDeleteConnection,
}) => {
  const [isResourcesCollapsed, setIsResourcesCollapsed] = useState(false);
  const [isConnectionsCollapsed, setIsConnectionsCollapsed] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [showAddConnMenu, setShowAddConnMenu] = useState(false);
  const [showConnUrlInput, setShowConnUrlInput] = useState<ConnectionType | null>(null);
  const [connUrlInput, setConnUrlInput] = useState('');
  const [connNameInput, setConnNameInput] = useState('');

  const addMenuRef = useRef<HTMLDivElement>(null);
  const addConnMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addConnMenuRef.current && !addConnMenuRef.current.contains(e.target as Node)) {
        setShowAddConnMenu(false);
      }
    };
    if (showAddConnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddConnMenu]);

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setIsFetchingUrl(true);
    await onAddUrl(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    setIsFetchingUrl(false);
  };

  const handleAddConn = (type: ConnectionType, name: string, url?: string) => {
    onAddConnection(type, name, url);
    setShowConnUrlInput(null);
    setConnUrlInput('');
    setConnNameInput('');
  };

  const contentCount = resources.filter(r => r.content).length;

  return (
    <div>
      {/* Internal Sources */}
      {currentDocName && (
        <div className="px-3 py-2.5 border-b border-zinc-100">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Internal</span>
          <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 bg-zinc-100 rounded-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-700 truncate">{currentDocName}</p>
              <p className="text-[10px] text-zinc-500 capitalize">{currentDocType}</p>
            </div>
          </div>
        </div>
      )}

      {/* External Resources */}
      <div className="border-b border-zinc-100">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={() => setIsResourcesCollapsed(v => !v)}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Resources ({resources.length})
            </span>
            {contentCount > 0 && (
              <span className="text-[9px] bg-zinc-200 text-zinc-600 rounded px-1 py-0.5">
                {contentCount} loaded
              </span>
            )}
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-zinc-400 transition-transform ${isResourcesCollapsed ? '' : 'rotate-180'}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(v => !v)}
              className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
              title="Add resource"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg border border-zinc-200 shadow-lg z-50 py-1">
                <button
                  onClick={() => { setShowAddMenu(false); setShowUrlInput(true); }}
                  className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <span className="text-xs mt-0.5">{'\u{1F517}'}</span>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700">URL / Website</p>
                    <p className="text-[9px] text-zinc-400">Fetch content from a web page</p>
                  </div>
                </button>
                <button
                  onClick={() => { setShowAddMenu(false); onAddNote(); }}
                  className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <span className="text-xs mt-0.5">{'\u{1F4DD}'}</span>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700">Note</p>
                    <p className="text-[9px] text-zinc-400">Write a text note or paste content</p>
                  </div>
                </button>
                <button
                  onClick={() => { setShowAddMenu(false); onFileUpload(); }}
                  className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <span className="text-xs mt-0.5">{'\u{1F4C4}'}</span>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700">File</p>
                    <p className="text-[9px] text-zinc-400">Upload .txt, .md, .csv, .json</p>
                  </div>
                </button>
                <button
                  onClick={() => { setShowAddMenu(false); onWebResearch(); }}
                  className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <span className="text-xs mt-0.5">{'\u{1F50D}'}</span>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700">Web Research</p>
                    <p className="text-[9px] text-zinc-400">AI searches and summarizes</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {!isResourcesCollapsed && (
          <div className="px-3 pb-3">
            {showUrlInput && (
              <div className="mb-2 flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg p-1.5">
                <input
                  autoFocus
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddUrl();
                    if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); }
                  }}
                  placeholder="https://..."
                  className="flex-1 text-[11px] px-2 py-1 bg-transparent outline-none placeholder:text-zinc-400"
                  disabled={isFetchingUrl}
                />
                {isFetchingUrl ? (
                  <span className="text-[10px] text-zinc-400 px-2">Fetching...</span>
                ) : (
                  <>
                    <button
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim()}
                      className="px-2 py-0.5 text-[10px] font-medium bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-30 transition-all"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                      className="px-1 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}

            {resources.length > 0 ? (
              <div className="space-y-1">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="group bg-white rounded-lg border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all overflow-hidden"
                  >
                    {editingNoteId === resource.id ? (
                      <div className="p-2">
                        <textarea
                          autoFocus
                          defaultValue={resource.content || ''}
                          onBlur={(e) => onUpdateNote(resource.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingNoteId(null);
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              onUpdateNote(resource.id, e.currentTarget.value);
                            }
                          }}
                          placeholder="Write your note..."
                          className="w-full text-[11px] text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-2 outline-none focus:border-zinc-300 resize-none min-h-[60px]"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => onResourceClick(resource)}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px]">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-zinc-700 truncate">{resource.name}</p>
                          <div className="flex items-center gap-1">
                            {resource.url && (
                              <p className="text-[9px] text-zinc-400 truncate">{getHostname(resource.url)}</p>
                            )}
                            {getWordCount(resource.content) && (
                              <span className="text-[9px] bg-zinc-100 text-zinc-500 rounded px-0.5 shrink-0">
                                {getWordCount(resource.content)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); onSummarizeResource(resource); }}
                            title="Summarize"
                            className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteResource(resource.id); }}
                            title="Remove"
                            className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 px-1">
                <p className="text-[10px] text-zinc-500 font-medium mb-1">Add sources for AI to reference:</p>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-zinc-400">{'\u{1F517}'} URLs & websites</p>
                  <p className="text-[9px] text-zinc-400">{'\u{1F4DD}'} Notes & text</p>
                  <p className="text-[9px] text-zinc-400">{'\u{1F4C4}'} Files (.txt, .md, .csv, .json)</p>
                  <p className="text-[9px] text-zinc-400">{'\u{1F50D}'} AI web research</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connections */}
      <div className="border-b border-zinc-100">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={() => setIsConnectionsCollapsed(v => !v)}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Connections ({connections.length})
            </span>
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-zinc-400 transition-transform ${isConnectionsCollapsed ? '' : 'rotate-180'}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="relative" ref={addConnMenuRef}>
            <button
              onClick={() => setShowAddConnMenu(v => !v)}
              className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
              title="Add connection"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {showAddConnMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg border border-zinc-200 shadow-lg z-50 py-1">
                {(Object.entries(CONNECTION_TYPE_INFO) as [ConnectionType, { label: string; icon: string }][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => {
                        setShowAddConnMenu(false);
                        setShowConnUrlInput(type);
                        setConnNameInput(info.label);
                      }}
                      className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <span className="text-xs mt-0.5">{info.icon}</span>
                      <div>
                        <p className="text-[11px] font-medium text-zinc-700">{info.label}</p>
                        <p className="text-[9px] text-zinc-400">
                          {type === 'custom' ? 'Any external service' : `Connect to ${info.label}`}
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {!isConnectionsCollapsed && (
          <div className="px-3 pb-3">
            {showConnUrlInput && (
              <div className="mb-2 bg-white border border-zinc-200 rounded-lg p-2 space-y-1">
                <input
                  autoFocus
                  type="text"
                  value={connNameInput}
                  onChange={(e) => setConnNameInput(e.target.value)}
                  placeholder="Connection name..."
                  className="w-full text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300 placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  value={connUrlInput}
                  onChange={(e) => setConnUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && connNameInput.trim()) {
                      handleAddConn(showConnUrlInput, connNameInput.trim(), connUrlInput.trim() || undefined);
                    }
                    if (e.key === 'Escape') {
                      setShowConnUrlInput(null);
                      setConnUrlInput('');
                      setConnNameInput('');
                    }
                  }}
                  placeholder="https://... (optional)"
                  className="w-full text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300 placeholder:text-zinc-400"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (connNameInput.trim()) {
                        handleAddConn(showConnUrlInput, connNameInput.trim(), connUrlInput.trim() || undefined);
                      }
                    }}
                    disabled={!connNameInput.trim()}
                    className="px-2 py-0.5 text-[10px] font-medium bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-30 transition-all"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowConnUrlInput(null); setConnUrlInput(''); setConnNameInput(''); }}
                    className="px-1 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-600"
                  >
                    Cancel
                  </button>
                  <span className="text-[9px] text-zinc-400 ml-auto">
                    {CONNECTION_TYPE_INFO[showConnUrlInput]?.icon} {CONNECTION_TYPE_INFO[showConnUrlInput]?.label}
                  </span>
                </div>
              </div>
            )}

            {connections.length > 0 ? (
              <div className="space-y-1">
                {connections.map((conn) => {
                  const info = CONNECTION_TYPE_INFO[conn.type];
                  return (
                    <div
                      key={conn.id}
                      className="group bg-white rounded-lg border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all overflow-hidden"
                    >
                      <div
                        onClick={() => conn.url && window.open(conn.url, '_blank')}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px]">
                          {conn.icon || info?.icon || '\u{1F517}'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-zinc-700 truncate">{conn.name}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-[9px] text-zinc-400 truncate">{info?.label || conn.type}</p>
                            <span className="text-[8px] bg-zinc-100 text-zinc-500 rounded px-0.5 shrink-0 capitalize">
                              {conn.scope}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteConnection(conn.id); }}
                            title="Remove"
                            className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !showConnUrlInput ? (
              <div className="py-2 px-1">
                <p className="text-[10px] text-zinc-500 font-medium mb-1">Link external tools:</p>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-zinc-400">{'\u{1F419}'} GitHub repos</p>
                  <p className="text-[9px] text-zinc-400">{'\u{1F4DD}'} Notion pages</p>
                  <p className="text-[9px] text-zinc-400">{'\u{1F4AC}'} Slack channels</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
