import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============ READ TOOLS ============

export const listWorkspacesTool = tool(
  async () => {
    const sb = getSupabase();
    const { data, error } = await sb.from('workspaces').select('id, name, icon, category').order('created_at');
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'list_workspaces',
    description: 'List all workspaces',
    schema: z.object({}),
  }
);

export const listProjectsTool = tool(
  async (input) => {
    const sb = getSupabase();
    let query = sb.from('projects').select('id, name, workspace_id, category, type').order('created_at');
    if (input.workspaceId) query = query.eq('workspace_id', input.workspaceId);
    const { data, error } = await query;
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'list_projects',
    description: 'List projects, optionally filtered by workspace',
    schema: z.object({
      workspaceId: z.string().optional().describe('Filter by workspace ID'),
    }),
  }
);

export const listObjectsTool = tool(
  async (input) => {
    const sb = getSupabase();
    let query = sb.from('objects').select('id, name, icon, scope, workspace_id, project_id, category').order('created_at');
    if (input.scope) query = query.eq('scope', input.scope);
    if (input.workspaceId) query = query.eq('workspace_id', input.workspaceId);
    if (input.projectId) query = query.eq('project_id', input.projectId);
    const { data, error } = await query;
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'list_objects',
    description: 'List objects, optionally filtered by scope/workspace/project',
    schema: z.object({
      scope: z.enum(['global', 'workspace', 'project']).optional().describe('Filter by scope'),
      workspaceId: z.string().optional().describe('Filter by workspace ID'),
      projectId: z.string().optional().describe('Filter by project ID'),
    }),
  }
);

export const listItemsTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('items').select('id, name, object_id, field_values').eq('object_id', input.objectId).order('created_at');
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'list_items',
    description: 'List items in an object',
    schema: z.object({
      objectId: z.string().describe('Object ID to list items from'),
    }),
  }
);

export const listContextsTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('contexts').select('id, name, icon, type, view_style, project_id').eq('project_id', input.projectId).order('created_at');
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'list_contexts',
    description: 'List contexts in a project',
    schema: z.object({
      projectId: z.string().describe('Project ID'),
    }),
  }
);

export const getItemContextTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('item_nodes').select('id, content, parent_id').eq('item_id', input.itemId).order('created_at');
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'get_item_context',
    description: 'Get context tree nodes of an item',
    schema: z.object({
      itemId: z.string().describe('Item ID'),
    }),
  }
);

export const listConnectionsTool = tool(
  async (input) => {
    const sb = getSupabase();
    let query = sb.from('connections').select('id, name, type, url, scope, workspace_id, project_id').order('created_at');
    if (input.scope) query = query.eq('scope', input.scope);
    if (input.workspaceId) query = query.eq('workspace_id', input.workspaceId);
    if (input.projectId) query = query.eq('project_id', input.projectId);
    const { data, error } = await query;
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify(data);
  },
  {
    name: 'list_connections',
    description: 'List connections filtered by scope/workspace/project',
    schema: z.object({
      scope: z.enum(['global', 'workspace', 'project']).optional(),
      workspaceId: z.string().optional(),
      projectId: z.string().optional(),
    }),
  }
);

export const listResourcesTool = tool(
  async (input) => {
    const sb = getSupabase();
    const table = input.target === 'workspace' ? 'workspaces' : 'projects';
    const { data, error } = await sb.from(table).select('resources').eq('id', input.targetId).single();
    if (error) return JSON.stringify({ error: error.message });
    const resources = (data?.resources || []) as Array<{ id: string; name: string; type: string; url?: string }>;
    return JSON.stringify(resources.map(r => ({ id: r.id, name: r.name, type: r.type, url: r.url })));
  },
  {
    name: 'list_resources',
    description: 'List resources (URLs, notes, files) attached to a workspace or project',
    schema: z.object({
      target: z.enum(['workspace', 'project']).describe('Whether to list workspace or project resources'),
      targetId: z.string().describe('The workspace ID or project ID'),
    }),
  }
);

// ============ CREATE TOOLS ============

export const createWorkspaceTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('workspaces').insert({
      name: input.name,
      icon: input.icon || null,
      category: input.category || null,
      gradient: '',
    }).select('id, name').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: data.id, name: data.name, message: `Created workspace "${data.name}"` });
  },
  {
    name: 'create_workspace',
    description: 'Create a new workspace',
    schema: z.object({
      name: z.string().describe('Workspace name'),
      icon: z.string().optional().describe('Emoji icon'),
      category: z.string().optional().describe('Category'),
    }),
  }
);

export const createProjectTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('projects').insert({
      name: input.name,
      workspace_id: input.workspaceId,
      category: input.category || null,
      category_icon: input.categoryIcon || null,
    }).select('id, name').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: data.id, name: data.name, message: `Created project "${data.name}"` });
  },
  {
    name: 'create_project',
    description: 'Create a new project in a workspace',
    schema: z.object({
      workspaceId: z.string().describe('Workspace ID'),
      name: z.string().describe('Project name'),
      category: z.string().optional().describe('Category'),
      categoryIcon: z.string().optional().describe('Emoji icon'),
    }),
  }
);

export const createObjectTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('objects').insert({
      name: input.name,
      icon: input.icon || null,
      scope: input.scope,
      workspace_id: input.workspaceId || null,
      project_id: input.projectId || null,
      category: input.category || null,
    }).select('id, name').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: data.id, name: data.name, message: `Created object "${data.name}"` });
  },
  {
    name: 'create_object',
    description: 'Create a new object (collection of items)',
    schema: z.object({
      name: z.string().describe('Object name'),
      icon: z.string().optional().describe('Emoji icon'),
      scope: z.enum(['global', 'workspace', 'project']).describe('Visibility scope'),
      workspaceId: z.string().optional().describe('Workspace ID (for workspace/project scope)'),
      projectId: z.string().optional().describe('Project ID (for project scope)'),
      category: z.string().optional().describe('Category'),
    }),
  }
);

export const createItemTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('items').insert({
      object_id: input.objectId,
      name: input.name,
      project_id: input.projectId || null,
    }).select('id, name').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: data.id, name: data.name, type: 'item', message: `Created item "${data.name}"` });
  },
  {
    name: 'create_item',
    description: 'Create a new item in an object',
    schema: z.object({
      objectId: z.string().describe('Object ID to add item to'),
      name: z.string().describe('Item name'),
      projectId: z.string().optional().describe('Project ID'),
    }),
  }
);

export const createContextTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('contexts').insert({
      project_id: input.projectId,
      name: input.name,
      icon: input.icon || null,
      type: input.type,
    }).select('id, name').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: data.id, name: data.name, type: 'context', message: `Created context "${data.name}"` });
  },
  {
    name: 'create_context',
    description: 'Create a new context (tree, board, or canvas) in a project',
    schema: z.object({
      projectId: z.string().describe('Project ID'),
      name: z.string().describe('Context name'),
      icon: z.string().optional().describe('Emoji icon'),
      type: z.enum(['tree', 'board', 'canvas']).describe('Context type'),
    }),
  }
);

export const addNodeTool = tool(
  async (input) => {
    const sb = getSupabase();
    const table = input.targetType === 'context' ? 'context_nodes' : 'item_nodes';
    const fk = input.targetType === 'context' ? 'context_id' : 'item_id';
    const { data, error } = await sb.from(table).insert({
      [fk]: input.targetId,
      content: input.content,
      parent_id: input.parentId || null,
    }).select('id').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ nodeId: data.id, message: `Added node "${input.content.slice(0, 40)}"` });
  },
  {
    name: 'add_node',
    description: 'Add a node to a context or item context tree',
    schema: z.object({
      targetType: z.enum(['context', 'item']).describe('context or item'),
      targetId: z.string().describe('Context ID or item ID'),
      content: z.string().describe('Node content'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
  }
);

export const createConnectionTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('connections').insert({
      name: input.name,
      type: input.type,
      url: input.url || null,
      scope: input.scope,
      workspace_id: input.workspaceId || null,
      project_id: input.projectId || null,
    }).select('id, name').single();
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: data.id, name: data.name, message: `Created connection "${data.name}"` });
  },
  {
    name: 'create_connection',
    description: 'Create a new connection to an external app or service',
    schema: z.object({
      name: z.string().describe('Connection name'),
      type: z.enum(['google_docs', 'notion', 'github', 'slack', 'jira', 'linear', 'custom']).describe('Connection type'),
      url: z.string().optional().describe('URL for the connection'),
      scope: z.enum(['global', 'workspace', 'project']).describe('Visibility scope'),
      workspaceId: z.string().optional().describe('Workspace ID (for workspace/project scope)'),
      projectId: z.string().optional().describe('Project ID (for project scope)'),
    }),
  }
);

export const addResourceTool = tool(
  async (input) => {
    const sb = getSupabase();
    const table = input.target === 'workspace' ? 'workspaces' : 'projects';
    const { data: existing, error: fetchError } = await sb.from(table).select('resources').eq('id', input.targetId).single();
    if (fetchError) return JSON.stringify({ error: fetchError.message });
    const resources = (existing?.resources || []) as Array<Record<string, unknown>>;
    const newResource = {
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      name: input.name,
      type: input.type,
      url: input.url || null,
      content: input.content || null,
      addedAt: new Date().toISOString(),
    };
    const { error } = await sb.from(table).update({ resources: [...resources, newResource] }).eq('id', input.targetId);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ id: newResource.id, name: newResource.name, message: `Added resource "${newResource.name}"` });
  },
  {
    name: 'add_resource',
    description: 'Add a resource (URL, note, or research) to a workspace or project',
    schema: z.object({
      name: z.string().describe('Resource name'),
      type: z.enum(['url', 'note', 'research']).describe('Resource type'),
      url: z.string().optional().describe('URL (for url type)'),
      content: z.string().optional().describe('Text content (for note type)'),
      target: z.enum(['workspace', 'project']).describe('Add to workspace or project'),
      targetId: z.string().describe('The workspace ID or project ID'),
    }),
  }
);

// ============ UPDATE TOOLS ============

export const updateItemTool = tool(
  async (input) => {
    const sb = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    const { error } = await sb.from('items').update(updates).eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated item "${input.id}"` });
  },
  {
    name: 'update_item',
    description: 'Update an item name',
    schema: z.object({
      id: z.string().describe('Item ID'),
      name: z.string().optional().describe('New name'),
    }),
  }
);

export const updateObjectTool = tool(
  async (input) => {
    const sb = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.icon) updates.icon = input.icon;
    if (input.category) updates.category = input.category;
    const { error } = await sb.from('objects').update(updates).eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated object "${input.id}"` });
  },
  {
    name: 'update_object',
    description: 'Update an object',
    schema: z.object({
      id: z.string().describe('Object ID'),
      name: z.string().optional(),
      icon: z.string().optional(),
      category: z.string().optional(),
    }),
  }
);

export const updateWorkspaceTool = tool(
  async (input) => {
    const sb = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.icon) updates.icon = input.icon;
    if (input.category) updates.category = input.category;
    const { error } = await sb.from('workspaces').update(updates).eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated workspace "${input.id}"` });
  },
  {
    name: 'update_workspace',
    description: 'Update a workspace',
    schema: z.object({
      id: z.string().describe('Workspace ID'),
      name: z.string().optional().describe('New name'),
      icon: z.string().optional().describe('New icon'),
      category: z.string().optional().describe('New category'),
    }),
  }
);

export const updateProjectTool = tool(
  async (input) => {
    const sb = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.category) updates.category = input.category;
    if (input.categoryIcon) updates.category_icon = input.categoryIcon;
    const { error } = await sb.from('projects').update(updates).eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated project "${input.id}"` });
  },
  {
    name: 'update_project',
    description: 'Update a project',
    schema: z.object({
      id: z.string().describe('Project ID'),
      name: z.string().optional().describe('New name'),
      category: z.string().optional().describe('New category'),
      categoryIcon: z.string().optional().describe('New emoji icon'),
    }),
  }
);

export const updateContextTool = tool(
  async (input) => {
    const sb = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.icon) updates.icon = input.icon;
    const { error } = await sb.from('contexts').update(updates).eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated context "${input.id}"` });
  },
  {
    name: 'update_context',
    description: 'Update a context',
    schema: z.object({
      id: z.string().describe('Context ID'),
      name: z.string().optional().describe('New name'),
      icon: z.string().optional().describe('New icon'),
    }),
  }
);

export const updateNodeTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('context_nodes').update({ content: input.content }).eq('id', input.nodeId);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated node "${input.nodeId}"` });
  },
  {
    name: 'update_node',
    description: 'Update a node in a context',
    schema: z.object({
      contextId: z.string().describe('Context ID containing the node'),
      nodeId: z.string().describe('Node ID to update'),
      content: z.string().describe('New node content'),
    }),
  }
);

export const updateConnectionTool = tool(
  async (input) => {
    const sb = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.type) updates.type = input.type;
    if (input.url) updates.url = input.url;
    if (input.scope) updates.scope = input.scope;
    const { error } = await sb.from('connections').update(updates).eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated connection "${input.id}"` });
  },
  {
    name: 'update_connection',
    description: 'Update a connection',
    schema: z.object({
      id: z.string().describe('Connection ID'),
      name: z.string().optional().describe('New name'),
      type: z.enum(['google_docs', 'notion', 'github', 'slack', 'jira', 'linear', 'custom']).optional(),
      url: z.string().optional().describe('New URL'),
      scope: z.enum(['global', 'workspace', 'project']).optional(),
    }),
  }
);

// ============ DELETE TOOLS ============

export const deleteItemTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('items').delete().eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted item "${input.id}"` });
  },
  {
    name: 'delete_item',
    description: 'Delete an item',
    schema: z.object({
      id: z.string().describe('Item ID to delete'),
    }),
  }
);

export const deleteObjectTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('objects').delete().eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted object "${input.id}"` });
  },
  {
    name: 'delete_object',
    description: 'Delete an object and all its items',
    schema: z.object({
      id: z.string().describe('Object ID to delete'),
    }),
  }
);

export const deleteWorkspaceTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('workspaces').delete().eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted workspace "${input.id}"` });
  },
  {
    name: 'delete_workspace',
    description: 'Delete a workspace and all its projects',
    schema: z.object({
      id: z.string().describe('Workspace ID to delete'),
    }),
  }
);

export const deleteProjectTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('projects').delete().eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted project "${input.id}"` });
  },
  {
    name: 'delete_project',
    description: 'Delete a project and all its contexts',
    schema: z.object({
      id: z.string().describe('Project ID to delete'),
    }),
  }
);

export const deleteContextTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('contexts').delete().eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted context "${input.id}"` });
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
    const sb = getSupabase();
    const table = input.targetType === 'context' ? 'context_nodes' : 'item_nodes';
    const { error } = await sb.from(table).delete().eq('id', input.nodeId);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted node "${input.nodeId}"` });
  },
  {
    name: 'delete_node',
    description: 'Delete a node from a context or item',
    schema: z.object({
      targetType: z.enum(['context', 'item']).describe('Whether the node is in a context or item'),
      targetId: z.string().describe('Context ID or item ID'),
      nodeId: z.string().describe('Node ID to delete'),
    }),
  }
);

export const deleteConnectionTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('connections').delete().eq('id', input.id);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted connection "${input.id}"` });
  },
  {
    name: 'delete_connection',
    description: 'Delete a connection',
    schema: z.object({
      id: z.string().describe('Connection ID to delete'),
    }),
  }
);

export const deleteResourceTool = tool(
  async (input) => {
    const sb = getSupabase();
    const table = input.target === 'workspace' ? 'workspaces' : 'projects';
    const { data: existing, error: fetchError } = await sb.from(table).select('resources').eq('id', input.targetId).single();
    if (fetchError) return JSON.stringify({ error: fetchError.message });
    const resources = (existing?.resources || []) as Array<{ id: string }>;
    const filtered = resources.filter(r => r.id !== input.resourceId);
    const { error } = await sb.from(table).update({ resources: filtered }).eq('id', input.targetId);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Deleted resource "${input.resourceId}"` });
  },
  {
    name: 'delete_resource',
    description: 'Delete a resource from a workspace or project',
    schema: z.object({
      resourceId: z.string().describe('Resource ID to delete'),
      target: z.enum(['workspace', 'project']).describe('Whether resource is on workspace or project'),
      targetId: z.string().describe('The workspace ID or project ID'),
    }),
  }
);

// ============ MARKDOWN TOOLS ============

export const getMarkdownTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { data, error } = await sb.from('markdown_content').select('content').eq('id', input.id).eq('type', input.type).single();
    if (error) return JSON.stringify({ content: '' });
    return JSON.stringify({ content: data?.content || '' });
  },
  {
    name: 'get_markdown',
    description: 'Get markdown content for an item or context',
    schema: z.object({
      id: z.string().describe('Markdown ID'),
      type: z.enum(['items', 'contexts']).describe('Type: items or contexts'),
    }),
  }
);

export const updateMarkdownTool = tool(
  async (input) => {
    const sb = getSupabase();
    const { error } = await sb.from('markdown_content').upsert({
      id: input.id,
      type: input.type,
      content: input.content,
    }, { onConflict: 'id,type' });
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ message: `Updated markdown for ${input.type}/${input.id}` });
  },
  {
    name: 'update_markdown',
    description: 'Update markdown content for an item or context',
    schema: z.object({
      id: z.string().describe('Markdown ID'),
      type: z.enum(['items', 'contexts']).describe('Type: items or contexts'),
      content: z.string().describe('Markdown content'),
    }),
  }
);

// ============ WEB RESEARCH TOOL ============

export const webResearchTool = tool(
  async (input) => {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: input.query,
          max_results: input.maxResults || 5,
          include_answer: true,
        }),
      });
      if (!res.ok) return JSON.stringify({ error: `Search failed: ${res.status}` });
      const data = await res.json();
      const results = (data.results || []).map((r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 500),
      }));
      return JSON.stringify({
        answer: data.answer || '',
        results,
        message: `Found ${results.length} results for "${input.query}"`,
      });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : 'Search failed' });
    }
  },
  {
    name: 'web_research',
    description: 'Search the web for information on a topic. Returns summarized results that can be added as resources.',
    schema: z.object({
      query: z.string().describe('Search query'),
      maxResults: z.number().optional().describe('Max results (default 5)'),
    }),
  }
);

// ============ EXPORT ============

export const serverTools = [
  // Read
  listWorkspacesTool,
  listProjectsTool,
  listObjectsTool,
  listItemsTool,
  listContextsTool,
  getItemContextTool,
  listConnectionsTool,
  listResourcesTool,
  // Create
  createWorkspaceTool,
  createProjectTool,
  createObjectTool,
  createItemTool,
  createContextTool,
  addNodeTool,
  createConnectionTool,
  addResourceTool,
  // Update
  updateWorkspaceTool,
  updateProjectTool,
  updateObjectTool,
  updateItemTool,
  updateContextTool,
  updateNodeTool,
  updateConnectionTool,
  // Delete
  deleteWorkspaceTool,
  deleteProjectTool,
  deleteObjectTool,
  deleteItemTool,
  deleteContextTool,
  deleteNodeTool,
  deleteConnectionTool,
  deleteResourceTool,
  // Markdown
  getMarkdownTool,
  updateMarkdownTool,
  // Research
  webResearchTool,
];
