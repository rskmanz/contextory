'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Project, Workspace, Context, ObjectType, ObjectItem, ContextNode, AIToolCall, PendingToolCall } from '@/types';
import { buildContextPrompt, formatContextBadge, parseSuggestedNodes } from '@/lib/ai';
import { ChatMessage } from './ChatMessage';
import { TOOLS_REQUIRING_CONFIRMATION } from '@/lib/ai-tools';

interface FloatingChatProps {
  project?: Project;
  workspace?: Workspace;
  context?: Context;
  object?: ObjectType;
  item?: ObjectItem;
  onApplyNodes?: (nodes: ContextNode[]) => void;
}

export function FloatingChat({
  project,
  workspace,
  context: selectedContext,
  object,
  item,
  onApplyNodes,
}: FloatingChatProps) {
  const [input, setInput] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<PendingToolCall | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isChatOpen = useStore((state) => state.isChatOpen);
  const isChatExpanded = useStore((state) => state.isChatExpanded);
  const isChatLoading = useStore((state) => state.isChatLoading);
  const aiSettings = useStore((state) => state.aiSettings);
  const setChatOpen = useStore((state) => state.setChatOpen);
  const setChatExpanded = useStore((state) => state.setChatExpanded);
  const setChatLoading = useStore((state) => state.setChatLoading);
  const addChatMessage = useStore((state) => state.addChatMessage);
  const getChatMessages = useStore((state) => state.getChatMessages);
  const clearChatMessages = useStore((state) => state.clearChatMessages);

  // Store operations for tool execution
  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const objects = useStore((state) => state.objects);
  const items = useStore((state) => state.items);
  const contexts = useStore((state) => state.contexts);
  const addProject = useStore((state) => state.addProject);
  const updateProject = useStore((state) => state.updateProject);
  const deleteProject = useStore((state) => state.deleteProject);
  const addWorkspace = useStore((state) => state.addWorkspace);
  const updateWorkspace = useStore((state) => state.updateWorkspace);
  const deleteWorkspace = useStore((state) => state.deleteWorkspace);
  const addGlobalObject = useStore((state) => state.addGlobalObject);
  const addProjectObject = useStore((state) => state.addProjectObject);
  const addLocalObject = useStore((state) => state.addLocalObject);
  const updateObject = useStore((state) => state.updateObject);
  const deleteObject = useStore((state) => state.deleteObject);
  const addItem = useStore((state) => state.addItem);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const addContext = useStore((state) => state.addContext);
  const updateContext = useStore((state) => state.updateContext);
  const deleteContext = useStore((state) => state.deleteContext);
  const addNode = useStore((state) => state.addNode);
  const updateNode = useStore((state) => state.updateNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const addItemNode = useStore((state) => state.addItemNode);
  const deleteItemNode = useStore((state) => state.deleteItemNode);

  const workspaceId = workspace?.id || 'global';
  const messages = getChatMessages(workspaceId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isChatExpanded) {
      inputRef.current?.focus();
    }
  }, [isChatExpanded]);

  // Execute a tool call and return result message
  const executeToolCall = async (toolCall: AIToolCall): Promise<string> => {
    const { name, args } = toolCall;

    try {
      switch (name) {
        // ============ READ TOOLS ============
        case 'list_projects': {
          const list = projects.map(p => `- ${p.name} (${p.id})`).join('\n');
          return `Found ${projects.length} projects:\n${list || 'No projects yet'}`;
        }

        case 'list_workspaces': {
          const filtered = args.projectId
            ? workspaces.filter(w => w.projectId === args.projectId)
            : workspaces;
          const list = filtered.map(w => `- ${w.name} (${w.id}) in project ${w.projectId}`).join('\n');
          return `Found ${filtered.length} workspaces:\n${list || 'No workspaces'}`;
        }

        case 'list_objects': {
          let filtered = objects;
          if (args.scope) filtered = filtered.filter(o => o.scope === args.scope);
          if (args.projectId) filtered = filtered.filter(o => o.projectId === args.projectId);
          if (args.workspaceId) filtered = filtered.filter(o => o.workspaceId === args.workspaceId);
          const list = filtered.map(o => `- ${o.icon} ${o.name} (${o.scope}, ${o.id})`).join('\n');
          return `Found ${filtered.length} objects:\n${list || 'No objects'}`;
        }

        case 'list_items': {
          const filtered = items.filter(i => i.objectId === args.objectId);
          const list = filtered.map(i => `- ${i.name} (${i.id})`).join('\n');
          return `Found ${filtered.length} items:\n${list || 'No items'}`;
        }

        case 'list_contexts': {
          const filtered = contexts.filter(c => c.workspaceId === args.workspaceId);
          const list = filtered.map(c => `- ${c.icon} ${c.name} (${c.type}, ${c.id})`).join('\n');
          return `Found ${filtered.length} contexts:\n${list || 'No contexts'}`;
        }

        case 'get_item_context': {
          const targetItem = items.find(i => i.id === args.itemId);
          if (!targetItem) return `Item not found: ${args.itemId}`;
          const nodes = targetItem.contextData?.nodes || [];
          if (nodes.length === 0) return `Item "${targetItem.name}" has no context nodes`;
          const list = nodes.map(n => `- ${n.content} (parent: ${n.parentId || 'root'})`).join('\n');
          return `Item "${targetItem.name}" has ${nodes.length} nodes:\n${list}`;
        }

        // ============ CREATE TOOLS ============
        case 'create_project': {
          const id = await addProject({
            name: args.name as string,
            icon: (args.icon as string) || '📁',
            gradient: 'bg-gradient-to-br from-blue-300 via-blue-400 to-indigo-400',
            category: (args.category as string) || 'Main',
          });
          return `Created project "${args.name}" (ID: ${id})`;
        }

        case 'create_workspace': {
          const id = await addWorkspace({
            name: args.name as string,
            projectId: args.projectId as string,
            category: args.category as string,
            categoryIcon: args.categoryIcon as string,
          });
          return `Created workspace "${args.name}" (ID: ${id})`;
        }

        case 'create_object': {
          const scope = args.scope as 'global' | 'project' | 'local';
          const objData = {
            name: args.name as string,
            icon: (args.icon as string) || '📦',
            category: args.category as string,
            builtIn: false,
          };

          let id: string;
          if (scope === 'global') {
            id = await addGlobalObject(objData);
          } else if (scope === 'project') {
            id = await addProjectObject(args.projectId as string, objData);
          } else {
            id = await addLocalObject(args.projectId as string, args.workspaceId as string, objData);
          }
          return `Created ${scope} object "${args.name}" (ID: ${id})`;
        }

        case 'create_item': {
          const id = await addItem({
            name: args.name as string,
            objectId: args.objectId as string,
            workspaceId: (args.workspaceId as string) || null,
          });
          return `Created item "${args.name}" (ID: ${id})`;
        }

        case 'create_context': {
          const id = await addContext({
            name: args.name as string,
            icon: (args.icon as string) || '📝',
            type: args.type as 'tree' | 'board' | 'canvas',
            viewStyle: args.type === 'tree' ? 'list' : args.type === 'board' ? 'grid' : 'freeform',
            workspaceId: args.workspaceId as string,
            data: { nodes: [], edges: [] },
          });
          return `Created ${args.type} context "${args.name}" (ID: ${id})`;
        }

        case 'add_node': {
          const targetType = args.targetType as 'context' | 'item';
          const targetId = args.targetId as string;
          const nodeData = {
            content: args.content as string,
            parentId: (args.parentId as string) || null,
          };

          let nodeId: string;
          if (targetType === 'context') {
            nodeId = await addNode(targetId, nodeData);
          } else {
            nodeId = await addItemNode(targetId, nodeData);
          }
          return `Added node "${args.content}" (ID: ${nodeId})`;
        }

        // ============ UPDATE TOOLS ============
        case 'update_project': {
          const updates: Partial<Project> = {};
          if (args.name) updates.name = args.name as string;
          if (args.icon) updates.icon = args.icon as string;
          if (args.category) updates.category = args.category as string;
          await updateProject(args.id as string, updates);
          return `Updated project ${args.id}`;
        }

        case 'update_workspace': {
          const updates: Partial<Workspace> = {};
          if (args.name) updates.name = args.name as string;
          if (args.category) updates.category = args.category as string;
          if (args.categoryIcon) updates.categoryIcon = args.categoryIcon as string;
          await updateWorkspace(args.id as string, updates);
          return `Updated workspace ${args.id}`;
        }

        case 'update_object': {
          const updates: Partial<ObjectType> = {};
          if (args.name) updates.name = args.name as string;
          if (args.icon) updates.icon = args.icon as string;
          if (args.category) updates.category = args.category as string;
          await updateObject(args.id as string, updates);
          return `Updated object ${args.id}`;
        }

        case 'update_item': {
          const updates: Partial<ObjectItem> = {};
          if (args.name) updates.name = args.name as string;
          await updateItem(args.id as string, updates);
          return `Updated item ${args.id}`;
        }

        case 'update_context': {
          const updates: Partial<{ name: string; icon: string }> = {};
          if (args.name) updates.name = args.name as string;
          if (args.icon) updates.icon = args.icon as string;
          await updateContext(args.id as string, updates);
          return `Updated context ${args.id}`;
        }

        case 'update_node': {
          if (args.content) {
            await updateNode(args.contextId as string, args.nodeId as string, {
              content: args.content as string,
            });
          }
          return `Updated node ${args.nodeId}`;
        }

        // ============ DELETE TOOLS ============
        case 'delete_project': {
          const projectToDelete = projects.find(p => p.id === args.id);
          if (!projectToDelete) return `Error: Project not found with ID ${args.id}`;
          await deleteProject(args.id as string);
          return `Deleted project "${projectToDelete.name}" (${args.id})`;
        }

        case 'delete_workspace': {
          const workspaceToDelete = workspaces.find(w => w.id === args.id);
          if (!workspaceToDelete) return `Error: Workspace not found with ID ${args.id}`;
          await deleteWorkspace(args.id as string);
          return `Deleted workspace "${workspaceToDelete.name}" (${args.id})`;
        }

        case 'delete_object': {
          const objectToDelete = objects.find(o => o.id === args.id);
          if (!objectToDelete) return `Error: Object not found with ID ${args.id}`;
          await deleteObject(args.id as string);
          return `Deleted object "${objectToDelete.name}" (${args.id})`;
        }

        case 'delete_item': {
          const itemToDelete = items.find(i => i.id === args.id);
          if (!itemToDelete) return `Error: Item not found with ID ${args.id}`;
          await deleteItem(args.id as string);
          return `Deleted item "${itemToDelete.name}" (${args.id})`;
        }

        case 'delete_context': {
          const contextToDelete = contexts.find(c => c.id === args.id);
          if (!contextToDelete) return `Error: Context not found with ID ${args.id}`;
          await deleteContext(args.id as string);
          return `Deleted context "${contextToDelete.name}" (${args.id})`;
        }

        case 'delete_node': {
          const targetType = args.targetType as 'context' | 'item';
          if (targetType === 'context') {
            await deleteNode(args.targetId as string, args.nodeId as string);
          } else {
            await deleteItemNode(args.targetId as string, args.nodeId as string);
          }
          return `Deleted node ${args.nodeId}`;
        }

        default:
          return `Unknown tool: ${name}`;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return `Error executing ${name}: ${msg}`;
    }
  };

  // Get entity name for confirmation dialog
  const getEntityNameForConfirmation = (toolCall: AIToolCall): { name: string; type: PendingToolCall['entityType'] } => {
    const { name, args } = toolCall;
    const id = args.id as string;

    switch (name) {
      case 'delete_project': {
        const p = projects.find(x => x.id === id);
        return { name: p?.name || id, type: 'project' };
      }
      case 'delete_workspace': {
        const w = workspaces.find(x => x.id === id);
        return { name: w?.name || id, type: 'workspace' };
      }
      case 'delete_object': {
        const o = objects.find(x => x.id === id);
        return { name: o?.name || id, type: 'object' };
      }
      case 'delete_item': {
        const i = items.find(x => x.id === id);
        return { name: i?.name || id, type: 'item' };
      }
      case 'delete_context': {
        const c = contexts.find(x => x.id === id);
        return { name: c?.name || id, type: 'context' };
      }
      case 'delete_node': {
        return { name: args.nodeId as string, type: 'node' };
      }
      default:
        return { name: 'unknown', type: 'item' };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    addChatMessage(workspaceId, {
      role: 'user',
      content: userMessage,
      context: project && workspace ? {
        projectId: project.id,
        workspaceId: workspace.id,
        itemId: item?.id,
      } : undefined,
    });

    setChatLoading(true);

    try {
      // Build context for the API
      const systemPrompt = buildContextPrompt({ project, workspace, context: selectedContext, object, item });

      // Get conversation history for API
      const apiMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      apiMessages.push({ role: 'user', content: userMessage });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt,
          provider: aiSettings.provider,
          model: aiSettings.model,
          apiKey: aiSettings.apiKey,
          enableTools: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Handle tool calls
      let toolResults: string[] = [];
      if (data.toolCalls && data.toolCalls.length > 0) {
        for (const toolCall of data.toolCalls as AIToolCall[]) {
          // Check if this tool requires confirmation
          if (TOOLS_REQUIRING_CONFIRMATION.includes(toolCall.name)) {
            const entity = getEntityNameForConfirmation(toolCall);
            setPendingToolCall({
              toolCall,
              entityName: entity.name,
              entityType: entity.type,
            });
            // Stop processing - wait for user confirmation
            setChatLoading(false);
            return;
          }

          // Execute tool and collect result
          const result = await executeToolCall(toolCall);
          toolResults.push(`[${toolCall.name}]: ${result}`);
        }
      }

      // Parse suggested nodes from response (legacy support)
      const suggestedNodes = parseSuggestedNodes(data.content);

      // Build response content
      let responseContent = data.content || '';
      if (toolResults.length > 0) {
        responseContent = toolResults.join('\n\n') + (responseContent ? '\n\n' + responseContent : '');
      }

      // Add assistant message
      addChatMessage(workspaceId, {
        role: 'assistant',
        content: responseContent || 'Done.',
        suggestedNodes: suggestedNodes || undefined,
      });
    } catch (error) {
      // Add error message
      addChatMessage(workspaceId, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleConfirmToolCall = async (confirmed: boolean) => {
    if (!pendingToolCall) return;

    if (confirmed) {
      setChatLoading(true);
      try {
        const result = await executeToolCall(pendingToolCall.toolCall);
        addChatMessage(workspaceId, {
          role: 'assistant',
          content: `[${pendingToolCall.toolCall.name}]: ${result}`,
        });
      } catch (error) {
        addChatMessage(workspaceId, {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to execute'}`,
        });
      } finally {
        setChatLoading(false);
      }
    } else {
      addChatMessage(workspaceId, {
        role: 'assistant',
        content: `Cancelled: delete ${pendingToolCall.entityType} "${pendingToolCall.entityName}"`,
      });
    }

    setPendingToolCall(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChatMessages(workspaceId);
  };

  const contextBadge = formatContextBadge({ project, workspace, context: selectedContext, item });

  // Collapsed bar
  if (!isChatOpen) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <button
            onClick={() => {
              setChatOpen(true);
              setChatExpanded(true);
            }}
            className="w-full bg-white border border-zinc-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 hover:border-zinc-300 hover:shadow-xl transition-all"
          >
            <span className="text-lg">AI</span>
            <span className="flex-1 text-left text-zinc-400 text-sm">
              Ask AI about this context...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-400 bg-zinc-100 rounded">
              Click to chat
            </kbd>
          </button>
        </div>
      </div>
    );
  }

  // Expanded chat panel
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 bg-zinc-50">
            <div className="flex items-center gap-3">
              <span className="text-lg">AI</span>
              <span className="text-sm font-medium text-zinc-900">Chat with AI</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                  title="Clear chat"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setChatExpanded(!isChatExpanded)}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-100 transition-colors"
                title={isChatExpanded ? 'Minimize' : 'Expand'}
              >
                {isChatExpanded ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 14 10 14 10 20"></polyline>
                    <polyline points="20 10 14 10 14 4"></polyline>
                    <line x1="14" y1="10" x2="21" y2="3"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                )}
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-100 transition-colors"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Context badge */}
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Context: {contextBadge}</span>
            </div>
          </div>

          {/* Pending confirmation */}
          {pendingToolCall && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>
                    Delete {pendingToolCall.entityType} &quot;{pendingToolCall.entityName}&quot;?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmToolCall(false)}
                    className="px-3 py-1 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmToolCall(true)}
                    className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {isChatExpanded && (
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                  <div className="text-center">
                    <p>No messages yet.</p>
                    <p className="text-xs mt-1">Ask a question or give a command!</p>
                    <p className="text-xs mt-2 text-zinc-300">Try: &quot;Create a project called Marketing&quot;</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onApplyNodes={onApplyNodes}
                    />
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-100 rounded-lg px-3 py-2 text-sm text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-zinc-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 transition-colors"
                disabled={isChatLoading || !!pendingToolCall}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isChatLoading || !!pendingToolCall}
                className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
              <span>
                Using {aiSettings.provider === 'openai' ? 'OpenAI' : 'Anthropic'} ({aiSettings.model})
              </span>
              <a href="/settings" className="hover:text-zinc-600 transition-colors">
                Change in Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
