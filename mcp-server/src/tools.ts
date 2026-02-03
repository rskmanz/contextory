import { callAPI } from './api-client.js';

// Tool definitions
export const tools = [
  // ============ PROJECTS ============
  {
    name: 'list_projects',
    description: 'List all projects in Context OS',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name' },
        icon: { type: 'string', description: 'Emoji icon (e.g., 🚀)' },
        category: { type: 'string', description: 'Category (e.g., Work, Personal)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_project',
    description: 'Update a project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Project ID' },
        name: { type: 'string', description: 'New name' },
        icon: { type: 'string', description: 'New icon' },
        category: { type: 'string', description: 'New category' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Project ID' },
      },
      required: ['id'],
    },
  },

  // ============ WORKSPACES ============
  {
    name: 'list_workspaces',
    description: 'List workspaces in a project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID to filter by' },
      },
    },
  },
  {
    name: 'create_workspace',
    description: 'Create a new workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        name: { type: 'string', description: 'Workspace name' },
        category: { type: 'string', description: 'Category' },
      },
      required: ['projectId', 'name'],
    },
  },
  {
    name: 'update_workspace',
    description: 'Update a workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Workspace ID' },
        name: { type: 'string', description: 'New name' },
        category: { type: 'string', description: 'New category' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_workspace',
    description: 'Delete a workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Workspace ID' },
      },
      required: ['id'],
    },
  },

  // ============ OBJECTS ============
  {
    name: 'list_objects',
    description: 'List objects (can filter by scope, projectId, workspaceId)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        scope: { type: 'string', description: 'Filter by scope: global, project, local' },
        projectId: { type: 'string', description: 'Filter by project ID' },
        workspaceId: { type: 'string', description: 'Filter by workspace ID' },
      },
    },
  },
  {
    name: 'create_object',
    description: 'Create a new object',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Object name' },
        icon: { type: 'string', description: 'Emoji icon' },
        scope: { type: 'string', description: 'Scope: global, project, or local' },
        projectId: { type: 'string', description: 'Project ID (for project/local scope)' },
        workspaceId: { type: 'string', description: 'Workspace ID (for local scope)' },
        category: { type: 'string', description: 'Category (Work, People, Tools, etc.)' },
      },
      required: ['name', 'scope'],
    },
  },
  {
    name: 'update_object',
    description: 'Update an object',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Object ID' },
        name: { type: 'string', description: 'New name' },
        icon: { type: 'string', description: 'New icon' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_object',
    description: 'Delete an object',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Object ID' },
      },
      required: ['id'],
    },
  },

  // ============ ITEMS ============
  {
    name: 'list_items',
    description: 'List items in an object',
    inputSchema: {
      type: 'object' as const,
      properties: {
        objectId: { type: 'string', description: 'Object ID to filter by' },
      },
    },
  },
  {
    name: 'create_item',
    description: 'Create a new item',
    inputSchema: {
      type: 'object' as const,
      properties: {
        objectId: { type: 'string', description: 'Object ID' },
        name: { type: 'string', description: 'Item name' },
        workspaceId: { type: 'string', description: 'Workspace ID (optional)' },
      },
      required: ['objectId', 'name'],
    },
  },
  {
    name: 'update_item',
    description: 'Update an item',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Item ID' },
        name: { type: 'string', description: 'New name' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_item',
    description: 'Delete an item',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Item ID' },
      },
      required: ['id'],
    },
  },

  // ============ ITEM CONTEXT (AI MAIN) ============
  {
    name: 'get_item_context',
    description: 'Get an item\'s context tree nodes',
    inputSchema: {
      type: 'object' as const,
      properties: {
        itemId: { type: 'string', description: 'Item ID' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'update_item_context',
    description: 'Replace all context nodes for an item (AI-generated tree)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        itemId: { type: 'string', description: 'Item ID' },
        nodes: {
          type: 'array',
          description: 'Context tree nodes',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Node ID' },
              content: { type: 'string', description: 'Node content' },
              parentId: { type: ['string', 'null'], description: 'Parent node ID (null for root)' },
            },
            required: ['id', 'content'],
          },
        },
      },
      required: ['itemId', 'nodes'],
    },
  },
  {
    name: 'add_context_node',
    description: 'Add a single node to an item\'s context tree',
    inputSchema: {
      type: 'object' as const,
      properties: {
        itemId: { type: 'string', description: 'Item ID' },
        content: { type: 'string', description: 'Node content' },
        parentId: { type: ['string', 'null'], description: 'Parent node ID (null for root)' },
      },
      required: ['itemId', 'content'],
    },
  },

  // ============ CONTEXTS ============
  {
    name: 'list_contexts',
    description: 'List meta contexts in a workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
      },
    },
  },
  {
    name: 'create_context',
    description: 'Create a new meta context',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
        name: { type: 'string', description: 'Context name' },
        icon: { type: 'string', description: 'Emoji icon' },
        type: { type: 'string', description: 'Type: tree, board, or canvas' },
      },
      required: ['workspaceId', 'name'],
    },
  },
  {
    name: 'update_context',
    description: 'Update a meta context',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Context ID' },
        name: { type: 'string', description: 'New name' },
        icon: { type: 'string', description: 'New icon' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_context',
    description: 'Delete a meta context (home context cannot be deleted)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Context ID' },
      },
      required: ['id'],
    },
  },

  // ============ MARKDOWN ============
  {
    name: 'get_markdown',
    description: 'Get markdown content for an item or context',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Markdown ID' },
        type: { type: 'string', description: 'Type: items or contexts' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_markdown',
    description: 'Update markdown content',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Markdown ID' },
        type: { type: 'string', description: 'Type: items or contexts' },
        content: { type: 'string', description: 'Markdown content' },
      },
      required: ['id', 'content'],
    },
  },
];

// Tool call handler
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    // Projects
    case 'list_projects':
      return callAPI('GET', '/api/projects');
    case 'create_project':
      return callAPI('POST', '/api/projects', args);
    case 'update_project':
      return callAPI('PUT', `/api/projects/${args.id}`, args);
    case 'delete_project':
      return callAPI('DELETE', `/api/projects/${args.id}`);

    // Workspaces
    case 'list_workspaces': {
      const query = args.projectId ? `?projectId=${args.projectId}` : '';
      return callAPI('GET', `/api/workspaces${query}`);
    }
    case 'create_workspace':
      return callAPI('POST', '/api/workspaces', args);
    case 'update_workspace':
      return callAPI('PUT', `/api/workspaces/${args.id}`, args);
    case 'delete_workspace':
      return callAPI('DELETE', `/api/workspaces/${args.id}`);

    // Objects
    case 'list_objects': {
      const params = new URLSearchParams();
      if (args.scope) params.append('scope', String(args.scope));
      if (args.projectId) params.append('projectId', String(args.projectId));
      if (args.workspaceId) params.append('workspaceId', String(args.workspaceId));
      const query = params.toString() ? `?${params.toString()}` : '';
      return callAPI('GET', `/api/objects${query}`);
    }
    case 'create_object':
      return callAPI('POST', '/api/objects', args);
    case 'update_object':
      return callAPI('PUT', `/api/objects/${args.id}`, args);
    case 'delete_object':
      return callAPI('DELETE', `/api/objects/${args.id}`);

    // Items
    case 'list_items': {
      const query = args.objectId ? `?objectId=${args.objectId}` : '';
      return callAPI('GET', `/api/items${query}`);
    }
    case 'create_item':
      return callAPI('POST', '/api/items', args);
    case 'update_item':
      return callAPI('PUT', `/api/items/${args.id}`, args);
    case 'delete_item':
      return callAPI('DELETE', `/api/items/${args.id}`);

    // Item Context (AI main)
    case 'get_item_context':
      return callAPI('GET', `/api/items/${args.itemId}/nodes`);
    case 'update_item_context':
      return callAPI('PUT', `/api/items/${args.itemId}/nodes`, { nodes: args.nodes });
    case 'add_context_node':
      return callAPI('POST', `/api/items/${args.itemId}/nodes`, {
        content: args.content,
        parentId: args.parentId || null,
      });

    // Contexts
    case 'list_contexts': {
      const query = args.workspaceId ? `?workspaceId=${args.workspaceId}` : '';
      return callAPI('GET', `/api/contexts${query}`);
    }
    case 'create_context':
      return callAPI('POST', '/api/contexts', args);
    case 'update_context':
      return callAPI('PUT', `/api/contexts/${args.id}`, args);
    case 'delete_context':
      return callAPI('DELETE', `/api/contexts/${args.id}`);

    // Markdown
    case 'get_markdown': {
      const type = args.type || 'items';
      return callAPI('GET', `/api/markdown?id=${args.id}&type=${type}`);
    }
    case 'update_markdown': {
      return callAPI('POST', '/api/markdown', {
        id: args.id,
        type: args.type || 'items',
        content: args.content,
      });
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
  }
}
