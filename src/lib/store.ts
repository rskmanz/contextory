import { create } from 'zustand';
import { Project, Workspace, Context, ObjectType, ObjectItem, ContextNode, ContextEdge } from '@/types';

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
}

export const useStore = create<AppState>((set, get) => ({
    projects: [],
    workspaces: [],
    contexts: [],
    objects: [],
    items: [],
    isLoading: false,
    isLoaded: false,

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
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            workspaces: state.workspaces.filter((w) => w.projectId !== id),
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
        set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== id),
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
}));
