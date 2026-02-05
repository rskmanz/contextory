import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './store';

// Reset store state before each test
beforeEach(() => {
  useStore.setState({
    projects: [],
    workspaces: [],
    contexts: [],
    objects: [],
    items: [],
    isLoading: false,
    isLoaded: true,
  });
});

describe('Store - Object Availability CRUD Functions', () => {
  describe('Global Objects', () => {
    it('addGlobalObject creates object with availableGlobal=true', async () => {
      const store = useStore.getState();

      const id = await store.addGlobalObject({
        name: 'Teams',
        icon: '👥',
        builtIn: false,
      });

      const objects = useStore.getState().objects;
      const createdObject = objects.find((o) => o.id === id);

      expect(createdObject).toBeDefined();
      expect(createdObject?.availableGlobal).toBe(true);
      expect(createdObject?.availableInProjects).toEqual(['*']);
      expect(createdObject?.availableInWorkspaces).toEqual(['*']);
      expect(createdObject?.name).toBe('Teams');
    });

    it('getGlobalObjects returns only availableGlobal=true objects', () => {
      useStore.setState({
        objects: [
          { id: '1', name: 'Global Tasks', icon: '📋', availableGlobal: true, availableInProjects: ['*'], availableInWorkspaces: ['*'], builtIn: false },
          { id: '2', name: 'Project Notes', icon: '📝', availableGlobal: false, availableInProjects: ['proj-1'], availableInWorkspaces: [], builtIn: false },
          { id: '3', name: 'Global Teams', icon: '👥', availableGlobal: true, availableInProjects: ['*'], availableInWorkspaces: ['*'], builtIn: false },
          { id: '4', name: 'Local Items', icon: '🎯', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-1'], builtIn: false },
        ],
      });

      const store = useStore.getState();
      const globalObjects = store.getGlobalObjects();

      expect(globalObjects).toHaveLength(2);
      expect(globalObjects.map((o) => o.name)).toEqual(['Global Tasks', 'Global Teams']);
    });
  });

  describe('Project Objects', () => {
    it('addProjectObject creates object with availableInProjects=[projectId]', async () => {
      const store = useStore.getState();

      const id = await store.addProjectObject('proj-1', {
        name: 'Features',
        icon: '⭐',
        builtIn: false,
      });

      const objects = useStore.getState().objects;
      const createdObject = objects.find((o) => o.id === id);

      expect(createdObject).toBeDefined();
      expect(createdObject?.availableGlobal).toBe(false);
      expect(createdObject?.availableInProjects).toEqual(['proj-1']);
      expect(createdObject?.availableInWorkspaces).toEqual([]);
    });

    it('getProjectObjects returns project-level objects for given project', () => {
      useStore.setState({
        objects: [
          { id: '1', name: 'Global Tasks', icon: '📋', availableGlobal: true, availableInProjects: ['*'], availableInWorkspaces: ['*'], builtIn: false },
          { id: '2', name: 'Project Notes', icon: '📝', availableGlobal: false, availableInProjects: ['proj-1'], availableInWorkspaces: [], builtIn: false },
          { id: '3', name: 'Project Features', icon: '⭐', availableGlobal: false, availableInProjects: ['proj-1'], availableInWorkspaces: [], builtIn: false },
          { id: '4', name: 'Other Project', icon: '🎯', availableGlobal: false, availableInProjects: ['proj-2'], availableInWorkspaces: [], builtIn: false },
        ],
      });

      const store = useStore.getState();
      const projectObjects = store.getProjectObjects('proj-1');

      expect(projectObjects).toHaveLength(2);
      expect(projectObjects.map((o) => o.name)).toEqual(['Project Notes', 'Project Features']);
    });
  });

  describe('Local Objects', () => {
    it('addLocalObject creates object with availableInWorkspaces=[workspaceId]', async () => {
      const store = useStore.getState();

      const id = await store.addLocalObject('proj-1', 'ws-1', {
        name: 'Tasks',
        icon: '✅',
        builtIn: false,
      });

      const objects = useStore.getState().objects;
      const createdObject = objects.find((o) => o.id === id);

      expect(createdObject).toBeDefined();
      expect(createdObject?.availableGlobal).toBe(false);
      expect(createdObject?.availableInProjects).toEqual([]);
      expect(createdObject?.availableInWorkspaces).toEqual(['ws-1']);
    });

    it('getLocalObjects returns workspace-level objects for given workspace', () => {
      useStore.setState({
        objects: [
          { id: '1', name: 'Global Tasks', icon: '📋', availableGlobal: true, availableInProjects: ['*'], availableInWorkspaces: ['*'], builtIn: false },
          { id: '2', name: 'Project Notes', icon: '📝', availableGlobal: false, availableInProjects: ['proj-1'], availableInWorkspaces: [], builtIn: false },
          { id: '3', name: 'Local Tasks', icon: '✅', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-1'], builtIn: false },
          { id: '4', name: 'Local Notes', icon: '📓', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-1'], builtIn: false },
          { id: '5', name: 'Other WS', icon: '🎯', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-2'], builtIn: false },
        ],
      });

      const store = useStore.getState();
      const localObjects = store.getLocalObjects('ws-1');

      expect(localObjects).toHaveLength(2);
      expect(localObjects.map((o) => o.name)).toEqual(['Local Tasks', 'Local Notes']);
    });
  });

  describe('Visible Objects', () => {
    it('getVisibleObjects returns objects available in workspace', () => {
      useStore.setState({
        objects: [
          { id: '1', name: 'Global Tasks', icon: '🌐', availableGlobal: true, availableInProjects: ['*'], availableInWorkspaces: ['*'], builtIn: false },
          { id: '2', name: 'Project Notes', icon: '📁', availableGlobal: false, availableInProjects: ['proj-1'], availableInWorkspaces: [], builtIn: false },
          { id: '3', name: 'Local Items', icon: '📍', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-1'], builtIn: false },
          { id: '4', name: 'Other Project', icon: '📁', availableGlobal: false, availableInProjects: ['proj-2'], availableInWorkspaces: [], builtIn: false },
          { id: '5', name: 'Other Workspace', icon: '📍', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-2'], builtIn: false },
        ],
      });

      const store = useStore.getState();
      const visibleObjects = store.getVisibleObjects('proj-1', 'ws-1');

      expect(visibleObjects).toHaveLength(3);
      expect(visibleObjects.map((o) => o.name)).toEqual(['Global Tasks', 'Project Notes', 'Local Items']);
    });
  });

  describe('Sub-workspaces', () => {
    it('createSubWorkspace creates workspace with parentItemId', async () => {
      const store = useStore.getState();

      const id = await store.createSubWorkspace('item-123', 'proj-1', 'Sub Workspace');

      const workspaces = useStore.getState().workspaces;
      const createdWorkspace = workspaces.find((w) => w.id === id);

      expect(createdWorkspace).toBeDefined();
      expect(createdWorkspace?.parentItemId).toBe('item-123');
      expect(createdWorkspace?.projectId).toBe('proj-1');
      expect(createdWorkspace?.name).toBe('Sub Workspace');
    });

    it('getSubWorkspaces returns only workspaces with matching parentItemId', () => {
      useStore.setState({
        workspaces: [
          { id: 'ws-1', name: 'Main', projectId: 'proj-1' },
          { id: 'ws-2', name: 'Sub 1', projectId: 'proj-1', parentItemId: 'item-123' },
          { id: 'ws-3', name: 'Sub 2', projectId: 'proj-1', parentItemId: 'item-123' },
          { id: 'ws-4', name: 'Other Sub', projectId: 'proj-1', parentItemId: 'item-456' },
        ],
      });

      const store = useStore.getState();
      const subWorkspaces = store.getSubWorkspaces('item-123');

      expect(subWorkspaces).toHaveLength(2);
      expect(subWorkspaces.map((w) => w.name)).toEqual(['Sub 1', 'Sub 2']);
    });
  });

  describe('Item contextData', () => {
    beforeEach(() => {
      useStore.setState({
        items: [
          { id: 'item-1', name: 'Test Item', objectId: 'obj-1', workspaceId: 'ws-1' },
        ],
      });
    });

    it('updateItemContext replaces all nodes', async () => {
      const store = useStore.getState();
      const newNodes = [
        { id: 'node-1', content: 'Root', parentId: null },
        { id: 'node-2', content: 'Child', parentId: 'node-1' },
      ];

      await store.updateItemContext('item-1', newNodes);

      const items = useStore.getState().items;
      const updatedItem = items.find((i) => i.id === 'item-1');

      expect(updatedItem?.contextData?.nodes).toHaveLength(2);
      expect(updatedItem?.contextData?.nodes).toEqual(newNodes);
    });

    it('addItemNode adds a node to existing contextData', async () => {
      // Set initial contextData
      useStore.setState({
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            objectId: 'obj-1',
            workspaceId: 'ws-1',
            contextData: { nodes: [{ id: 'existing', content: 'Existing', parentId: null }] },
          },
        ],
      });

      const store = useStore.getState();
      const nodeId = await store.addItemNode('item-1', { content: 'New Node', parentId: null });

      const items = useStore.getState().items;
      const updatedItem = items.find((i) => i.id === 'item-1');

      expect(updatedItem?.contextData?.nodes).toHaveLength(2);
      expect(updatedItem?.contextData?.nodes?.find((n) => n.id === nodeId)?.content).toBe('New Node');
    });

    it('addItemNode creates contextData if none exists', async () => {
      const store = useStore.getState();
      const nodeId = await store.addItemNode('item-1', { content: 'First Node', parentId: null });

      const items = useStore.getState().items;
      const updatedItem = items.find((i) => i.id === 'item-1');

      expect(updatedItem?.contextData?.nodes).toHaveLength(1);
      expect(updatedItem?.contextData?.nodes?.[0].id).toBe(nodeId);
    });

    it('deleteItemNode removes node and its descendants', async () => {
      useStore.setState({
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            objectId: 'obj-1',
            workspaceId: 'ws-1',
            contextData: {
              nodes: [
                { id: 'root', content: 'Root', parentId: null },
                { id: 'child-1', content: 'Child 1', parentId: 'root' },
                { id: 'child-2', content: 'Child 2', parentId: 'root' },
                { id: 'grandchild', content: 'Grandchild', parentId: 'child-1' },
                { id: 'other', content: 'Other Root', parentId: null },
              ],
            },
          },
        ],
      });

      const store = useStore.getState();
      await store.deleteItemNode('item-1', 'root');

      const items = useStore.getState().items;
      const updatedItem = items.find((i) => i.id === 'item-1');

      // Should only have 'other' left - root, child-1, child-2, and grandchild should be deleted
      expect(updatedItem?.contextData?.nodes).toHaveLength(1);
      expect(updatedItem?.contextData?.nodes?.[0].id).toBe('other');
    });
  });
});

describe('Store - Context CRUD Functions', () => {
  describe('Contexts', () => {
    it('addContext creates a new context with data', async () => {
      const store = useStore.getState();
      const id = await store.addContext({
        name: 'Roadmap',
        icon: '🗺️',
        type: 'tree',
        viewStyle: 'mindmap',
        scope: 'local',
        projectId: 'proj-1',
        workspaceId: 'ws-1',
        objectIds: ['obj-1', 'obj-2'],
        markdownId: 'roadmap-md',
        data: { nodes: [] },
      });

      const contexts = useStore.getState().contexts;
      expect(contexts).toHaveLength(1);
      expect(contexts[0].name).toBe('Roadmap');
      expect(contexts[0].objectIds).toEqual(['obj-1', 'obj-2']);
      expect(contexts[0].markdownId).toBe('roadmap-md');
    });

    it('updateContext modifies existing context including objectIds', async () => {
      useStore.setState({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Old Name',
            icon: '📝',
            type: 'tree',
            viewStyle: 'list',
            scope: 'local',
            projectId: 'proj-1',
            workspaceId: 'ws-1',
            data: { nodes: [] },
          },
        ],
      });

      const store = useStore.getState();
      await store.updateContext('ctx-1', {
        name: 'New Name',
        objectIds: ['obj-1'],
        markdownId: 'ctx-md',
      });

      const contexts = useStore.getState().contexts;
      expect(contexts[0].name).toBe('New Name');
      expect(contexts[0].objectIds).toEqual(['obj-1']);
      expect(contexts[0].markdownId).toBe('ctx-md');
    });

    it('deleteContext removes context', async () => {
      useStore.setState({
        contexts: [
          { id: 'ctx-1', name: 'Context 1', icon: '📝', type: 'tree', viewStyle: 'list', scope: 'local', projectId: 'proj-1', workspaceId: 'ws-1', data: { nodes: [] } },
          { id: 'ctx-2', name: 'Context 2', icon: '📊', type: 'board', viewStyle: 'kanban', scope: 'local', projectId: 'proj-1', workspaceId: 'ws-1', data: { nodes: [] } },
        ],
      });

      const store = useStore.getState();
      await store.deleteContext('ctx-1');

      const contexts = useStore.getState().contexts;
      expect(contexts).toHaveLength(1);
      expect(contexts[0].id).toBe('ctx-2');
    });
  });

  describe('Context Nodes', () => {
    beforeEach(() => {
      useStore.setState({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Test Context',
            icon: '📝',
            type: 'tree',
            viewStyle: 'list',
            scope: 'local',
            projectId: 'proj-1',
            workspaceId: 'ws-1',
            data: { nodes: [{ id: 'n1', content: 'Root', parentId: null }] },
          },
        ],
      });
    });

    it('addNode adds a node to context', async () => {
      const store = useStore.getState();
      const nodeId = await store.addNode('ctx-1', { content: 'Child', parentId: 'n1' });

      const contexts = useStore.getState().contexts;
      expect(contexts[0].data.nodes).toHaveLength(2);
      expect(contexts[0].data.nodes.find((n) => n.id === nodeId)?.content).toBe('Child');
    });

    it('updateNode modifies node content', async () => {
      const store = useStore.getState();
      await store.updateNode('ctx-1', 'n1', { content: 'Updated Root' });

      const contexts = useStore.getState().contexts;
      expect(contexts[0].data.nodes[0].content).toBe('Updated Root');
    });

    it('deleteNode removes node', async () => {
      const store = useStore.getState();
      await store.deleteNode('ctx-1', 'n1');

      const contexts = useStore.getState().contexts;
      expect(contexts[0].data.nodes).toHaveLength(0);
    });
  });
});

describe('Store - Basic CRUD Functions', () => {
  describe('Projects', () => {
    it('addProject creates a new project', async () => {
      const store = useStore.getState();
      const id = await store.addProject({
        name: 'New Project',
        icon: '🚀',
        gradient: 'from-blue-500 to-purple-500',
        category: 'Work',
      });

      const projects = useStore.getState().projects;
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('New Project');
      expect(projects[0].id).toBe(id);
    });

    it('updateProject modifies existing project', async () => {
      useStore.setState({
        projects: [{ id: 'proj-1', name: 'Old Name', icon: '📁', gradient: '', category: '' }],
      });

      const store = useStore.getState();
      await store.updateProject('proj-1', { name: 'New Name' });

      const projects = useStore.getState().projects;
      expect(projects[0].name).toBe('New Name');
    });

    it('deleteProject removes project and related data', async () => {
      useStore.setState({
        projects: [{ id: 'proj-1', name: 'Project', icon: '📁', gradient: '', category: '' }],
        workspaces: [{ id: 'ws-1', name: 'Workspace', projectId: 'proj-1' }],
        objects: [{ id: 'obj-1', name: 'Object', icon: '📋', availableGlobal: false, availableInProjects: ['proj-1'], availableInWorkspaces: [], builtIn: false }],
        items: [{ id: 'item-1', name: 'Item', objectId: 'obj-1', workspaceId: 'ws-1' }],
        contexts: [{ id: 'ctx-1', name: 'Context', icon: '🎯', type: 'tree', viewStyle: 'list', scope: 'local', projectId: 'proj-1', workspaceId: 'ws-1', data: { nodes: [] } }],
      });

      const store = useStore.getState();
      await store.deleteProject('proj-1');

      const state = useStore.getState();
      expect(state.projects).toHaveLength(0);
      expect(state.workspaces).toHaveLength(0);
      expect(state.objects).toHaveLength(0);
      expect(state.items).toHaveLength(0);
      expect(state.contexts).toHaveLength(0);
    });
  });

  describe('Workspaces', () => {
    it('addWorkspace creates a new workspace', async () => {
      const store = useStore.getState();
      const id = await store.addWorkspace({
        name: 'New Workspace',
        projectId: 'proj-1',
      });

      const workspaces = useStore.getState().workspaces;
      expect(workspaces).toHaveLength(1);
      expect(workspaces[0].name).toBe('New Workspace');
      expect(workspaces[0].id).toBe(id);
    });
  });

  describe('Objects', () => {
    it('addObject creates a new object', async () => {
      const store = useStore.getState();
      const id = await store.addObject({
        name: 'Tasks',
        icon: '📋',
        availableGlobal: false,
        availableInProjects: [],
        availableInWorkspaces: ['ws-1'],
        builtIn: false,
      });

      const objects = useStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0].name).toBe('Tasks');
      expect(objects[0].availableInWorkspaces).toEqual(['ws-1']);
    });

    it('deleteObject removes object and its items', async () => {
      useStore.setState({
        objects: [{ id: 'obj-1', name: 'Object', icon: '📋', availableGlobal: false, availableInProjects: [], availableInWorkspaces: ['ws-1'], builtIn: false }],
        items: [
          { id: 'item-1', name: 'Item 1', objectId: 'obj-1', workspaceId: 'ws-1' },
          { id: 'item-2', name: 'Item 2', objectId: 'obj-1', workspaceId: 'ws-1' },
          { id: 'item-3', name: 'Other Item', objectId: 'obj-2', workspaceId: 'ws-1' },
        ],
      });

      const store = useStore.getState();
      await store.deleteObject('obj-1');

      const state = useStore.getState();
      expect(state.objects).toHaveLength(0);
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('item-3');
    });
  });

  describe('Items', () => {
    it('addItem creates a new item', async () => {
      const store = useStore.getState();
      const id = await store.addItem({
        name: 'New Item',
        objectId: 'obj-1',
        workspaceId: 'ws-1',
      });

      const items = useStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('New Item');
    });

    it('updateItem modifies existing item', async () => {
      useStore.setState({
        items: [{ id: 'item-1', name: 'Old Name', objectId: 'obj-1', workspaceId: 'ws-1' }],
      });

      const store = useStore.getState();
      await store.updateItem('item-1', { name: 'New Name', markdownId: 'md-1' });

      const items = useStore.getState().items;
      expect(items[0].name).toBe('New Name');
      expect(items[0].markdownId).toBe('md-1');
    });
  });
});
