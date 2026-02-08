import { create } from 'zustand';
import { Workspace, Project, Context, ObjectType, ObjectItem, ContextNode, ContextEdge, AISettings, AIProvider, FieldDefinition, FieldValue, UserSettings, Connection, Workflow } from '@/types';
import { createClient } from '@/lib/supabase';
import { generateId, toSnakeKeys, toCamelKeys } from '@/lib/utils';
import { importObjectItemsToContext } from '@/lib/import-utils';

interface AppState {
    // Data
    workspaces: Workspace[];
    projects: Project[];
    contexts: Context[];
    objects: ObjectType[];
    items: ObjectItem[];
    pinnedObjectTabs: string[];
    isLoading: boolean;
    isLoaded: boolean;
    userId: string | null;
    userEmail: string | null;
    userAvatarUrl: string | null;

    // AI Settings
    aiSettings: AISettings;

    // User Settings
    userSettings: UserSettings;

    // Connections
    connections: Connection[];

    // Workflows
    workflows: Workflow[];

    // Load data from Supabase
    loadData: () => Promise<void>;

    // Workspaces
    addWorkspace: (workspace: Omit<Workspace, 'id'>) => Promise<string>;
    updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;

    // Projects
    addProject: (project: Omit<Project, 'id'>) => Promise<string>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    // Contexts
    addContext: (context: Omit<Context, 'id'>) => Promise<string>;
    updateContext: (id: string, updates: Partial<Context>) => Promise<void>;
    deleteContext: (id: string) => Promise<void>;
    getGlobalContexts: () => Context[];
    getWorkspaceContexts: (workspaceId: string) => Context[];
    getProjectContexts: (projectId: string) => Context[];

    // Context Nodes
    addNode: (contextId: string, node: Omit<ContextNode, 'id'>) => Promise<string>;
    addNodeForItem: (contextId: string, itemId: string, parentId?: string | null) => Promise<string>;
    updateNode: (contextId: string, nodeId: string, updates: Partial<ContextNode>) => Promise<void>;
    deleteNode: (contextId: string, nodeId: string) => Promise<void>;

    // Context Edges
    addEdge: (contextId: string, edge: Omit<ContextEdge, 'id'>) => Promise<string>;
    deleteEdge: (contextId: string, edgeId: string) => Promise<void>;

    // Object-to-Context sync
    syncObjectsToContext: (contextId: string) => Promise<void>;

    // Objects
    addObject: (object: Omit<ObjectType, 'id'>) => Promise<string>;
    updateObject: (id: string, updates: Partial<ObjectType>) => Promise<void>;
    deleteObject: (id: string) => Promise<void>;

    // Items
    addItem: (item: Omit<ObjectItem, 'id'>) => Promise<string>;
    updateItem: (id: string, updates: Partial<ObjectItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    copyItem: (itemId: string, projectId: string) => Promise<string | null>;

    // Field Schema Management (on Objects)
    addObjectField: (objectId: string, field: FieldDefinition) => Promise<void>;
    updateObjectField: (objectId: string, fieldId: string, updates: Partial<FieldDefinition>) => Promise<void>;
    deleteObjectField: (objectId: string, fieldId: string) => Promise<void>;

    // Field Value Management (on Items)
    updateItemFieldValue: (itemId: string, fieldId: string, value: FieldValue) => Promise<void>;

    // Object Availability Operations
    addGlobalObject: (object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInWorkspaces' | 'availableInProjects'>) => Promise<string>;
    getGlobalObjects: () => ObjectType[];
    addWorkspaceObject: (workspaceId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInWorkspaces' | 'availableInProjects'>) => Promise<string>;
    getWorkspaceObjects: (workspaceId: string) => ObjectType[];
    addProjectObject: (workspaceId: string, projectId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInWorkspaces' | 'availableInProjects'>) => Promise<string>;
    getProjectObjects: (projectId: string) => ObjectType[];
    getVisibleObjects: (workspaceId: string, projectId: string) => ObjectType[];

    // Sub-projects
    createSubProject: (parentItemId: string, workspaceId: string, name: string) => Promise<string>;
    getSubProjects: (parentItemId: string) => Project[];

    // Item contextData
    updateItemContext: (itemId: string, nodes: ContextNode[]) => Promise<void>;
    updateItemContextType: (itemId: string, type: import('@/types').ContextType, viewStyle: import('@/types').ViewStyle) => Promise<void>;
    addItemNode: (itemId: string, node: Omit<ContextNode, 'id'>) => Promise<string>;
    updateItemNode: (itemId: string, nodeId: string, updates: Partial<ContextNode>) => Promise<void>;
    deleteItemNode: (itemId: string, nodeId: string) => Promise<void>;
    addItemEdge: (itemId: string, edge: Omit<ContextEdge, 'id'>) => Promise<string>;
    deleteItemEdge: (itemId: string, edgeId: string) => Promise<void>;

    // AI Settings
    setAISettings: (settings: Partial<AISettings>) => void;

    // User Settings
    setUserSettings: (settings: Partial<UserSettings>) => void;

    // Connections
    addConnection: (connection: Omit<Connection, 'id'>) => Promise<string>;
    updateConnection: (id: string, updates: Partial<Connection>) => Promise<void>;
    deleteConnection: (id: string) => Promise<void>;
    getGlobalConnections: () => Connection[];
    getWorkspaceConnections: (workspaceId: string) => Connection[];
    getProjectConnections: (projectId: string) => Connection[];

    // Workflows
    addWorkflow: (workflow: Omit<Workflow, 'id'>) => Promise<string>;
    updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;

    // Pinned Object Tabs
    pinObjectTab: (objectId: string) => Promise<void>;
    unpinObjectTab: (objectId: string) => Promise<void>;
    reorderPinnedTabs: (objectIds: string[]) => Promise<void>;

    // Auth
    signOut: () => Promise<void>;
}

// Lazy singleton - avoids calling createClient() at module level during static generation
let _supabase: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
    if (!_supabase) _supabase = createClient();
    return _supabase;
};

export const useStore = create<AppState>((set, get) => ({
    workspaces: [],
    projects: [],
    contexts: [],
    objects: [],
    items: [],
    pinnedObjectTabs: [],
    connections: [],
    workflows: [],
    isLoading: false,
    isLoaded: false,
    userId: null,
    userEmail: null,
    userAvatarUrl: null,

    // AI Settings initial state
    aiSettings: {
        provider: 'openai' as AIProvider,
        model: 'gpt-4o',
    },

    // User Settings initial state (hydrate from localStorage if available)
    userSettings: (() => {
        const defaults: UserSettings = { displayName: '', defaultViewMode: 'grid', theme: 'light', showRightSidebar: true };
        if (typeof window === 'undefined') return defaults;
        try {
            const stored = localStorage.getItem('contextory_user_settings');
            if (stored) return { ...defaults, ...JSON.parse(stored) };
        } catch { /* ignore */ }
        return defaults;
    })(),

    loadData: async () => {
        if (get().isLoaded || get().isLoading) return;
        set({ isLoading: true });
        try {
            const { data: { user } } = await getSupabase().auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const sb = getSupabase();
            const [workspacesRes, projectsRes, contextsRes, objectsRes, itemsRes, pinnedRes, profileRes, connectionsRes, workflowsRes] = await Promise.all([
                sb.from('workspaces').select('*'),
                sb.from('projects').select('*'),
                sb.from('contexts').select('*'),
                sb.from('objects').select('*'),
                sb.from('items').select('*'),
                sb.from('pinned_object_tabs').select('*').order('position'),
                sb.from('profiles').select('preferences').eq('id', user.id).single(),
                sb.from('connections').select('*'),
                sb.from('workflows').select('*'),
            ]);

            // Hydrate user settings from profile preferences
            const defaults: UserSettings = { displayName: '', defaultViewMode: 'grid', theme: 'light', showRightSidebar: true };
            const prefs = (profileRes.data?.preferences as Partial<UserSettings>) || {};

            set({
                userId: user.id,
                userEmail: user.email ?? null,
                userAvatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
                workspaces: (workspacesRes.data ?? []).map(r => toCamelKeys<Workspace>(r)),
                projects: (projectsRes.data ?? []).map(r => toCamelKeys<Project>(r)),
                contexts: (contextsRes.data ?? []).map(r => ({
                    ...toCamelKeys<Context>(r),
                    workspaceId: r.project_id ?? null,
                    projectId: r.workspace_id ?? null,
                })),
                objects: (objectsRes.data ?? []).map(r => toCamelKeys<ObjectType>(r)),
                items: (itemsRes.data ?? []).map(r => toCamelKeys<ObjectItem>(r)),
                pinnedObjectTabs: (pinnedRes.data ?? []).map(r => r.object_id),
                connections: (connectionsRes.data ?? []).map(r => toCamelKeys<Connection>(r)),
                workflows: (workflowsRes.data ?? []).map(r => toCamelKeys<Workflow>(r)),
                userSettings: { ...defaults, ...prefs },
                isLoaded: true,
                isLoading: false,
            });
        } catch (error) {
            // Failed to load data - user likely not authenticated
            set({ isLoading: false });
        }
    },

    // Workspaces (was Projects - top container)
    addWorkspace: async (workspace) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ workspaces: [...state.workspaces, { ...workspace, id }] }));
        await getSupabase().from('workspaces').insert({ ...toSnakeKeys({ ...workspace, id }), user_id: userId });
        return id;
    },

    updateWorkspace: async (id, updates) => {
        set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
        await getSupabase().from('workspaces').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteWorkspace: async (id) => {
        const projectIds = get().projects
            .filter((p) => p.workspaceId === id)
            .map((p) => p.id);
        const objectsToDelete = get().objects.filter((o) =>
            !o.availableGlobal &&
            o.availableInWorkspaces.length === 1 &&
            o.availableInWorkspaces[0] === id &&
            o.availableInProjects.length === 0
        );
        const objectIds = objectsToDelete.map((o) => o.id);

        set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== id),
            projects: state.projects.filter((p) => p.workspaceId !== id),
            contexts: state.contexts.filter((c) =>
                c.workspaceId !== id && (c.projectId === null || !projectIds.includes(c.projectId))
            ),
            objects: state.objects.filter((o) => !objectIds.includes(o.id)),
            items: state.items.filter((i) => !i.objectId || !objectIds.includes(i.objectId)),
        }));

        // Delete orphaned objects first (items cascade from objects)
        if (objectIds.length > 0) {
            await getSupabase().from('objects').delete().in('id', objectIds);
        }
        // Workspace delete cascades to projects -> contexts
        await getSupabase().from('workspaces').delete().eq('id', id);
    },

    // Projects (was Workspaces - sub-unit)
    addProject: async (project) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ projects: [...state.projects, { ...project, id }] }));
        await getSupabase().from('projects').insert({ ...toSnakeKeys({ ...project, id }), user_id: userId });
        return id;
    },

    updateProject: async (id, updates) => {
        set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        await getSupabase().from('projects').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteProject: async (id) => {
        const objectsToDelete = get().objects.filter((o) =>
            !o.availableGlobal &&
            o.availableInWorkspaces.length === 0 &&
            o.availableInProjects.length === 1 &&
            o.availableInProjects[0] === id
        );
        const projectObjectIds = objectsToDelete.map((o) => o.id);

        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            contexts: state.contexts.filter((c) => c.projectId !== id),
            objects: state.objects.filter((o) => !projectObjectIds.includes(o.id)),
            items: state.items.filter((i) =>
                (!i.objectId || !projectObjectIds.includes(i.objectId)) && i.projectId !== id
            ),
        }));

        if (projectObjectIds.length > 0) {
            await getSupabase().from('objects').delete().in('id', projectObjectIds);
        }
        await getSupabase().from('projects').delete().eq('id', id);
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
        await getSupabase().from('contexts').insert({
            ...toSnakeKeys(newContext),
            project_id: newContext.workspaceId ?? null,
            workspace_id: newContext.projectId ?? null,
            user_id: userId,
        });
        return id;
    },

    updateContext: async (id, updates) => {
        set((state) => ({
            contexts: state.contexts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        const dbUpdates = toSnakeKeys(updates);
        if ('workspaceId' in updates || 'projectId' in updates) {
            delete dbUpdates.workspace_id;
            delete dbUpdates.project_id;
            if ('workspaceId' in updates) dbUpdates.project_id = updates.workspaceId;
            if ('projectId' in updates) dbUpdates.workspace_id = updates.projectId;
        }
        await getSupabase().from('contexts').update(dbUpdates).eq('id', id);
    },

    deleteContext: async (id) => {
        set((state) => ({
            contexts: state.contexts.filter((c) => c.id !== id),
        }));
        await getSupabase().from('contexts').delete().eq('id', id);
    },

    getGlobalContexts: () => {
        return get().contexts.filter((c) => c.scope === 'global');
    },

    getWorkspaceContexts: (workspaceId: string) => {
        return get().contexts.filter((c) => c.scope === 'workspace' && c.workspaceId === workspaceId);
    },

    getProjectContexts: (projectId: string) => {
        return get().contexts.filter((c) => c.scope === 'project' && c.projectId === projectId);
    },

    // Context Nodes (update jsonb data column)
    addNode: async (contextId, node) => {
        const nodeId = generateId();
        const itemId = generateId();
        const userId = get().userId;
        const ctx = get().contexts.find(c => c.id === contextId);

        // Create a backing Item for this node (Information Unit)
        const newItem: ObjectItem = {
            id: itemId,
            name: node.content,
            objectId: null,
            contextId,
            projectId: ctx?.projectId || null,
            workspaceId: ctx?.workspaceId || null,
            fieldValues: {},
        };
        set((state) => ({ items: [...state.items, newItem] }));
        getSupabase().from('items').insert({ ...toSnakeKeys(newItem), user_id: userId });

        // Create the ContextNode with sourceItemId
        const newNode = {
            ...node,
            id: nodeId,
            metadata: { ...node.metadata, sourceItemId: itemId },
        };
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: [...(c.data?.nodes || []), newNode],
                            edges: c.data?.edges || [],
                        },
                    }
                    : c
            ),
        }));
        const updatedCtx = get().contexts.find(c => c.id === contextId);
        if (updatedCtx) await getSupabase().from('contexts').update({ data: updatedCtx.data }).eq('id', contextId);
        return nodeId;
    },

    addNodeForItem: async (contextId, itemId, parentId = null) => {
        const nodeId = generateId();
        const item = get().items.find(i => i.id === itemId);
        if (!item) return '';

        const newNode: ContextNode = {
            id: nodeId,
            content: item.name,
            parentId: parentId ?? null,
            metadata: { sourceItemId: itemId },
        };

        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId
                    ? {
                        ...c,
                        data: {
                            ...c.data,
                            nodes: [...(c.data?.nodes || []), newNode],
                            edges: c.data?.edges || [],
                        },
                    }
                    : c
            ),
        }));

        const updatedCtx = get().contexts.find(c => c.id === contextId);
        if (updatedCtx) await getSupabase().from('contexts').update({ data: updatedCtx.data }).eq('id', contextId);
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
        if (ctx) await getSupabase().from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        if (ctx) await getSupabase().from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        if (ctx) await getSupabase().from('contexts').update({ data: ctx.data }).eq('id', contextId);
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
        if (ctx) await getSupabase().from('contexts').update({ data: ctx.data }).eq('id', contextId);
    },

    // Object-to-Context sync
    syncObjectsToContext: async (contextId) => {
        const context = get().contexts.find((c) => c.id === contextId);
        if (!context) return;
        const objectIds = context.objectIds || [];
        if (objectIds.length === 0) return;

        const objects = get().objects.filter((o) => objectIds.includes(o.id));
        const allItems = get().items.filter((i) => i.objectId && objectIds.includes(i.objectId));

        // Start with manual (non-imported) nodes only
        let mergedNodes = (context.data?.nodes || []).filter(
            (n) => !n.metadata?.sourceObjectId
        );

        // Import items from each linked object
        for (const obj of objects) {
            const objItems = allItems.filter((i) => i.objectId === obj.id);
            mergedNodes = importObjectItemsToContext(
                objItems,
                obj,
                mergedNodes,
            );
        }

        // Update context with merged nodes
        const updatedData = { ...context.data, nodes: mergedNodes };
        set((state) => ({
            contexts: state.contexts.map((c) =>
                c.id === contextId ? { ...c, data: updatedData } : c
            ),
        }));
        await getSupabase().from('contexts').update({ data: updatedData }).eq('id', contextId);
    },

    // Objects
    addObject: async (object) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ objects: [...state.objects, { ...object, id }] }));
        await getSupabase().from('objects').insert({ ...toSnakeKeys({ ...object, id }), user_id: userId });
        return id;
    },

    updateObject: async (id, updates) => {
        set((state) => ({
            objects: state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
        await getSupabase().from('objects').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteObject: async (id) => {
        set((state) => ({
            objects: state.objects.filter((o) => o.id !== id),
            items: state.items.filter((i) => i.objectId !== id),
        }));
        await getSupabase().from('objects').delete().eq('id', id);
    },

    // Field Schema Management (on Objects)
    addObjectField: async (objectId, field) => {
        set((state) => ({
            objects: state.objects.map((o) =>
                o.id === objectId
                    ? { ...o, fields: [...(o.fields || []), field] }
                    : o
            ),
        }));
        const obj = get().objects.find((o) => o.id === objectId);
        if (obj) {
            await getSupabase().from('objects').update({ fields: obj.fields }).eq('id', objectId);
        }
    },

    updateObjectField: async (objectId, fieldId, updates) => {
        set((state) => ({
            objects: state.objects.map((o) =>
                o.id === objectId
                    ? {
                        ...o,
                        fields: (o.fields || []).map((f) =>
                            f.id === fieldId ? { ...f, ...updates } : f
                        ),
                    }
                    : o
            ),
        }));
        const obj = get().objects.find((o) => o.id === objectId);
        if (obj) {
            await getSupabase().from('objects').update({ fields: obj.fields }).eq('id', objectId);
        }
    },

    deleteObjectField: async (objectId, fieldId) => {
        set((state) => ({
            objects: state.objects.map((o) =>
                o.id === objectId
                    ? { ...o, fields: (o.fields || []).filter((f) => f.id !== fieldId) }
                    : o
            ),
        }));
        const obj = get().objects.find((o) => o.id === objectId);
        if (obj) {
            await getSupabase().from('objects').update({ fields: obj.fields }).eq('id', objectId);
        }
    },

    // Field Value Management (on Items)
    updateItemFieldValue: async (itemId, fieldId, value) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === itemId
                    ? { ...i, fieldValues: { ...(i.fieldValues || {}), [fieldId]: value } }
                    : i
            ),
        }));
        const item = get().items.find((i) => i.id === itemId);
        if (item) {
            await getSupabase().from('items').update({ field_values: item.fieldValues }).eq('id', itemId);
        }
    },

    // Items
    addItem: async (item) => {
        const id = generateId();
        const userId = get().userId;
        set((state) => ({ items: [...state.items, { ...item, id }] }));
        const payload = { ...toSnakeKeys({ ...item, id }), user_id: userId };
        const { error } = await getSupabase().from('items').insert(payload);
        if (error) {
            // Retry without workspace_id if column doesn't exist yet
            if (error.message?.includes('workspace_id')) {
                const { workspace_id, ...safePayload } = payload as Record<string, unknown>;
                const { error: retryError } = await getSupabase().from('items').insert(safePayload);
                if (retryError) {
                    console.error('Failed to create item:', retryError.message);
                    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
                }
            } else {
                console.error('Failed to create item:', error.message);
                set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
            }
        }
        return id;
    },

    updateItem: async (id, updates) => {
        const prev = get().items.find((i) => i.id === id);
        set((state) => ({
            items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
        const { error } = await getSupabase().from('items').update(toSnakeKeys(updates)).eq('id', id);
        if (error) {
            console.error('Failed to update item:', error.message);
            if (prev) set((state) => ({
                items: state.items.map((i) => (i.id === id ? prev : i)),
            }));
        }
    },

    deleteItem: async (id) => {
        set((state) => ({
            items: state.items.filter((i) => i.id !== id),
        }));
        await getSupabase().from('items').delete().eq('id', id);
    },

    copyItem: async (itemId, projectId) => {
        const item = get().items.find(i => i.id === itemId);
        if (!item) return null;

        const newId = generateId();
        const userId = get().userId;
        const proj = get().projects.find(p => p.id === projectId);
        const newItem: ObjectItem = {
            ...item,
            id: newId,
            projectId,
            workspaceId: proj?.workspaceId || item.workspaceId || null,
            contextData: item.contextData ? {
                ...item.contextData,
                nodes: item.contextData.nodes?.map(n => ({ ...n, id: generateId() })) || [],
            } : undefined,
        };

        set((state) => ({ items: [...state.items, newItem] }));
        await getSupabase().from('items').insert({ ...toSnakeKeys(newItem), user_id: userId });
        return newId;
    },

    // === Object Availability Operations ===

    addGlobalObject: async (object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInWorkspaces' | 'availableInProjects'> & { availableInWorkspaces?: string[]; availableInProjects?: string[] }) => {
        const id = generateId();
        const userId = get().userId;
        const newObject: ObjectType = {
            ...object,
            id,
            availableGlobal: true,
            availableInWorkspaces: object.availableInWorkspaces || ['*'],
            availableInProjects: object.availableInProjects || ['*'],
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await getSupabase().from('objects').insert({ ...toSnakeKeys(newObject), user_id: userId });
        return id;
    },

    getGlobalObjects: () => {
        return get().objects.filter((o) => o.availableGlobal);
    },

    addWorkspaceObject: async (workspaceId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInWorkspaces' | 'availableInProjects'>) => {
        const id = generateId();
        const userId = get().userId;
        const newObject: ObjectType = {
            ...object,
            id,
            availableGlobal: false,
            availableInWorkspaces: [workspaceId],
            availableInProjects: [],
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await getSupabase().from('objects').insert({ ...toSnakeKeys(newObject), user_id: userId });
        return id;
    },

    getWorkspaceObjects: (workspaceId: string) => {
        return get().objects.filter((o) =>
            !o.availableGlobal &&
            (o.availableInWorkspaces.includes('*') || o.availableInWorkspaces.includes(workspaceId))
        );
    },

    addProjectObject: async (_workspaceId: string, projectId: string, object: Omit<ObjectType, 'id' | 'availableGlobal' | 'availableInWorkspaces' | 'availableInProjects'>) => {
        const id = generateId();
        const userId = get().userId;
        const newObject: ObjectType = {
            ...object,
            id,
            availableGlobal: false,
            availableInWorkspaces: [],
            availableInProjects: [projectId],
        };
        set((state) => ({ objects: [...state.objects, newObject] }));
        await getSupabase().from('objects').insert({ ...toSnakeKeys(newObject), user_id: userId });
        return id;
    },

    getProjectObjects: (projectId: string) => {
        return get().objects.filter((o) =>
            !o.availableGlobal &&
            o.availableInWorkspaces.length === 0 &&
            (o.availableInProjects.includes('*') || o.availableInProjects.includes(projectId))
        );
    },

    getVisibleObjects: (workspaceId: string, projectId: string) => {
        return get().objects.filter((o) =>
            o.availableGlobal ||
            o.availableInWorkspaces.includes('*') ||
            o.availableInWorkspaces.includes(workspaceId) ||
            o.availableInProjects.includes('*') ||
            o.availableInProjects.includes(projectId)
        );
    },

    // Sub-projects (was Sub-workspaces)
    createSubProject: async (parentItemId, workspaceId, name) => {
        const id = generateId();
        const userId = get().userId;
        const newProject: Project = {
            id,
            name,
            workspaceId,
            parentItemId,
        };
        set((state) => ({ projects: [...state.projects, newProject] }));
        await getSupabase().from('projects').insert({ ...toSnakeKeys(newProject), user_id: userId });
        return id;
    },

    getSubProjects: (parentItemId) => {
        return get().projects.filter((p) => p.parentItemId === parentItemId);
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
    },

    addItemNode: async (itemId, node) => {
        const nodeId = generateId();
        const childItemId = generateId();
        const userId = get().userId;
        const parentItem = get().items.find(i => i.id === itemId);

        // Create a backing Item for this node (Information Unit)
        const newItem: ObjectItem = {
            id: childItemId,
            name: node.content,
            objectId: null,
            contextId: null,
            projectId: parentItem?.projectId || null,
            workspaceId: parentItem?.workspaceId || null,
            fieldValues: {},
        };
        set((state) => ({ items: [...state.items, newItem] }));
        getSupabase().from('items').insert({ ...toSnakeKeys(newItem), user_id: userId });

        // Create the ContextNode with sourceItemId
        const newNode: ContextNode = {
            ...node,
            id: nodeId,
            metadata: { ...node.metadata, sourceItemId: childItemId },
        };
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
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
        if (item) await getSupabase().from('items').update({ context_data: item.contextData }).eq('id', itemId);
    },

    // AI Settings
    setAISettings: (settings) => {
        set((state) => ({
            aiSettings: { ...state.aiSettings, ...settings },
        }));
    },

    // User Settings (persisted to profiles.preferences + localStorage fallback)
    setUserSettings: (settings) => {
        const updated = { ...get().userSettings, ...settings };
        set({ userSettings: updated });
        try {
            localStorage.setItem('contextory_user_settings', JSON.stringify(updated));
        } catch { /* ignore */ }
        const userId = get().userId;
        if (userId) {
            getSupabase().from('profiles').update({ preferences: updated }).eq('id', userId).then(() => {});
        }
    },

    // Connections CRUD
    addConnection: async (connection) => {
        const id = generateId();
        const userId = get().userId;
        const newConn = { ...connection, id };
        set((state) => ({ connections: [...state.connections, newConn] }));
        await getSupabase().from('connections').insert({ ...toSnakeKeys(newConn), user_id: userId });
        return id;
    },

    updateConnection: async (id, updates) => {
        set((state) => ({
            connections: state.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        await getSupabase().from('connections').update(toSnakeKeys(updates)).eq('id', id);
    },

    deleteConnection: async (id) => {
        set((state) => ({ connections: state.connections.filter((c) => c.id !== id) }));
        await getSupabase().from('connections').delete().eq('id', id);
    },

    getGlobalConnections: () => get().connections.filter((c) => c.scope === 'global'),

    getWorkspaceConnections: (workspaceId) =>
        get().connections.filter((c) => c.scope === 'workspace' && c.workspaceId === workspaceId),

    getProjectConnections: (projectId) =>
        get().connections.filter((c) => c.scope === 'project' && c.projectId === projectId),

    // Workflows CRUD
    addWorkflow: async (workflow) => {
        const id = generateId();
        const userId = get().userId;
        const now = new Date().toISOString();
        const newWorkflow = { ...workflow, id, createdAt: now, updatedAt: now };
        set((state) => ({ workflows: [...state.workflows, newWorkflow] }));
        await getSupabase().from('workflows').insert({
            ...toSnakeKeys(newWorkflow),
            user_id: userId,
            steps: newWorkflow.steps,
        });
        return id;
    },

    updateWorkflow: async (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
            workflows: state.workflows.map((w) =>
                w.id === id ? { ...w, ...updates, updatedAt: now } : w
            ),
        }));
        const dbUpdates = toSnakeKeys({ ...updates, updatedAt: now });
        if (updates.steps) {
            dbUpdates.steps = updates.steps;
        }
        await getSupabase().from('workflows').update(dbUpdates).eq('id', id);
    },

    deleteWorkflow: async (id) => {
        set((state) => ({ workflows: state.workflows.filter((w) => w.id !== id) }));
        await getSupabase().from('workflows').delete().eq('id', id);
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
        await getSupabase().from('pinned_object_tabs').upsert({
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
        await getSupabase().from('pinned_object_tabs').delete()
            .eq('user_id', userId)
            .eq('object_id', objectId);
    },

    reorderPinnedTabs: async (objectIds) => {
        const userId = get().userId;
        set({ pinnedObjectTabs: objectIds });
        // Delete all and re-insert with new positions
        await getSupabase().from('pinned_object_tabs').delete().eq('user_id', userId);
        if (objectIds.length > 0) {
            await getSupabase().from('pinned_object_tabs').insert(
                objectIds.map((id, i) => ({ user_id: userId, object_id: id, position: i }))
            );
        }
    },

    // Auth
    signOut: async () => {
        await getSupabase().auth.signOut();
        set({
            workspaces: [],
            projects: [],
            contexts: [],
            objects: [],
            items: [],
            pinnedObjectTabs: [],
            isLoaded: false,
            userId: null,
            userEmail: null,
            userAvatarUrl: null,
        });
        window.location.href = '/login';
    },
}));
