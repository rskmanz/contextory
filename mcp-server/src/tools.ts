import { callAPI } from './api-client.js';

// Tool definitions
export const tools = [
  // ============ WORKSPACES ============
  {
    name: 'list_workspaces',
    description: 'List all workspaces in Contextory',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'create_workspace',
    description: 'Create a new workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Workspace name' },
        icon: { type: 'string', description: 'Emoji icon (e.g., 🚀)' },
        category: { type: 'string', description: 'Category (e.g., Work, Personal)' },
        gradient: { type: 'string', description: 'Gradient CSS value (e.g., "from-blue-500 to-purple-500")' },
        resources: { type: 'array', description: 'Workspace resources', items: { type: 'object' } },
      },
      required: ['name'],
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
        icon: { type: 'string', description: 'New icon' },
        category: { type: 'string', description: 'New category' },
        gradient: { type: 'string', description: 'Gradient CSS value (e.g., "from-blue-500 to-purple-500")' },
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

  // ============ PROJECTS ============
  {
    name: 'list_projects',
    description: 'List projects in a workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID to filter by' },
      },
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workspaceId: { type: 'string', description: 'Workspace ID' },
        name: { type: 'string', description: 'Project name' },
        category: { type: 'string', description: 'Category' },
        parentItemId: { type: 'string', description: 'Parent item ID (optional)' },
        categoryIcon: { type: 'string', description: 'Category icon emoji' },
        type: { type: 'string', description: 'Project type' },
      },
      required: ['workspaceId', 'name'],
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
        category: { type: 'string', description: 'New category' },
        parentItemId: { type: 'string', description: 'Parent item ID' },
        categoryIcon: { type: 'string', description: 'Category icon emoji' },
        type: { type: 'string', description: 'Project type' },
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

  // ============ OBJECTS ============
  {
    name: 'list_objects',
    description: 'List objects (can filter by scope, projectId, workspaceId)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        scope: { type: 'string', description: 'Filter by scope: global, workspace, project' },
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
        scope: { type: 'string', description: 'Scope: global, workspace, or project' },
        workspaceId: { type: 'string', description: 'Workspace ID (for workspace/project scope)' },
        projectId: { type: 'string', description: 'Project ID (for project scope)' },
        category: { type: 'string', description: 'Category (Work, People, Tools, etc.)' },
        fields: {
          type: 'array',
          description: 'Field schema definitions for this object type',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Field ID' },
              name: { type: 'string', description: 'Field name' },
              type: { type: 'string', description: 'Field type: text, number, select, multiSelect, date, checkbox, url, relation' },
              options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, color: { type: 'string' } }, required: ['id', 'label'] }, description: 'Options for select/multiSelect fields' },
              required: { type: 'boolean', description: 'Whether the field is required' },
              relationObjectId: { type: 'string', description: 'Object ID for relation fields' },
            },
            required: ['id', 'name', 'type'],
          },
        },
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
        fields: {
          type: 'array',
          description: 'Field schema definitions for this object type',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Field ID' },
              name: { type: 'string', description: 'Field name' },
              type: { type: 'string', description: 'Field type: text, number, select, multiSelect, date, checkbox, url, relation' },
              options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, color: { type: 'string' } }, required: ['id', 'label'] }, description: 'Options for select/multiSelect fields' },
              required: { type: 'boolean', description: 'Whether the field is required' },
              relationObjectId: { type: 'string', description: 'Object ID for relation fields' },
            },
            required: ['id', 'name', 'type'],
          },
        },
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
        workspaceId: { type: 'string', description: 'Filter by workspace ID' },
        projectId: { type: 'string', description: 'Filter by project ID' },
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
        projectId: { type: 'string', description: 'Project ID (optional)' },
        workspaceId: { type: 'string', description: 'Workspace ID (optional)' },
        fieldValues: {
          type: 'object',
          description: 'Field values keyed by field definition ID',
        },
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
        fieldValues: {
          type: 'object',
          description: 'Field values keyed by field definition ID',
        },
        viewLayout: { type: 'string', description: 'View layout: visualization, document, table, or split' },
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
    description: 'List meta contexts in a project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
    },
  },
  {
    name: 'create_context',
    description: 'Create a new meta context',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Context name' },
        icon: { type: 'string', description: 'Emoji icon' },
        viewStyle: { type: 'string', description: 'View style: mindmap, notes, kanban, flow, grid, table, gantt, or freeform' },
        type: { type: 'string', description: 'Type: tree, board, or canvas (auto-inferred from viewStyle if omitted)' },
        scope: { type: 'string', description: 'Scope: global, workspace, or project (default: project)' },
        workspaceId: { type: 'string', description: 'Workspace ID (required for workspace/project scope)' },
        projectId: { type: 'string', description: 'Project ID (required for project scope)' },
        data: {
          type: 'object',
          description: 'Context data with nodes and edges',
          properties: {
            nodes: {
              type: 'array',
              description: 'Context nodes',
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
            edges: {
              type: 'array',
              description: 'Context edges',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Edge ID' },
                  sourceId: { type: 'string', description: 'Source node ID' },
                  targetId: { type: 'string', description: 'Target node ID' },
                },
                required: ['id', 'sourceId', 'targetId'],
              },
            },
          },
        },
      },
      required: ['name'],
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
        data: {
          type: 'object',
          description: 'Context data with nodes and edges',
          properties: {
            nodes: {
              type: 'array',
              description: 'Context nodes',
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
            edges: {
              type: 'array',
              description: 'Context edges',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Edge ID' },
                  sourceId: { type: 'string', description: 'Source node ID' },
                  targetId: { type: 'string', description: 'Target node ID' },
                },
                required: ['id', 'sourceId', 'targetId'],
              },
            },
          },
        },
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

  // ============ CONNECTIONS ============
  {
    name: 'list_connections',
    description: 'List connections (filter by scope, workspaceId, projectId)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        scope: { type: 'string', description: 'Filter by scope: global, workspace, project' },
        workspaceId: { type: 'string', description: 'Filter by workspace ID' },
        projectId: { type: 'string', description: 'Filter by project ID' },
      },
    },
  },
  {
    name: 'create_connection',
    description: 'Create a new connection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Connection name' },
        type: { type: 'string', description: 'Connection type (e.g., github, slack, custom)' },
        url: { type: 'string', description: 'Connection URL' },
        icon: { type: 'string', description: 'Emoji icon' },
        scope: { type: 'string', description: 'Scope: global, workspace, or project' },
        workspaceId: { type: 'string', description: 'Workspace ID (for workspace/project scope)' },
        projectId: { type: 'string', description: 'Project ID (for project scope)' },
        config: { type: 'object', description: 'Connection configuration object' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_connection',
    description: 'Update a connection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Connection ID' },
        name: { type: 'string', description: 'New name' },
        type: { type: 'string', description: 'New type' },
        url: { type: 'string', description: 'New URL' },
        icon: { type: 'string', description: 'New icon' },
        scope: { type: 'string', description: 'New scope' },
        workspaceId: { type: 'string', description: 'New workspace ID' },
        projectId: { type: 'string', description: 'New project ID' },
        config: { type: 'object', description: 'New configuration' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_connection',
    description: 'Delete a connection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Connection ID' },
      },
      required: ['id'],
    },
  },
];

// Tool call handler
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    // Workspaces (top-level containers)
    case 'list_workspaces':
      return callAPI('GET', '/api/workspaces');
    case 'create_workspace':
      return callAPI('POST', '/api/workspaces', args);
    case 'update_workspace':
      return callAPI('PUT', `/api/workspaces/${args.id}`, args);
    case 'delete_workspace':
      return callAPI('DELETE', `/api/workspaces/${args.id}`);

    // Projects (sub-units within workspaces)
    case 'list_projects': {
      const query = args.workspaceId ? `?workspaceId=${args.workspaceId}` : '';
      return callAPI('GET', `/api/projects${query}`);
    }
    case 'create_project':
      return callAPI('POST', '/api/projects', args);
    case 'update_project':
      return callAPI('PUT', `/api/projects/${args.id}`, args);
    case 'delete_project':
      return callAPI('DELETE', `/api/projects/${args.id}`);

    // Objects
    case 'list_objects': {
      const params = new URLSearchParams();
      if (args.scope === 'global') {
        params.append('global', 'true');
      }
      if (args.projectId) params.append('projectId', String(args.projectId));
      if (args.workspaceId) params.append('workspaceId', String(args.workspaceId));
      const query = params.toString() ? `?${params.toString()}` : '';
      return callAPI('GET', `/api/objects${query}`);
    }
    case 'create_object': {
      // Translate MCP scope/workspaceId/projectId to API fields
      const objBody: Record<string, unknown> = { ...args };
      if (args.scope === 'global') {
        objBody.availableGlobal = true;
        objBody.availableInProjects = ['*'];
        objBody.availableInWorkspaces = ['*'];
      } else if (args.scope === 'workspace' && args.workspaceId) {
        objBody.availableGlobal = false;
        objBody.availableInWorkspaces = [args.workspaceId];
        objBody.availableInProjects = ['*'];
      } else if (args.scope === 'project' && args.projectId) {
        objBody.availableGlobal = false;
        objBody.availableInProjects = [args.projectId];
        objBody.availableInWorkspaces = args.workspaceId ? [args.workspaceId] : ['*'];
      }
      delete objBody.scope;
      delete objBody.workspaceId;
      delete objBody.projectId;
      return callAPI('POST', '/api/objects', objBody);
    }
    case 'update_object':
      return callAPI('PUT', `/api/objects/${args.id}`, args);
    case 'delete_object':
      return callAPI('DELETE', `/api/objects/${args.id}`);

    // Items
    case 'list_items': {
      const params = new URLSearchParams();
      if (args.objectId) params.append('objectId', String(args.objectId));
      if (args.workspaceId) params.append('workspaceId', String(args.workspaceId));
      if (args.projectId) params.append('projectId', String(args.projectId));
      const query = params.toString() ? `?${params.toString()}` : '';
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
      const query = args.projectId ? `?projectId=${args.projectId}` : '';
      return callAPI('GET', `/api/contexts${query}`);
    }
    case 'create_context': {
      const ctxBody: Record<string, unknown> = { ...args, scope: args.scope || 'project' };
      // Auto-lookup workspaceId from projectId if not provided
      if (ctxBody.projectId && !ctxBody.workspaceId) {
        const projRes = await callAPI('GET', `/api/projects`);
        try {
          const projData = JSON.parse(projRes.content[0].text);
          const proj = projData.data?.find((p: { id: string }) => p.id === ctxBody.projectId);
          if (proj?.workspaceId) ctxBody.workspaceId = proj.workspaceId;
        } catch { /* ignore */ }
      }
      return callAPI('POST', '/api/contexts', ctxBody);
    }
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

    // Connections
    case 'list_connections': {
      const params = new URLSearchParams();
      if (args.scope) params.append('scope', String(args.scope));
      if (args.workspaceId) params.append('workspaceId', String(args.workspaceId));
      if (args.projectId) params.append('projectId', String(args.projectId));
      const query = params.toString() ? `?${params.toString()}` : '';
      return callAPI('GET', `/api/connections${query}`);
    }
    case 'create_connection':
      return callAPI('POST', '/api/connections', args);
    case 'update_connection':
      return callAPI('PUT', `/api/connections/${args.id}`, args);
    case 'delete_connection':
      return callAPI('DELETE', `/api/connections/${args.id}`);

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
  }
}
