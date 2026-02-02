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

describe('Store - Phase 4 CRUD Functions', () => {
  describe('Global Objects', () => {
    it('addGlobalObject creates object with workspaceId = null', async () => {
      const store = useStore.getState();

      const id = await store.addGlobalObject('proj-1', {
        name: 'Teams',
        icon: '👥',
        builtIn: false,
      });

      const objects = useStore.getState().objects;
      const createdObject = objects.find((o) => o.id === id);

      expect(createdObject).toBeDefined();
      expect(createdObject?.projectId).toBe('proj-1');
      expect(createdObject?.workspaceId).toBeNull();
      expect(createdObject?.name).toBe('Teams');
    });

    it('getGlobalObjects returns only global objects for a project', () => {
      useStore.setState({
        objects: [
          { id: '1', name: 'Global Tasks', icon: '📋', projectId: 'proj-1', workspaceId: null, builtIn: false },
          { id: '2', name: 'Local Notes', icon: '📝', projectId: 'proj-1', workspaceId: 'ws-1', builtIn: false },
          { id: '3', name: 'Global Teams', icon: '👥', projectId: 'proj-1', workspaceId: null, builtIn: false },
          { id: '4', name: 'Other Project', icon: '🎯', projectId: 'proj-2', workspaceId: null, builtIn: false },
        ],
      });

      const store = useStore.getState();
      const globalObjects = store.getGlobalObjects('proj-1');

      expect(globalObjects).toHaveLength(2);
      expect(globalObjects.map((o) => o.name)).toEqual(['Global Tasks', 'Global Teams']);
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
        objects: [{ id: 'obj-1', name: 'Object', icon: '📋', projectId: 'proj-1', workspaceId: 'ws-1', builtIn: false }],
        items: [{ id: 'item-1', name: 'Item', objectId: 'obj-1', workspaceId: 'ws-1' }],
        contexts: [{ id: 'ctx-1', name: 'Context', icon: '🎯', type: 'tree', viewStyle: 'list', workspaceId: 'ws-1', data: { nodes: [] } }],
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
        projectId: 'proj-1',
        workspaceId: 'ws-1',
        builtIn: false,
      });

      const objects = useStore.getState().objects;
      expect(objects).toHaveLength(1);
      expect(objects[0].name).toBe('Tasks');
    });

    it('deleteObject removes object and its items', async () => {
      useStore.setState({
        objects: [{ id: 'obj-1', name: 'Object', icon: '📋', projectId: 'proj-1', workspaceId: 'ws-1', builtIn: false }],
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
