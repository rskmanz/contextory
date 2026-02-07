import { useStore } from '@/lib/store';
import { Resource, Connection } from '@/types';
import { generateId } from '@/lib/utils';

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface ToolResult {
  toolCallId: string;
  result: unknown;
}

type StoreState = ReturnType<typeof useStore.getState>;

export async function executeToolCall(
  toolCall: ToolCall,
  store: StoreState
): Promise<ToolResult> {
  const { name, args, id } = toolCall;

  try {
    const result = await executeAction(name, args, store);
    return { toolCallId: id, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { toolCallId: id, result: { error: message } };
  }
}

async function executeAction(
  action: string,
  args: Record<string, unknown>,
  store: StoreState
): Promise<unknown> {
  switch (action) {
    // ===== READ =====
    case 'list_workspaces':
      return store.workspaces.map((w) => ({ id: w.id, name: w.name, icon: w.icon }));

    case 'list_projects': {
      const projects = args.workspaceId
        ? store.projects.filter((p) => p.workspaceId === args.workspaceId)
        : store.projects;
      return projects.map((p) => ({ id: p.id, name: p.name, workspaceId: p.workspaceId }));
    }

    case 'list_objects': {
      let objects = store.objects;
      if (args.scope === 'global') objects = store.getGlobalObjects();
      else if (args.scope === 'workspace' && args.workspaceId)
        objects = store.getWorkspaceObjects(args.workspaceId as string);
      else if (args.scope === 'project' && args.projectId)
        objects = store.getProjectObjects(args.projectId as string);
      return objects.map((o) => ({ id: o.id, name: o.name, icon: o.icon }));
    }

    case 'list_items': {
      const items = store.items.filter((i) => i.objectId === args.objectId);
      return items.map((i) => ({ id: i.id, name: i.name, objectId: i.objectId }));
    }

    case 'list_contexts': {
      const contexts = store.contexts.filter((c) => c.projectId === args.projectId);
      return contexts.map((c) => ({ id: c.id, name: c.name, type: c.type, viewStyle: c.viewStyle }));
    }

    case 'get_item_context': {
      const item = store.items.find((i) => i.id === args.itemId);
      return item?.contextData?.nodes || [];
    }

    case 'list_connections': {
      let connections = store.connections;
      if (args.scope) connections = connections.filter((c) => c.scope === args.scope);
      if (args.workspaceId) connections = connections.filter((c) => c.workspaceId === args.workspaceId);
      if (args.projectId) connections = connections.filter((c) => c.projectId === args.projectId);
      return connections.map((c) => ({
        id: c.id, name: c.name, type: c.type, url: c.url, scope: c.scope,
        workspaceId: c.workspaceId, projectId: c.projectId,
      }));
    }

    case 'list_resources': {
      if (args.target === 'workspace') {
        const ws = store.workspaces.find((w) => w.id === args.targetId);
        return (ws?.resources || []).map((r) => ({ id: r.id, name: r.name, type: r.type, url: r.url }));
      }
      const proj = store.projects.find((p) => p.id === args.targetId);
      return (proj?.resources || []).map((r) => ({ id: r.id, name: r.name, type: r.type, url: r.url }));
    }

    // ===== CREATE =====
    case 'create_workspace': {
      const id = await store.addWorkspace({
        name: args.name as string,
        icon: (args.icon as string) || '',
        gradient: '',
        category: (args.category as string) || '',
      });
      return { id, message: `Created workspace "${args.name}"` };
    }

    case 'create_project': {
      const id = await store.addProject({
        name: args.name as string,
        workspaceId: args.workspaceId as string,
        category: (args.category as string) || undefined,
        categoryIcon: (args.categoryIcon as string) || undefined,
      });
      return { id, message: `Created project "${args.name}"` };
    }

    case 'create_object': {
      const scope = args.scope as string;
      if (scope === 'global') {
        const id = await store.addGlobalObject({
          name: args.name as string,
          icon: (args.icon as string) || '',
          category: (args.category as string) || '',
          builtIn: false,
        });
        return { id, message: `Created global object "${args.name}"` };
      }
      if (scope === 'workspace') {
        const id = await store.addWorkspaceObject(args.workspaceId as string, {
          name: args.name as string,
          icon: (args.icon as string) || '',
          category: (args.category as string) || '',
          builtIn: false,
        });
        return { id, message: `Created workspace object "${args.name}"` };
      }
      const id = await store.addProjectObject(
        args.workspaceId as string,
        args.projectId as string,
        {
          name: args.name as string,
          icon: (args.icon as string) || '',
          category: (args.category as string) || '',
          builtIn: false,
        }
      );
      return { id, message: `Created project object "${args.name}"` };
    }

    case 'create_item': {
      const id = await store.addItem({
        name: args.name as string,
        objectId: args.objectId as string,
        projectId: (args.projectId as string) || null,
      });
      return { id, message: `Created item "${args.name}"` };
    }

    case 'create_context': {
      const id = await store.addContext({
        name: args.name as string,
        icon: (args.icon as string) || '',
        type: args.type as 'tree' | 'board' | 'canvas',
        scope: 'project',
        projectId: args.projectId as string,
        workspaceId: '',
        data: { nodes: [] },
      });
      return { id, message: `Created context "${args.name}"` };
    }

    case 'add_node': {
      if (args.targetType === 'item') {
        const nodeId = await store.addItemNode(args.targetId as string, {
          content: args.content as string,
          parentId: (args.parentId as string) || null,
        });
        return { nodeId, message: 'Added node to item context' };
      }
      const nodeId = await store.addNode(args.targetId as string, {
        content: args.content as string,
        parentId: (args.parentId as string) || null,
      });
      return { nodeId, message: 'Added node to context' };
    }

    case 'create_connection': {
      const connScope = args.scope as Connection['scope'];
      if (connScope === 'workspace' && !args.workspaceId) {
        throw new Error('workspaceId required for workspace-scoped connections');
      }
      if (connScope === 'project' && !args.projectId) {
        throw new Error('projectId required for project-scoped connections');
      }
      const connId = await store.addConnection({
        name: args.name as string,
        type: args.type as Connection['type'],
        url: (args.url as string) || undefined,
        scope: connScope,
        workspaceId: connScope !== 'global' ? (args.workspaceId as string) : undefined,
        projectId: connScope === 'project' ? (args.projectId as string) : undefined,
      });
      return { id: connId, message: `Created ${connScope} connection "${args.name}"` };
    }

    case 'add_resource': {
      const newResource: Resource = {
        id: generateId(),
        name: args.name as string,
        type: args.type as Resource['type'],
        url: (args.url as string) || undefined,
        content: (args.content as string) || undefined,
        addedAt: new Date().toISOString(),
      };

      if (args.target === 'workspace') {
        const ws = store.workspaces.find((w) => w.id === args.targetId);
        await store.updateWorkspace(args.targetId as string, {
          resources: [...(ws?.resources || []), newResource],
        });
      } else {
        const proj = store.projects.find((p) => p.id === args.targetId);
        await store.updateProject(args.targetId as string, {
          resources: [...(proj?.resources || []), newResource],
        });
      }
      return { id: newResource.id, message: `Added resource "${args.name}"` };
    }

    // ===== UPDATE =====
    case 'update_workspace': {
      const { id: wsId, ...updates } = args;
      await store.updateWorkspace(wsId as string, updates);
      return { message: `Updated workspace` };
    }

    case 'update_project': {
      const { id: projId, ...updates } = args;
      await store.updateProject(projId as string, updates);
      return { message: `Updated project` };
    }

    case 'update_object': {
      const { id: objId, ...updates } = args;
      await store.updateObject(objId as string, updates);
      return { message: `Updated object` };
    }

    case 'update_item': {
      const { id: itemId, ...updates } = args;
      await store.updateItem(itemId as string, updates);
      return { message: `Updated item` };
    }

    case 'update_context': {
      const { id: ctxId, ...updates } = args;
      await store.updateContext(ctxId as string, updates);
      return { message: `Updated context` };
    }

    case 'update_node': {
      await store.updateNode(
        args.contextId as string,
        args.nodeId as string,
        { content: args.content as string }
      );
      return { message: 'Updated node' };
    }

    case 'update_connection': {
      const { id: connId, ...updates } = args;
      await store.updateConnection(connId as string, updates);
      return { message: `Updated connection` };
    }

    // ===== DELETE =====
    case 'delete_workspace':
      await store.deleteWorkspace(args.id as string);
      return { message: 'Deleted workspace' };

    case 'delete_project':
      await store.deleteProject(args.id as string);
      return { message: 'Deleted project' };

    case 'delete_object':
      await store.deleteObject(args.id as string);
      return { message: 'Deleted object' };

    case 'delete_item':
      await store.deleteItem(args.id as string);
      return { message: 'Deleted item' };

    case 'delete_context':
      await store.deleteContext(args.id as string);
      return { message: 'Deleted context' };

    case 'delete_node':
      if (args.targetType === 'item') {
        await store.deleteItemNode(args.targetId as string, args.nodeId as string);
      } else {
        await store.deleteNode(args.targetId as string, args.nodeId as string);
      }
      return { message: 'Deleted node' };

    case 'delete_connection':
      await store.deleteConnection(args.id as string);
      return { message: 'Deleted connection' };

    case 'delete_resource': {
      if (args.target === 'workspace') {
        const ws = store.workspaces.find((w) => w.id === args.targetId);
        await store.updateWorkspace(args.targetId as string, {
          resources: (ws?.resources || []).filter((r) => r.id !== args.resourceId),
        });
      } else {
        const proj = store.projects.find((p) => p.id === args.targetId);
        await store.updateProject(args.targetId as string, {
          resources: (proj?.resources || []).filter((r) => r.id !== args.resourceId),
        });
      }
      return { message: 'Deleted resource' };
    }

    default:
      return { error: `Unknown action: ${action}` };
  }
}

