import { create } from 'zustand';
import { Project, Workspace, Context, ObjectType, ObjectItem, ContextNode, ContextEdge, ChatMessage, AISettings, AIProvider } from '@/types';
import { createClient } from '@/lib/supabase';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// === camelCase ↔ snake_case conversion ===
const toSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamel = (str: string) => str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSnakeKeys = (obj: Record<string, any>): Record<string, any> =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v]));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCamelKeys = <T>(obj: Record<string, any>): T =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v])) as T;

interface AppState {
    // Data
    projects: Project[];
    workspaces: Workspace[];
    contexts: Context[];
    objects: ObjectType[];
    items: ObjectItem[];
    pinnedObjectTabs: string[];
    isLoading: boolean;
    isLoaded: boolean;
    userId: string | null;

    // AI Chat State
    chatMessages: Record<string, ChatMessage[]>;
    aiSettings: AISettings;
    isChatOpen: boolean;
    isChatExpanded: boolean;
    isChatLoading: boolean;

    // Load data from Supabase
    loadData: () => Promise<void>;

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
    getGlobalContexts: () => Context[];
    getProjectContexts: (projectId: string) => Context[];
    getLocalContexts: (workspaceId: string) => Context[];

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
    copyItem: (itemId: string, workspaceId: string) => Promise<string | null>;

    // Object Availability Operations
    addGlobalObject: (object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInProjects' | 'availableInWorkspaces'>) => Promise<string>;
    getGlobalObjects: () => ObjectType[];
    addProjectObject: (projectId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInProjects' | 'availableInWorkspaces'>) => Promise<string>;
    getProjectObjects: (projectId: string) => ObjectType[];
    addLocalObject: (projectId: string, workspaceId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInProjects' | 'availableInWorkspaces'>) => Promise<string>;
    getLocalObjects: (workspaceId: string) => ObjectType[];
    getVisibleObjects: (projectId: string, workspaceId: string) => ObjectType[];

    // Sub-workspaces
    createSubWorkspace: (parentItemId: string, projectId: string, name: string) => Promise<string>;
    getSubWorkspaces: (parentItemId: string) => Workspace[];

    // Item contextData
    updateItemContext: (itemId: string, nodes: ContextNode[]) => Promise<void>;
    updateItemContextType: (itemId: string, type: import('@/types').ContextType, viewStyle: import('@/types').ViewStyle) => Promise<void>;
    addItemNode: (itemId: string, node: Omit<ContextNode, 'id'>) => Promise<string>;
    updateItemNode: (itemId: string, nodeId: string, updates: Partial<ContextNode>) => Promise<void>;
    deleteItemNode: (itemId: string, nodeId: string) => Promise<void>;
    addItemEdge: (itemId: string, edge: Omit<ContextEdge, 'id'>) => Promise<string>;
    deleteItemEdge: (itemId: string, edgeId: string) => Promise<void>;

    // AI Chat
    addChatMessage: (workspaceId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
    getChatMessages: (workspaceId: string) => ChatMessage[];
    clearChatMessages: (workspaceId: string) => void;
    setAISettings: (settings: Partial<AISettings>) => void;
    setChatOpen: (isOpen: boolean) => void;
    setChatExpanded: (isExpanded: boolean) => void;
    setChatLoading: (isLoading: boolean) => void;

    // Pinned Object Tabs
    pinObjectTab: (objectId: string) => Promise<void>;
    unpinObjectTab: (objectId: string) => Promise<void>;
    reorderPinnedTabs: (objectIds: string[]) => Promise<void>;

    // Auth
    signOut: () => Promise<void>;
}

const supabase = createClient();

export const useStore = create<AppState>((set, get) => ({
    projects: [],
    workspaces: [],
    contexts: [],
    objects: [],
    items: [],
    pinnedObjectTabs: [],
    isLoading: false,
    isLoaded: false,
    userId: null,

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const [projectsRes, workspacesRes, contextsRes, objectsRes, itemsRes, pinnedRes] = await Promise.all([
                supabase.from('projects').select('*'),
                supabase.from('workspaces').select('*'),
                supabase.from('contexts').select('*'),
                supabase.from('objects').select('*'),
                supabase.from('items').select('*'),
                supabase.from('pinned_object_tabs').select('*').order('position'),
            ]);

            set({
                userId: user.id,
                projects: (projectsRes.data ?? []).map(r => toCamelKeys<Project>(r)),
                workspaces: (workspacesRes.data ?? []).map(r => toCamelKeys<Workspace>(r)),
                contexts: (contextsRes.data ?? []).map(r => toCamelKeys<Context>(r)),
                objects: (objectsRes.data ?? []).map(r => toCamelKeys<ObjectType>(r)),
                items: (itemsRes.data ?? []).map(r => toCamelKeys<ObjectItem>(r)),
                pinnedObjectTabs: (pinnedRes.data ?? []).map(r => r.object_id),
                isLoaded: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to load data:', error);
            set({ isLoading: false });
        }
    },

    // Projects
    addProject: async (project) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ projects: [...state.projects, { ...project, id }] }));
        await supabase.from('projects').insert({ ...toSnakeKeys({ ...project, id }), user_id: userId });
        return id;
    },

    updateProject: async (id, updates) => {
        set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        await supabase.from('projects').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteProject: async (id) => {
        const workspaceIds = get().workspaces
            .filter((w) => w.projectId === id)
            .map((w) => w.id);
        const objectsToDelete = get().objects.filter((o) =>
            !o.availableGlobal &&
            o.availableInProjects.length === 1 &&
            o.availableInProjects[0] === id &&
            o.availableInWorkspaces.length === 0
        );
        const objectIds = objectsToDelete.map((o) => o.id);

        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            workspaces: state.workspaces.filter((w) => w.projectId !== id),
            contexts: state.contexts.filter((c) =>
                c.projectId !== id && (c.workspaceId === null || !workspaceIds.includes(c.workspaceId))
            ),
            objects: state.objects.filter((o) => !objectIds.includes(o.id)),
            items: state.items.filter((i) => !objectIds.includes(i.objectId)),
        }));

        // Delete orphaned objects first (items cascade from objects)
        if (objectIds.length > 0) {
            await supabase.from('objects').delete().in('id', objectIds);
        }
        // Project delete cascades to workspaces → contexts
        await supabase.from('projects').delete().eq('id', id);
    },

    // Workspaces
    addWorkspace: async (workspace) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ workspaces: [...state.workspaces, { ...workspace, id }] }));
        await supabase.from('workspaces').insert({ ...toSnakeKeys({ ...workspace, id }), user_id: userId });
        return id;
    },

    updateWorkspace: async (id, updates) => {
        set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
        await supabase.from('workspaces').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteWorkspace: async (id) => {
        const objectsToDelete = get().objects.filter((o) =>
            !o.availableGlobal &&
            o.availableInProjects.length === 0 &&
            o.availableInWorkspaces.length === 1 &&
            o.availableInWorkspaces[0] === id
        );
        const localObjectIds = objectsToDelete.map((o) => o.id);

        set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== id),
            contexts: state.contexts.filter((c) => c.workspaceId !== id),
            objects: state.objects.filter((o) => !localObjectIds.includes(o.id)),
            items: state.items.filter((i) =>
                !localObjectIds.includes(i.objectId) && i.workspaceId !== id
            ),
        }));

        if (localObjectIds.length > 0) {
            await supabase.from('objects').delete().in('id', localObjectIds);
        }
        await supabase.from('workspaces').delete().eq('id', id);
    },

    // Contexts
    addContext: async (context) => {
        const id = generateId();
        const userId = get().userId;
        const newContext: Context = {
            ...context,
            id,
            data: context.data || { nodes: [], edges: [] },
        };
        set((state) => ({ contexts: [...state.contexts, newContext] }));
        await supabase.from('contexts').insert({ ...toSnakeKeys(newContext), user_id: userId });
        return id;
    },

    updateContext: async (id, updates) => {
        set((state) => ({
            contexts: state.contexts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        await supabase.from('contexts').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteContext: async (id) => {
        set((state) => ({
            contexts: state.contexts.filter((c) => c.id !== id),
        }));
        await supabase.from('contexts').delete().eq('id', id);
    },

    getGlobalContexts: () => {
        return get().contexts.filter((c) => c.scope === 'global');
    },

    getProjectContexts: (projectId: string) => {
        return get().contexts.filter((c) => c.scope === 'project' && c.projectId === projectId);
    },

    getLocalContexts: (workspaceId: string) => {
        return get().contexts.filter((c) => c.scope === 'local' && c.workspaceId === workspaceId);
    },

    // Context Nodes (update jsonb data column)
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
        const ctx = get().contexts.find(c => c.id === contextId);
        if (ctx) await supabase.from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        const ctx = get().contexts.find(c => c.id === contextId);
        if (ctx) await supabase.from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        const ctx = get().contexts.find(c => c.id === contextId);
        if (ctx) await supabase.from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        const ctx = get().contexts.find(c => c.id === contextId);
        if (ctx) await supabase.from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        const ctx = get().contexts.find(c => c.id === contextId);
        if (ctx) await supabase.from('contexts').update({ data: ctx.data }).eq('id', contextId);
    },

    // Objects
    addObject: async (object) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ objects: [...state.objects, { ...object, id }] }));
        await supabase.from('objects').insert({ ...toSnakeKeys({ ...object, id }), user_id: userId });
        return id;
    },

    updateObject: async (id, updates) => {
        set((state) => ({
            objects: state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
        await supabase.from('objects').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteObject: async (id) => {
        set((state) => ({
            objects: state.objects.filter((o) => o.id !== id),
            items: state.items.filter((i) => i.objectId !== id),
        }));
        await supabase.from('objects').delete().eq('id', id);
    },

    // Items
    addItem: async (item) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ items: [...state.items, { ...item, id }] }));
        await supabase.from('items').insert({ ...toSnakeKeys({ ...item, id }), user_id: userId });
        return id;
    },

    updateItem: async (id, updates) => {
        set((state) => ({
            items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
        await supabase.from('items').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteItem: async (id) => {
        set((state) => ({
            items: state.items.filter((i) => i.id !== id),
        }));
        await supabase.from('items').delete().eq('id', id);
    },

    copyItem: async (itemId, workspaceId) => {
        const item = get().items.find(i => i.id === itemId);
        if (!item) return null;

        const newId = generateId();
        const userId = get().userId;
        const newItem: ObjectItem = {
            ...item,
            id: newId,
            workspaceId,
            contextData: item.contextData ? {
                ...item.contextData,
                nodes: item.contextData.nodes?.map(n => ({ ...n, id: generateId() })) || [],
            } : undefined,
        };

        set((state) => ({ items: [...state.items, newItem] }));
        await supabase.from('items').insert({ ...toSnakeKeys(newItem), user_id: userId });
        return newId;
    },

    // === Object Availability Operations ===

    addGlobalObject: async (object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInProjects' | 'availableInWorkspaces'> & { availableInProjects?: string[]; availableInWorkspaces?: string[] }) => {
        const id = generateId();
        const userId = get().userId;
        const newObject: ObjectType = {
            ...object,
            id,
            availableGlobal: true,
            availableInProjects: object.availableInProjects || ['*'],
            availableInWorkspaces: object.availableInWorkspaces || ['*'],
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await supabase.from('objects').insert({ ...toSnakeKeys(newObject), user_id: userId });
        return id;
    },

    getGlobalObjects: () => {
        return get().objects.filter((o) => o.availableGlobal);
    },

    addProjectObject: async (projectId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInProjects' | 'availableInWorkspaces'>) => {
        const id = generateId();
        const userId = get().userId;
        const newObject: ObjectType = {
            ...object,
            id,
            availableGlobal: false,
            availableInProjects: [projectId],
            availableInWorkspaces: [],
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await supabase.from('objects').insert({ ...toSnakeKeys(newObject), user_id: userId });
        return id;
    },

    getProjectObjects: (projectId: string) => {
        return get().objects.filter((o) =>
            !o.availableGlobal &&
            (o.availableInProjects.includes('*') || o.availableInProjects.includes(projectId))
        );
    },

    addLocalObject: async (_projectId: string, workspaceId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInProjects' | 'availableInWorkspaces'>) => {
        const id = generateId();
        const userId = get().userId;
        const newObject: ObjectType = {
            ...object,
            id,
            availableGlobal: false,
            availableInProjects: [],
            availableInWorkspaces: [workspaceId],
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await supabase.from('objects').insert({ ...toSnakeKeys(newObject), user_id: userId });
        return id;
    },

    getLocalObjects: (workspaceId: string) => {
        return get().objects.filter((o) =>
            !o.availableGlobal &&
            o.availableInProjects.length === 0 &&
            (o.availableInWorkspaces.includes('*') || o.availableInWorkspaces.includes(workspaceId))
        );
    },

    getVisibleObjects: (projectId: string, workspaceId: string) => {
        return get().objects.filter((o) =>
            o.availableGlobal ||
            o.availableInProjects.includes('*') ||
            o.availableInProjects.includes(projectId) ||
            o.availableInWorkspaces.includes('*') ||
            o.availableInWorkspaces.includes(workspaceId)
        );
    },

    // Sub-workspaces
    createSubWorkspace: async (parentItemId, projectId, name) => {
        const id = generateId();
        const userId = get().userId;
        const newWorkspace: Workspace = {
            id,
            name,
            projectId,
            parentItemId,
        };
        set((state) => ({ workspaces: [...state.workspaces, newWorkspace] }));
        await supabase.from('workspaces').insert({ ...toSnakeKeys(newWorkspace), user_id: userId });
        return id;
    },

    getSubWorkspaces: (parentItemId) => {
        return get().workspaces.filter((w) => w.parentItemId === parentItemId);
    },

    // Item contextData (update jsonb context_data column)
    updateItemContext: async (itemId, nodes) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? { ...i, contextData: { ...i.contextData, nodes } }
                    : i
            ),
        }));
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
    },

    deleteItemNode: async (itemId, nodeId) => {
        set((state) => ({
            items: state.items.map((i) => {
                if (i.id !== itemId) return i;
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
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        const item = get().items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ context_data: item.contextData }).eq('id', itemId);
    },

    // AI Chat - with localStorage persistence (no DB needed)
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
            if (typeof window !== 'undefined') {
                localStorage.setItem('context-os-chat', JSON.stringify(updated));
            }
            return { chatMessages: updated };
        });
        return id;
    },

    getChatMessages: (workspaceId) => {
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

    // Pinned Object Tabs
    pinObjectTab: async (objectId) => {
        const userId = get().userId;
        set((state) => ({
            pinnedObjectTabs: state.pinnedObjectTabs.includes(objectId)
                ? state.pinnedObjectTabs
                : [...state.pinnedObjectTabs, objectId],
        }));
        const position = get().pinnedObjectTabs.indexOf(objectId);
        await supabase.from('pinned_object_tabs').upsert({
            user_id: userId,
            object_id: objectId,
            position,
        });
    },

    unpinObjectTab: async (objectId) => {
        const userId = get().userId;
        set((state) => ({
            pinnedObjectTabs: state.pinnedObjectTabs.filter((id) => id !== objectId),
        }));
        await supabase.from('pinned_object_tabs').delete()
            .eq('user_id', userId)
            .eq('object_id', objectId);
    },

    reorderPinnedTabs: async (objectIds) => {
        const userId = get().userId;
        set({ pinnedObjectTabs: objectIds });
        // Delete all and re-insert with new positions
        await supabase.from('pinned_object_tabs').delete().eq('user_id', userId);
        if (objectIds.length > 0) {
            await supabase.from('pinned_object_tabs').insert(
                objectIds.map((id, i) => ({ user_id: userId, object_id: id, position: i }))
            );
        }
    },

    // Auth
    signOut: async () => {
        await supabase.auth.signOut();
        set({
            projects: [],
            workspaces: [],
            contexts: [],
            objects: [],
            items: [],
            pinnedObjectTabs: [],
            isLoaded: false,
            userId: null,
        });
        window.location.href = '/login';
    },
}));
