import { create } from 'zustand';
import { Project, Workspace, Context, ObjectType, ObjectItem, ContextNode, ContextEdge, ChatMessage, AISettings, AIProvider } from '@/types';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

interface AppState {
    // Data
    projects: Project[];
    workspaces: Workspace[];
    contexts: Context[];
    objects: ObjectType[];
    items: ObjectItem[];
    isLoading: boolean;
    isLoaded: boolean;

    // AI Chat State
    chatMessages: Record<string, ChatMessage[]>; // keyed by workspaceId
    aiSettings: AISettings;
    isChatOpen: boolean;
    isChatExpanded: boolean;
    isChatLoading: boolean;

    // Load data from API
    loadData: () => Promise<void>;
    saveData: () => Promise<void>;

    // Projects
    addProject: (project: Omit<Project, 'id'>) => Promise<string>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    // Workspaces
    addWorkspace: (workspace: Omit<Workspace, 'id'>) => Promise<string>;
    updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;

    // Contexts
    addContext: (context: Omit<Context, 'id'>) => Promise<string>;
    updateContext: (id: string, updates: Partial<Context>) => Promise<void>;
    deleteContext: (id: string) => Promise<void>;

    // Context Nodes
    addNode: (contextId: string, node: Omit<ContextNode, 'id'>) => Promise<string>;
    updateNode: (contextId: string, nodeId: string, updates: Partial<ContextNode>) => Promise<void>;
    deleteNode: (contextId: string, nodeId: string) => Promise<void>;

    // Context Edges
    addEdge: (contextId: string, edge: Omit<ContextEdge, 'id'>) => Promise<string>;
    deleteEdge: (contextId: string, edgeId: string) => Promise<void>;

    // Objects
    addObject: (object: Omit<ObjectType, 'id'>) => Promise<string>;
    updateObject: (id: string, updates: Partial<ObjectType>) => Promise<void>;
    deleteObject: (id: string) => Promise<void>;

    // Items
    addItem: (item: Omit<ObjectItem, 'id'>) => Promise<string>;
    updateItem: (id: string, updates: Partial<ObjectItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;

    // 3-Tier Scope Objects
    addGlobalObject: (object: Omit<ObjectType, 'id' | 'scope' | 'projectId' | 'workspaceId'>) => Promise<string>;
    getGlobalObjects: () => ObjectType[];
    addProjectObject: (projectId: string, object: Omit<ObjectType, 'id' | 'scope' | 'projectId' | 'workspaceId'>) => Promise<string>;
    getProjectObjects: (projectId: string) => ObjectType[];
    addLocalObject: (projectId: string, workspaceId: string, object: Omit<ObjectType, 'id' | 'scope' | 'projectId' | 'workspaceId'>) => Promise<string>;
    getLocalObjects: (workspaceId: string) => ObjectType[];
    getVisibleObjects: (projectId: string, workspaceId: string) => ObjectType[];

    // Sub-workspaces (Phase 4)
    createSubWorkspace: (parentItemId: string, projectId: string, name: string) => Promise<string>;
    getSubWorkspaces: (parentItemId: string) => Workspace[];

    // Item contextData (Phase 4)
    updateItemContext: (itemId: string, nodes: ContextNode[]) => Promise<void>;
    updateItemContextType: (itemId: string, type: import('@/types').ContextType, viewStyle: import('@/types').ViewStyle) => Promise<void>;
    addItemNode: (itemId: string, node: Omit<ContextNode, 'id'>) => Promise<string>;
    updateItemNode: (itemId: string, nodeId: string, updates: Partial<ContextNode>) => Promise<void>;
    deleteItemNode: (itemId: string, nodeId: string) => Promise<void>;
    addItemEdge: (itemId: string, edge: Omit<ContextEdge, 'id'>) => Promise<string>;
    deleteItemEdge: (itemId: string, edgeId: string) => Promise<void>;

    // AI Chat (Phase 5)
    addChatMessage: (workspaceId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
    getChatMessages: (workspaceId: string) => ChatMessage[];
    clearChatMessages: (workspaceId: string) => void;
    setAISettings: (settings: Partial<AISettings>) => void;
    setChatOpen: (isOpen: boolean) => void;
    setChatExpanded: (isExpanded: boolean) => void;
    setChatLoading: (isLoading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
    projects: [],
    workspaces: [],
    contexts: [],
    objects: [],
    items: [],
    isLoading: false,
    isLoaded: false,

    // AI Chat initial state
    chatMessages: {},
    aiSettings: {
        provider: 'openai' as AIProvider,
        model: 'gpt-4o',
    },
    isChatOpen: false,
    isChatExpanded: false,
    isChatLoading: false,

    loadData: async () => {
        if (get().isLoaded || get().isLoading) return;
        set({ isLoading: true });
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            set({
                projects: data.projects || [],
                workspaces: data.workspaces || [],
                contexts: data.contexts || [],
                objects: data.objects || [],
                items: data.items || [],
                isLoaded: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to load data:', error);
            set({ isLoading: false });
        }
    },

    saveData: async () => {
        const { projects, workspaces, contexts, objects, items } = get();
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projects, workspaces, contexts, objects, items }),
            });
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    },

    // Projects
    addProject: async (project) => {
        const id = generateId();
        set((state) => ({ projects: [...state.projects, { ...project, id }] }));
        await get().saveData();
        return id;
    },

    updateProject: async (id, updates) => {
        set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        await get().saveData();
    },

    deleteProject: async (id) => {
        const workspaceIds = get().workspaces
            .filter((w) => w.projectId === id)
            .map((w) => w.id);
        const objectIds = get().objects
            .filter((o) => o.projectId === id)
            .map((o) => o.id);
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            workspaces: state.workspaces.filter((w) => w.projectId !== id),
            contexts: state.contexts.filter((c) => !workspaceIds.includes(c.workspaceId)),
            // Delete all objects belonging to this project (both global and local)
            objects: state.objects.filter((o) => o.projectId !== id),
            // Delete all items belonging to objects in this project
            items: state.items.filter((i) => !objectIds.includes(i.objectId)),
        }));
        await get().saveData();
    },

    // Workspaces
    addWorkspace: async (workspace) => {
        const id = generateId();
        set((state) => ({ workspaces: [...state.workspaces, { ...workspace, id }] }));
        await get().saveData();
        return id;
    },

    updateWorkspace: async (id, updates) => {
        set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
        await get().saveData();
    },

    deleteWorkspace: async (id) => {
        // Get local objects in this workspace (not global objects)
        const localObjectIds = get().objects
            .filter((o) => o.workspaceId === id)
            .map((o) => o.id);
        set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== id),
            contexts: state.contexts.filter((c) => c.workspaceId !== id),
            // Only delete local objects (workspaceId matches), not global objects
            objects: state.objects.filter((o) => o.workspaceId !== id),
            // Delete items: local object items OR items with this workspaceId
            items: state.items.filter((i) =>
                !localObjectIds.includes(i.objectId) && i.workspaceId !== id
            ),
        }));
        await get().saveData();
    },

    // Contexts
    addContext: async (context) => {
        const id = generateId();
        const newContext: Context = {
            ...context,
            id,
            data: context.data || { nodes: [], edges: [] },
        };
        set((state) => ({ contexts: [...state.contexts, newContext] }));
        await get().saveData();
        return id;
    },

    updateContext: async (id, updates) => {
        set((state) => ({
            contexts: state.contexts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        await get().saveData();
    },

    deleteContext: async (id) => {
        set((state) => ({
            contexts: state.contexts.filter((c) => c.id !== id),
        }));
        await get().saveData();
    },

    // Context Nodes
    addNode: async (contextId, node) => {
        const nodeId = generateId();
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: [...(c.data?.nodes || []), { ...node, id: nodeId }],
                            edges: c.data?.edges || [],
                        },
                    }
                    : c
            ),
        }));
        await get().saveData();
        return nodeId;
    },

    updateNode: async (contextId, nodeId, updates) => {
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: (c.data?.nodes || []).map((n) =>
                                n.id === nodeId ? { ...n, ...updates } : n
                            ),
                            edges: c.data?.edges || [],
                        },
                    }
                    : c
            ),
        }));
        await get().saveData();
    },

    deleteNode: async (contextId, nodeId) => {
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: (c.data?.nodes || []).filter((n) => n.id !== nodeId),
                            edges: (c.data?.edges || []).filter(
                                (e) => e.sourceId !== nodeId && e.targetId !== nodeId
                            ),
                        },
                    }
                    : c
            ),
        }));
        await get().saveData();
    },

    // Context Edges
    addEdge: async (contextId, edge) => {
        const edgeId = generateId();
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: c.data?.nodes || [],
                            edges: [...(c.data?.edges || []), { ...edge, id: edgeId }],
                        },
                    }
                    : c
            ),
        }));
        await get().saveData();
        return edgeId;
    },

    deleteEdge: async (contextId, edgeId) => {
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: c.data?.nodes || [],
                            edges: (c.data?.edges || []).filter((e) => e.id !== edgeId),
                        },
                    }
                    : c
            ),
        }));
        await get().saveData();
    },

    // Objects
    addObject: async (object) => {
        const id = generateId();
        set((state) => ({ objects: [...state.objects, { ...object, id }] }));
        await get().saveData();
        return id;
    },

    updateObject: async (id, updates) => {
        set((state) => ({
            objects: state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
        await get().saveData();
    },

    deleteObject: async (id) => {
        set((state) => ({
            objects: state.objects.filter((o) => o.id !== id),
            items: state.items.filter((i) => i.objectId !== id),
        }));
        await get().saveData();
    },

    // Items
    addItem: async (item) => {
        const id = generateId();
        set((state) => ({ items: [...state.items, { ...item, id }] }));
        await get().saveData();
        return id;
    },

    updateItem: async (id, updates) => {
        set((state) => ({
            items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
        await get().saveData();
    },

    deleteItem: async (id) => {
        set((state) => ({
            items: state.items.filter((i) => i.id !== id),
        }));
        await get().saveData();
    },

    // === 3-Tier Scope Object Operations ===

    // Global Objects (scope: 'global') - visible across ALL projects
    addGlobalObject: async (object: Omit<ObjectType, 'id' | 'scope' | 'projectId' | 'workspaceId'>) => {
        const id = generateId();
        const newObject: ObjectType = {
            ...object,
            id,
            scope: 'global',
            projectId: null,
            workspaceId: null,
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await get().saveData();
        return id;
    },

    getGlobalObjects: () => {
        return get().objects.filter((o) => o.scope === 'global');
    },

    // Project Objects (scope: 'project') - visible within a project
    addProjectObject: async (projectId: string, object: Omit<ObjectType, 'id' | 'scope' | 'projectId' | 'workspaceId'>) => {
        const id = generateId();
        const newObject: ObjectType = {
            ...object,
            id,
            scope: 'project',
            projectId,
            workspaceId: null,
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await get().saveData();
        return id;
    },

    getProjectObjects: (projectId: string) => {
        return get().objects.filter((o) => o.scope === 'project' && o.projectId === projectId);
    },

    // Local Objects (scope: 'local') - visible only in a specific workspace
    addLocalObject: async (projectId: string, workspaceId: string, object: Omit<ObjectType, 'id' | 'scope' | 'projectId' | 'workspaceId'>) => {
        const id = generateId();
        const newObject: ObjectType = {
            ...object,
            id,
            scope: 'local',
            projectId,
            workspaceId,
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await get().saveData();
        return id;
    },

    getLocalObjects: (workspaceId: string) => {
        return get().objects.filter((o) => o.scope === 'local' && o.workspaceId === workspaceId);
    },

    // Get all visible objects for a workspace (global + project + local)
    getVisibleObjects: (projectId: string, workspaceId: string) => {
        return get().objects.filter((o) =>
            o.scope === 'global' ||
            (o.scope === 'project' && o.projectId === projectId) ||
            (o.scope === 'local' && o.workspaceId === workspaceId)
        );
    },

    // Sub-workspaces (Phase 4)
    createSubWorkspace: async (parentItemId, projectId, name) => {
        const id = generateId();
        const newWorkspace: Workspace = {
            id,
            name,
            projectId,
            parentItemId,
        };
        set((state) => ({ workspaces: [...state.workspaces, newWorkspace] }));
        await get().saveData();
        return id;
    },

    getSubWorkspaces: (parentItemId) => {
        return get().workspaces.filter((w) => w.parentItemId === parentItemId);
    },

    // Item contextData (Phase 4)
    updateItemContext: async (itemId, nodes) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? { ...i, contextData: { ...i.contextData, nodes } }
                    : i
            ),
        }));
        await get().saveData();
    },

    updateItemContextType: async (itemId, type, viewStyle) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? {
                          ...i,
                          contextData: {
                              ...i.contextData,
                              type,
                              viewStyle,
                              nodes: i.contextData?.nodes || [],
                          },
                      }
                    : i
            ),
        }));
        await get().saveData();
    },

    addItemNode: async (itemId, node) => {
        const nodeId = generateId();
        const newNode: ContextNode = { ...node, id: nodeId };
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? {
                          ...i,
                          contextData: {
                              ...i.contextData,
                              nodes: [...(i.contextData?.nodes || []), newNode],
                          },
                      }
                    : i
            ),
        }));
        await get().saveData();
        return nodeId;
    },

    updateItemNode: async (itemId, nodeId, updates) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? {
                          ...i,
                          contextData: {
                              ...i.contextData,
                              nodes: (i.contextData?.nodes || []).map((n) =>
                                  n.id === nodeId ? { ...n, ...updates } : n
                              ),
                          },
                      }
                    : i
            ),
        }));
        await get().saveData();
    },

    deleteItemNode: async (itemId, nodeId) => {
        set((state) => ({
            items: state.items.map((i) => {
                if (i.id !== itemId) return i;
                // Delete node and all its descendants
                const nodes = i.contextData?.nodes || [];
                const toDelete = new Set<string>();
                const findDescendants = (id: string) => {
                    toDelete.add(id);
                    nodes.filter((n) => n.parentId === id).forEach((n) => findDescendants(n.id));
                };
                findDescendants(nodeId);
                return {
                    ...i,
                    contextData: {
                        ...i.contextData,
                        nodes: nodes.filter((n) => !toDelete.has(n.id)),
                    },
                };
            }),
        }));
        await get().saveData();
    },

    addItemEdge: async (itemId, edge) => {
        const edgeId = generateId();
        const newEdge: ContextEdge = { ...edge, id: edgeId };
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? {
                          ...i,
                          contextData: {
                              ...i.contextData,
                              nodes: i.contextData?.nodes || [],
                              edges: [...(i.contextData?.edges || []), newEdge],
                          },
                      }
                    : i
            ),
        }));
        await get().saveData();
        return edgeId;
    },

    deleteItemEdge: async (itemId, edgeId) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? {
                          ...i,
                          contextData: {
                              ...i.contextData,
                              nodes: i.contextData?.nodes || [],
                              edges: (i.contextData?.edges || []).filter((e) => e.id !== edgeId),
                          },
                      }
                    : i
            ),
        }));
        await get().saveData();
    },

    // AI Chat (Phase 5) - with localStorage persistence
    addChatMessage: (workspaceId, message) => {
        const id = generateId();
        const newMessage: ChatMessage = {
            ...message,
            id,
            timestamp: Date.now(),
        };
        set((state) => {
            const updated = {
                ...state.chatMessages,
                [workspaceId]: [...(state.chatMessages[workspaceId] || []), newMessage],
            };
            // Persist to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('context-os-chat', JSON.stringify(updated));
            }
            return { chatMessages: updated };
        });
        return id;
    },

    getChatMessages: (workspaceId) => {
        // Load from localStorage on first access if empty
        const state = get();
        if (Object.keys(state.chatMessages).length === 0 && typeof window !== 'undefined') {
            const saved = localStorage.getItem('context-os-chat');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    set({ chatMessages: parsed });
                    return parsed[workspaceId] || [];
                } catch {
                    // Invalid JSON, ignore
                }
            }
        }
        return state.chatMessages[workspaceId] || [];
    },

    clearChatMessages: (workspaceId) => {
        set((state) => {
            const updated = {
                ...state.chatMessages,
                [workspaceId]: [],
            };
            // Persist to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('context-os-chat', JSON.stringify(updated));
            }
            return { chatMessages: updated };
        });
    },

    setAISettings: (settings) => {
        set((state) => ({
            aiSettings: { ...state.aiSettings, ...settings },
        }));
    },

    setChatOpen: (isOpen) => {
        set({ isChatOpen: isOpen });
    },

    setChatExpanded: (isExpanded) => {
        set({ isChatExpanded: isExpanded });
    },

    setChatLoading: (isLoading) => {
        set({ isChatLoading: isLoading });
    },
}));
