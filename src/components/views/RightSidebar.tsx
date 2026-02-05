'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Workspace, Resource, Project, Context, ObjectType, ObjectItem } from '@/types';
import { useStore } from '@/lib/store';

interface RightSidebarProps {
  workspace: Workspace;
  project?: Project;
  context?: Context;
  object?: ObjectType;
  item?: ObjectItem;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Try to extract hostname safely
const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

// Detect if input looks like a URL
const isUrl = (str: string): boolean => {
  return /^(https?:\/\/|www\.)/.test(str.trim());
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  workspace,
  project,
  context,
  object,
  item,
}) => {
  const updateWorkspace = useStore((state) => state.updateWorkspace);
  const aiSettings = useStore((state) => state.aiSettings);

  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const feedEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resources = workspace.resources || [];

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  // Quick add resource from URL
  const handleQuickAddResource = async (url: string, name?: string) => {
    const hostname = getHostname(url);
    const resourceName = name || hostname || url;

    const newResource: Resource = {
      id: generateId(),
      name: resourceName,
      url: url.startsWith('http') ? url : `https://${url}`,
    };

    await updateWorkspace(workspace.id, {
      resources: [...resources, newResource],
    });
  };

  const handleDeleteResource = async (resourceId: string) => {
    await updateWorkspace(workspace.id, {
      resources: resources.filter((r) => r.id !== resourceId),
    });
  };

  // Handle paste - auto-detect URLs
  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (isUrl(text)) {
      e.preventDefault();
      await handleQuickAddResource(text.trim());
      setInput('');
    }
  };

  // Handle drag and drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const text = e.dataTransfer.getData('text');
    if (text && isUrl(text)) {
      await handleQuickAddResource(text.trim());
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();

    // Check if it's a URL - add as resource instead
    if (isUrl(userMessage)) {
      await handleQuickAddResource(userMessage);
      setInput('');
      return;
    }

    setInput('');

    const userMsg = { id: generateId(), role: 'user' as const, content: userMessage };
    setChatMessages(prev => [...prev, userMsg]);

    if (!aiSettings?.apiKey) {
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Set API key in settings.' }]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: {
            workspace: workspace.name,
            project: project?.name,
            resources: resources.map(r => r.name),
          },
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: data.message || 'Error' }]);
    } catch {
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Connection error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  // Summarize resource content using AI
  const handleSummarizeResource = async (resource: Resource) => {
    if (!aiSettings?.apiKey) {
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Set API key in settings to summarize.' }]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Summarize this resource: "${resource.name}"${resource.url ? ` (${resource.url})` : ''}. Give a brief summary of what this resource is about and key points.` }],
          context: { workspace: workspace.name, project: project?.name },
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: data.message || 'Could not summarize.' }]);
    } catch {
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Error summarizing resource.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add resource to current context
  const handleAddToContext = (resource: Resource) => {
    // This would add the resource as a node to the current context
    setChatMessages(prev => [...prev, {
      id: generateId(),
      role: 'assistant',
      content: `Added "${resource.name}" to context. You can now reference it in your mindmap or list.`
    }]);
  };

  // Resource suggestions based on context
  const getResourceSuggestions = () => {
    const suggestions = [];

    if (project?.name) {
      suggestions.push(
        { icon: '📋', label: 'Project docs', query: `${project.name} documentation` },
        { icon: '🔧', label: 'Related tools', query: `${project.name} tools` },
      );
    }

    if (context?.name) {
      suggestions.push(
        { icon: '📚', label: 'Learn more', query: `${context.name} guide` },
      );
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        { icon: '📝', label: 'Note', query: '' },
        { icon: '🔗', label: 'Link', query: '' },
        { icon: '📎', label: 'Reference', query: '' },
      );
    }

    return suggestions;
  };

  const handleSuggestionClick = async (suggestion: { icon: string; label: string; query: string }) => {
    if (suggestion.query) {
      // Could trigger a web search or AI query
      const userMsg = { id: generateId(), role: 'user' as const, content: `Find resources about: ${suggestion.query}` };
      setChatMessages(prev => [...prev, userMsg]);

      if (aiSettings?.apiKey) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [userMsg].map(m => ({ role: m.role, content: m.content })),
              context: { workspace: workspace.name, project: project?.name },
            }),
          });
          const data = await response.json();
          setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: data.message || 'No suggestions found.' }]);
        } catch {
          setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Error finding resources.' }]);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Just add an empty resource of that type
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className={`w-80 border-l flex flex-col h-full transition-colors ${
        isDragOver
          ? 'border-blue-300 bg-blue-50/30'
          : 'border-zinc-100 bg-zinc-50/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Unified Feed */}
      <div className="flex-1 flex flex-col min-h-0 p-4 overflow-auto">
        {/* Resources - with action options */}
        {resources.length > 0 && (
          <div className="space-y-2 mb-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="group bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Resource header */}
                <div
                  onClick={() => handleResourceClick(resource)}
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                    {resource.url ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 truncate">{resource.name}</p>
                    {resource.url && (
                      <p className="text-[10px] text-zinc-400 truncate">{getHostname(resource.url)}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteResource(resource.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Action buttons - always visible */}
                <div className="flex border-t border-zinc-100 divide-x divide-zinc-100">
                  <button
                    onClick={() => handleSummarizeResource(resource)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Summarize
                  </button>
                  <button
                    onClick={() => handleAddToContext(resource)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Add to Context
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resource Suggestions */}
        {resources.length === 0 && chatMessages.length === 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Quick Add</p>
            <div className="flex flex-wrap gap-1.5">
              {getResourceSuggestions().map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                >
                  <span>{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 space-y-3">
          {chatMessages.length === 0 && resources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p className="text-sm text-zinc-500 mb-1">Paste a link or ask AI</p>
              <p className="text-xs text-zinc-400">Resources can be summarized into context</p>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-zinc-900 text-white ml-8'
                  : 'bg-white border border-zinc-100 text-zinc-700 mr-4 shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-1.5 p-3 mr-4">
              <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </div>
          )}

          <div ref={feedEndRef} />
        </div>
      </div>

      {/* Unified Input */}
      <div className="p-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-zinc-200 focus-within:border-zinc-300 focus-within:shadow-md transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onPaste={handlePaste}
            placeholder="Ask or paste a link..."
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-zinc-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
