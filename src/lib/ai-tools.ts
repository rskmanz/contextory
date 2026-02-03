import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Tool definitions for Context OS AI assistant
// These tools allow the AI to read and modify all data in the system

// ============ READ TOOLS ============

export const listProjectsTool = tool(
  async () => {
    // This will be handled client-side
    return { action: 'list_projects' };
  },
  {
    name: 'list_projects',
    description: 'List all projects in the system',
    schema: z.object({}),
  }
);

export const listWorkspacesTool = tool(
  async (input) => {
    return { action: 'list_workspaces', ...input };
  },
  {
    name: 'list_workspaces',
    description: 'List all workspaces, optionally filtered by project',
    schema: z.object({
      projectId: z.string().optional().describe('Filter by project ID'),
    }),
  }
);

export const listObjectsTool = tool(
  async (input) => {
    return { action: 'list_objects', ...input };
  },
  {
    name: 'list_objects',
    description: 'List all objects, optionally filtered by scope, project, or workspace',
    schema: z.object({
      scope: z.enum(['global', 'project', 'local']).optional().describe('Filter by scope'),
      projectId: z.string().optional().describe('Filter by project ID'),
      workspaceId: z.string().optional().describe('Filter by workspace ID'),
    }),
  }
);

export const listItemsTool = tool(
  async (input) => {
    return { action: 'list_items', ...input };
  },
  {
    name: 'list_items',
    description: 'List all items in an object',
    schema: z.object({
      objectId: z.string().describe('The object ID to list items from'),
    }),
  }
);

export const listContextsTool = tool(
  async (input) => {
    return { action: 'list_contexts', ...input };
  },
  {
    name: 'list_contexts',
    description: 'List all contexts in a workspace',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID to list contexts from'),
    }),
  }
);

export const getItemContextTool = tool(
  async (input) => {
    return { action: 'get_item_context', ...input };
  },
  {
    name: 'get_item_context',
    description: 'Get the context tree (nodes) of an item',
    schema: z.object({
      itemId: z.string().describe('The item ID to get context from'),
    }),
  }
);

// ============ CREATE TOOLS ============

export const createProjectTool = tool(
  async (input) => {
    return { action: 'create_project', ...input };
  },
  {
    name: 'create_project',
    description: 'Create a new project',
    schema: z.object({
      name: z.string().describe('Project name'),
      icon: z.string().optional().describe('Emoji icon for the project'),
      category: z.string().optional().describe('Project category'),
    }),
  }
);

export const createWorkspaceTool = tool(
  async (input) => {
    return { action: 'create_workspace', ...input };
  },
  {
    name: 'create_workspace',
    description: 'Create a new workspace in a project',
    schema: z.object({
      projectId: z.string().describe('The project ID to create workspace in'),
      name: z.string().describe('Workspace name'),
      category: z.string().optional().describe('Workspace category'),
      categoryIcon: z.string().optional().describe('Emoji icon for the workspace'),
    }),
  }
);

export const createObjectTool = tool(
  async (input) => {
    return { action: 'create_object', ...input };
  },
  {
    name: 'create_object',
    description: 'Create a new object (collection of items). Scope determines visibility: global (everywhere), project (within project), local (within workspace)',
    schema: z.object({
      name: z.string().describe('Object name'),
      icon: z.string().optional().describe('Emoji icon'),
      scope: z.enum(['global', 'project', 'local']).describe('Visibility scope'),
      projectId: z.string().optional().describe('Project ID (required for project/local scope)'),
      workspaceId: z.string().optional().describe('Workspace ID (required for local scope)'),
      category: z.string().optional().describe('Object category'),
    }),
  }
);

export const createItemTool = tool(
  async (input) => {
    return { action: 'create_item', ...input };
  },
  {
    name: 'create_item',
    description: 'Create a new item in an object',
    schema: z.object({
      objectId: z.string().describe('The object ID to add item to'),
      name: z.string().describe('Item name'),
      workspaceId: z.string().optional().describe('Workspace ID for local items'),
    }),
  }
);

export const createContextTool = tool(
  async (input) => {
    return { action: 'create_context', ...input };
  },
  {
    name: 'create_context',
    description: 'Create a new context (tree, board, or canvas) in a workspace',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID to create context in'),
      name: z.string().describe('Context name'),
      icon: z.string().optional().describe('Emoji icon'),
      type: z.enum(['tree', 'board', 'canvas']).describe('Context type'),
    }),
  }
);

export const addNodeTool = tool(
  async (input) => {
    return { action: 'add_node', ...input };
  },
  {
    name: 'add_node',
    description: 'Add a node to a context or item context tree',
    schema: z.object({
      targetType: z.enum(['context', 'item']).describe('Whether to add to a context or item'),
      targetId: z.string().describe('The context ID or item ID'),
      content: z.string().describe('Node content/text'),
      parentId: z.string().optional().describe('Parent node ID (for nested nodes)'),
    }),
  }
);

// ============ UPDATE TOOLS ============

export const updateProjectTool = tool(
  async (input) => {
    return { action: 'update_project', ...input };
  },
  {
    name: 'update_project',
    description: 'Update an existing project',
    schema: z.object({
      id: z.string().describe('Project ID to update'),
      name: z.string().optional().describe('New project name'),
      icon: z.string().optional().describe('New emoji icon'),
      category: z.string().optional().describe('New category'),
    }),
  }
);

export const updateWorkspaceTool = tool(
  async (input) => {
    return { action: 'update_workspace', ...input };
  },
  {
    name: 'update_workspace',
    description: 'Update an existing workspace',
    schema: z.object({
      id: z.string().describe('Workspace ID to update'),
      name: z.string().optional().describe('New workspace name'),
      category: z.string().optional().describe('New category'),
      categoryIcon: z.string().optional().describe('New emoji icon'),
    }),
  }
);

export const updateObjectTool = tool(
  async (input) => {
    return { action: 'update_object', ...input };
  },
  {
    name: 'update_object',
    description: 'Update an existing object',
    schema: z.object({
      id: z.string().describe('Object ID to update'),
      name: z.string().optional().describe('New object name'),
      icon: z.string().optional().describe('New emoji icon'),
      category: z.string().optional().describe('New category'),
    }),
  }
);

export const updateItemTool = tool(
  async (input) => {
    return { action: 'update_item', ...input };
  },
  {
    name: 'update_item',
    description: 'Update an existing item',
    schema: z.object({
      id: z.string().describe('Item ID to update'),
      name: z.string().optional().describe('New item name'),
    }),
  }
);

export const updateContextTool = tool(
  async (input) => {
    return { action: 'update_context', ...input };
  },
  {
    name: 'update_context',
    description: 'Update an existing context',
    schema: z.object({
      id: z.string().describe('Context ID to update'),
      name: z.string().optional().describe('New context name'),
      icon: z.string().optional().describe('New emoji icon'),
    }),
  }
);

export const updateNodeTool = tool(
  async (input) => {
    return { action: 'update_node', ...input };
  },
  {
    name: 'update_node',
    description: 'Update a node in a context',
    schema: z.object({
      contextId: z.string().describe('The context ID containing the node'),
      nodeId: z.string().describe('The node ID to update'),
      content: z.string().optional().describe('New node content'),
    }),
  }
);

// ============ DELETE TOOLS ============

export const deleteProjectTool = tool(
  async (input) => {
    return { action: 'delete_project', requiresConfirmation: true, ...input };
  },
  {
    name: 'delete_project',
    description: 'Delete a project and all its workspaces, contexts, and objects',
    schema: z.object({
      id: z.string().describe('Project ID to delete'),
    }),
  }
);

export const deleteWorkspaceTool = tool(
  async (input) => {
    return { action: 'delete_workspace', requiresConfirmation: true, ...input };
  },
  {
    name: 'delete_workspace',
    description: 'Delete a workspace and all its contexts',
    schema: z.object({
      id: z.string().describe('Workspace ID to delete'),
    }),
  }
);

export const deleteObjectTool = tool(
  async (input) => {
    return { action: 'delete_object', requiresConfirmation: true, ...input };
  },
  {
    name: 'delete_object',
    description: 'Delete an object and all its items',
    schema: z.object({
      id: z.string().describe('Object ID to delete'),
    }),
  }
);

export const deleteItemTool = tool(
  async (input) => {
    return { action: 'delete_item', requiresConfirmation: true, ...input };
  },
  {
    name: 'delete_item',
    description: 'Delete an item',
    schema: z.object({
      id: z.string().describe('Item ID to delete'),
    }),
  }
);

export const deleteContextTool = tool(
  async (input) => {
    return { action: 'delete_context', requiresConfirmation: true, ...input };
  },
  {
    name: 'delete_context',
    description: 'Delete a context and all its nodes',
    schema: z.object({
      id: z.string().describe('Context ID to delete'),
    }),
  }
);

export const deleteNodeTool = tool(
  async (input) => {
    return { action: 'delete_node', requiresConfirmation: true, ...input };
  },
  {
    name: 'delete_node',
    description: 'Delete a node and all its children from a context or item',
    schema: z.object({
      targetType: z.enum(['context', 'item']).describe('Whether the node is in a context or item'),
      targetId: z.string().describe('The context ID or item ID'),
      nodeId: z.string().describe('The node ID to delete'),
    }),
  }
);

// ============ EXPORT ALL TOOLS ============

export const contextOSTools = [
  // Read
  listProjectsTool,
  listWorkspacesTool,
  listObjectsTool,
  listItemsTool,
  listContextsTool,
  getItemContextTool,
  // Create
  createProjectTool,
  createWorkspaceTool,
  createObjectTool,
  createItemTool,
  createContextTool,
  addNodeTool,
  // Update
  updateProjectTool,
  updateWorkspaceTool,
  updateObjectTool,
  updateItemTool,
  updateContextTool,
  updateNodeTool,
  // Delete
  deleteProjectTool,
  deleteWorkspaceTool,
  deleteObjectTool,
  deleteItemTool,
  deleteContextTool,
  deleteNodeTool,
];

// Tool names that require user confirmation before execution
export const TOOLS_REQUIRING_CONFIRMATION = [
  'delete_project',
  'delete_workspace',
  'delete_object',
  'delete_item',
  'delete_context',
  'delete_node',
];
