'use client';

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Workspace, Project, Resource, ObjectType, ObjectItem, Context } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { streamChat } from '@/lib/stream-chat';
import { ChatMarkdown } from '@/components/chat/ChatMarkdown';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ActionLogEntry {
  id: string;
  type: 'object' | 'context' | 'item';
  name: string;
  icon: string;
  timestamp: string;
}

interface ChatPanelProps {
  workspace: Workspace;
  project?: Project;
  resources: Resource[];
  object?: ObjectType;
  item?: ObjectItem;
  context?: Context;
  onUrlPasted?: (url: string) => void;
  onActionsCreated?: (entries: ActionLogEntry[]) => void;
}

export interface ChatPanelHandle {
  sendAnalysis: (message: string) => void;
  runAnalysis: (params: {
    resources: Array<{ name: string; content?: string; summary?: string; url?: string }>;
    workspaceId: string;
    projectId?: string;
  }) => void;
}

const isUrl = (str: string): boolean => /^(https?:\/\/|www\.)/.test(str.trim());

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(({
  workspace,
  project,
  resources,
  object,
  item,
  context,
  onUrlPasted,
  onActionsCreated,
}, ref) => {
  const aiSettings = useStore((s) => s.aiSettings);
  const connections = useStore((s) => s.connections);

  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocContent, setCurrentDocContent] = useState('');

  // Fetch current document markdown when item/context changes
  useEffect(() => {
    const markdownId = item?.markdownId || context?.markdownId;
    const markdownType = item?.markdownId ? 'items' : 'contexts';
    if (!markdownId) {
      // Fallback: serialize context nodes if available
      const nodesText = context?.data?.nodes?.length
        ? context.data.nodes.map((n: { content: string }) => n.content).join('\n')
        : '';
      setCurrentDocContent(nodesText);
      return;
    }
    fetch(`/api/markdown?id=${markdownId}&type=${markdownType}`)
      .then(res => res.json())
      .then(json => setCurrentDocContent(json.data?.content || ''))
      .catch(() => setCurrentDocContent(''));
  }, [item?.markdownId, context?.markdownId, context?.data?.nodes]);

  const currentDocName = item?.name || context?.name;
  const resourcesWithContent = resources.filter(r => r.content).length;
  const totalSources = resourcesWithContent + (currentDocContent ? 1 : 0);

  const feedEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const buildSystemPrompt = useCallback(() => {
    const connSummary = connections
      .filter((c) =>
        c.scope === 'global' ||
        (c.scope === 'workspace' && c.workspaceId === workspace.id) ||
        (c.scope === 'project' && project && c.projectId === project.id)
      )
      .map((c) => `${c.name} (${c.type}, ${c.scope})`)
      .join(', ');

    const loadedResources = resources.filter(r => r.content);
    const resourceList = loadedResources.length > 0
      ? loadedResources.map(r => `- ${r.name}${r.url ? ` (${r.url})` : ''}`).join('\n')
      : 'none';

    const currentDocSection = currentDocContent && currentDocName
      ? `\n\nCurrent document "${currentDocName}":\n${currentDocContent.slice(0, 4000)}`
      : '';

    return `You are Contextory assistant for workspace "${workspace.name}"${
      project ? ` > project "${project.name}"` : ''
    }.
${currentDocName ? `\nCurrently viewing: "${currentDocName}"` : ''}

Loaded sources (full content is provided below in the conversation):
${resourceList}
${currentDocSection}

Connections: ${connSummary || 'none'}.

When the user asks you to analyze or summarize, use the source content already provided — do NOT try to fetch or call tools to retrieve it. The content is already included.
When the user asks you to create, list, update, or delete data, use the available tools.
Be concise and direct.`;
  }, [workspace, project, resources, connections, currentDocContent, currentDocName]);

  const buildRequestBody = useCallback((
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    enableTools = true
  ) => {
    const allResources = [
      ...resources.filter(r => r.content).map(r => ({
        name: r.name,
        content: r.content,
        summary: r.summary,
        url: r.url,
      })),
      ...(currentDocContent && currentDocName
        ? [{ name: currentDocName, content: currentDocContent }]
        : []),
    ];
    return {
      messages,
      systemPrompt,
      provider: aiSettings.provider || 'openai',
      model: aiSettings.model,
      apiKey: aiSettings.apiKey,
      enableTools,
      resources: allResources,
    };
  }, [aiSettings, resources, currentDocContent, currentDocName]);

  const handleSendMessage = async (userMessage: string, allMessages: ChatMsg[]) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const systemPrompt = buildSystemPrompt();
      const apiMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
      const requestBody = buildRequestBody(apiMessages, systemPrompt);

      const assistantMsgId = generateId();
      setChatMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant' as const, content: '' }]);

      const actionEntries: ActionLogEntry[] = [];

      await streamChat(requestBody, {
        onDelta: (text) => {
          setChatMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, content: m.content + text } : m)
          );
          feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        onToolCalls: () => {
          // LangGraph handles tool execution server-side, no client action needed
        },
        onToolResult: (toolName, output) => {
          try {
            const parsed = JSON.parse(output);
            if (parsed && typeof parsed === 'object' && 'id' in parsed && 'name' in parsed) {
              const type = toolName.includes('object') ? 'object' as const
                : toolName.includes('context') ? 'context' as const
                : 'item' as const;
              actionEntries.push({
                id: parsed.id,
                type,
                name: parsed.name,
                icon: '\u2728',
                timestamp: new Date().toISOString(),
              });
            }
          } catch {
            // Non-JSON tool output, skip action logging
          }
        },
        onDone: () => {
          if (actionEntries.length > 0 && onActionsCreated) {
            onActionsCreated(actionEntries);
          }
        },
        onError: (error) => {
          setChatMessages(prev =>
            prev.map(m => m.id === assistantMsgId
              ? { ...m, content: m.content ? m.content + '\n\nError: ' + error : error }
              : m)
          );
        },
      }, controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Connection error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendSuggestion = (message: string) => {
    if (isLoading) return;
    setExpanded(true);
    const userMsg = { id: generateId(), role: 'user' as const, content: message };
    setChatMessages(prev => [...prev, userMsg]);
    handleSendMessage(message, [...chatMessagesRef.current, userMsg]);
  };

  const runAnalysis = useCallback(async (params: {
    resources: Array<{ name: string; content?: string; summary?: string; url?: string }>;
    workspaceId: string;
    projectId?: string;
  }) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExpanded(true);
    setIsLoading(true);

    const assistantMsgId = generateId();
    setChatMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant' as const, content: '' }]);

    const actionEntries: ActionLogEntry[] = [];
    let stepMessages: string[] = [];

    try {
      const requestBody = {
        resources: params.resources,
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        provider: aiSettings.provider || 'openai',
        model: aiSettings.model,
        apiKey: aiSettings.apiKey,
      };

      await streamChat(requestBody, {
        onStep: (step, message) => {
          stepMessages = [...stepMessages, message];
          setChatMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, content: stepMessages.join('\n') } : m)
          );
          feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        onSuggestions: (suggestions) => {
          const msg = `\nFound ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''} to create.\n`;
          stepMessages = [...stepMessages, msg];
          setChatMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, content: stepMessages.join('\n') } : m)
          );
        },
        onDelta: (text) => {
          stepMessages = [...stepMessages, `\n${text}`];
          setChatMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, content: stepMessages.join('\n') } : m)
          );
          feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        onToolCalls: () => {},
        onToolResult: (toolName, output) => {
          try {
            const parsed = JSON.parse(output);
            if (parsed && typeof parsed === 'object' && 'id' in parsed && 'name' in parsed) {
              const type = toolName.includes('object') ? 'object' as const
                : toolName.includes('context') ? 'context' as const
                : 'item' as const;
              actionEntries.push({
                id: parsed.id,
                type,
                name: parsed.name,
                icon: '\u2728',
                timestamp: new Date().toISOString(),
              });
            }
          } catch { /* skip */ }
        },
        onDone: () => {
          if (actionEntries.length > 0 && onActionsCreated) {
            onActionsCreated(actionEntries);
          }
        },
        onError: (error) => {
          stepMessages = [...stepMessages, `\nError: ${error}`];
          setChatMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, content: stepMessages.join('\n') } : m)
          );
        },
      }, controller.signal, '/api/analyze');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setChatMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Analysis failed.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [aiSettings, onActionsCreated]);

  useImperativeHandle(ref, () => ({
    sendAnalysis: sendSuggestion,
    runAnalysis,
  }));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();

    if (isUrl(userMessage) && onUrlPasted) {
      onUrlPasted(userMessage);
      setInput('');
      return;
    }

    setInput('');
    setExpanded(true);
    const userMsg = { id: generateId(), role: 'user' as const, content: userMessage };
    setChatMessages(prev => [...prev, userMsg]);
    await handleSendMessage(userMessage, [...chatMessagesRef.current, userMsg]);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (isUrl(text) && onUrlPasted) {
      e.preventDefault();
      onUrlPasted(text.trim());
      setInput('');
    }
  };

  return (
    <div className="border-t border-zinc-200 bg-white">
      {/* Expanded chat feed */}
      {expanded && (
        <div className="max-h-[350px] overflow-y-auto border-b border-zinc-100">
          <div className="p-3 space-y-2">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-[11px] text-zinc-500">Ask AI anything</p>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`text-[11px] p-2 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white ml-6'
                    : 'bg-zinc-50 border border-zinc-100 text-zinc-700 mr-4'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ChatMarkdown content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            ))}

            {isLoading && (() => {
              const lastMsg = chatMessages[chatMessages.length - 1];
              const isStreaming = lastMsg?.role === 'assistant' && lastMsg.content.length > 0;
              if (isStreaming) return null;
              return (
                <div className="flex items-center gap-1 p-2 mr-4">
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              );
            })()}

            <div ref={feedEndRef} />
          </div>

          {/* Suggestion chips */}
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {resources.length >= 1 && (
              <button
                onClick={() => sendSuggestion('Summarize all my resources and extract key insights')}
                className="px-2 py-0.5 bg-white border border-zinc-200 rounded-full text-[10px] text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                Summarize sources
              </button>
            )}
            {item && (
              <button
                onClick={() => sendSuggestion(`Analyze the item "${item.name}" and suggest improvements`)}
                className="px-2 py-0.5 bg-white border border-zinc-200 rounded-full text-[10px] text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                Analyze item
              </button>
            )}
            {context && (
              <button
                onClick={() => sendSuggestion(`Review the context "${context.name}" and suggest new nodes`)}
                className="px-2 py-0.5 bg-white border border-zinc-200 rounded-full text-[10px] text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                Improve context
              </button>
            )}
            <button
              onClick={() => sendSuggestion('What can you help me with?')}
              className="px-2 py-0.5 bg-white border border-zinc-200 rounded-full text-[10px] text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              What can you do?
            </button>
          </div>
        </div>
      )}

      {/* Resource indicator */}
      {totalSources > 0 && (
        <div
          className="px-3 py-1 flex items-center gap-1 text-[9px] text-zinc-400"
          title={[
            ...(currentDocName && currentDocContent ? [currentDocName] : []),
            ...resources.filter(r => r.content).map(r => r.name),
          ].join(', ')}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          <span>{totalSources} source{totalSources !== 1 ? 's' : ''} connected</span>
        </div>
      )}

      {/* Chat input bar (always visible) */}
      <div className="flex items-center gap-1.5 p-2">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all shrink-0"
          title={expanded ? 'Minimize chat' : 'Expand chat'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {expanded ? (
              <polyline points="6 9 12 15 18 9" />
            ) : (
              <polyline points="18 15 12 9 6 15" />
            )}
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-zinc-50 rounded-xl border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onPaste={handlePaste}
            onFocus={() => { if (chatMessages.length > 0) setExpanded(true); }}
            placeholder={totalSources > 0 ? `Ask about ${totalSources} source${totalSources !== 1 ? 's' : ''}...` : 'Ask AI...'}
            className="flex-1 text-[11px] bg-transparent outline-none placeholder:text-zinc-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-6 h-6 flex items-center justify-center bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-all shrink-0"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
