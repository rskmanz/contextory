import { createClient } from '@/lib/supabase-server';
import { generateId } from '@/lib/utils';

export { generateId };

// Success response
export function success<T>(data: T) {
  return { success: true, data };
}

// Error response
export function error(message: string) {
  return { success: false, error: message };
}

// List response
export function list<T>(data: T[], total?: number) {
  return { success: true, data, total: total ?? data.length };
}

// Helper to get authenticated Supabase client and user_id
export async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { supabase: null, userId: null, error: 'Unauthorized' };
  }
  return { supabase, userId: user.id, error: null };
}

// Snake_case to camelCase field mapping for workspaces (DB table: projects)
export function workspaceFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    gradient: row.gradient,
    category: row.category,
  };
}

export function workspaceToDb(data: Record<string, unknown>, userId: string) {
  return {
    id: data.id,
    user_id: userId,
    name: data.name,
    icon: data.icon,
    gradient: data.gradient,
    category: data.category,
  };
}

// Project mapping (DB table: workspaces)
export function projectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.project_id,
    parentItemId: row.parent_item_id ?? null,
    category: row.category,
    categoryIcon: row.category_icon,
    type: row.type,
    resources: row.resources ?? [],
  };
}

export function projectToDb(data: Record<string, unknown>, userId: string) {
  const result: Record<string, unknown> = { user_id: userId };
  if (data.id !== undefined) result.id = data.id;
  if (data.name !== undefined) result.name = data.name;
  if (data.workspaceId !== undefined) result.project_id = data.workspaceId;
  if (data.parentItemId !== undefined) result.parent_item_id = data.parentItemId;
  if (data.category !== undefined) result.category = data.category;
  if (data.categoryIcon !== undefined) result.category_icon = data.categoryIcon;
  if (data.type !== undefined) result.type = data.type;
  if (data.resources !== undefined) result.resources = data.resources;
  return result;
}

// Object mapping
export function objectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    category: row.category,
    builtIn: row.built_in ?? false,
    availableGlobal: row.available_global ?? false,
    availableInWorkspaces: row.available_in_projects ?? [],
    availableInProjects: row.available_in_workspaces ?? [],
    fields: row.fields ?? [],
  };
}

export function objectToDb(data: Record<string, unknown>, userId: string) {
  const result: Record<string, unknown> = { user_id: userId };
  if (data.id !== undefined) result.id = data.id;
  if (data.name !== undefined) result.name = data.name;
  if (data.icon !== undefined) result.icon = data.icon;
  if (data.type !== undefined) result.type = data.type;
  if (data.category !== undefined) result.category = data.category;
  if (data.builtIn !== undefined) result.built_in = data.builtIn;
  if (data.availableGlobal !== undefined) result.available_global = data.availableGlobal;
  if (data.availableInWorkspaces !== undefined) result.available_in_projects = data.availableInWorkspaces;
  if (data.availableInProjects !== undefined) result.available_in_workspaces = data.availableInProjects;
  if (data.fields !== undefined) result.fields = data.fields;
  return result;
}

// Item mapping
export function itemFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    objectId: row.object_id,
    projectId: row.workspace_id ?? null,
    markdownId: row.markdown_id ?? null,
    viewLayout: row.view_layout ?? 'visualization',
    fieldValues: row.field_values ?? {},
    contextData: row.context_data ?? { nodes: [] },
  };
}

export function itemToDb(data: Record<string, unknown>, userId: string) {
  const result: Record<string, unknown> = { user_id: userId };
  if (data.id !== undefined) result.id = data.id;
  if (data.name !== undefined) result.name = data.name;
  if (data.objectId !== undefined) result.object_id = data.objectId;
  if (data.projectId !== undefined) result.workspace_id = data.projectId;
  if (data.markdownId !== undefined) result.markdown_id = data.markdownId;
  if (data.viewLayout !== undefined) result.view_layout = data.viewLayout;
  if (data.fieldValues !== undefined) result.field_values = data.fieldValues;
  if (data.contextData !== undefined) result.context_data = data.contextData;
  return result;
}

// Context mapping
export function contextFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    viewStyle: row.view_style,
    scope: row.scope,
    workspaceId: row.project_id ?? null,
    projectId: row.workspace_id ?? null,
    objectIds: row.object_ids ?? [],
    markdownId: row.markdown_id ?? null,
    data: row.data ?? { nodes: [], edges: [] },
  };
}

export function contextToDb(data: Record<string, unknown>, userId: string) {
  const result: Record<string, unknown> = { user_id: userId };
  if (data.id !== undefined) result.id = data.id;
  if (data.name !== undefined) result.name = data.name;
  if (data.icon !== undefined) result.icon = data.icon;
  if (data.type !== undefined) result.type = data.type;
  if (data.viewStyle !== undefined) result.view_style = data.viewStyle;
  if (data.scope !== undefined) result.scope = data.scope;
  if (data.workspaceId !== undefined) result.project_id = data.workspaceId;
  if (data.projectId !== undefined) result.workspace_id = data.projectId;
  if (data.objectIds !== undefined) result.object_ids = data.objectIds;
  if (data.markdownId !== undefined) result.markdown_id = data.markdownId;
  if (data.data !== undefined) result.data = data.data;
  return result;
}
