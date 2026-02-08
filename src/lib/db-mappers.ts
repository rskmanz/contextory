/**
 * Shared DB row -> API response mappers.
 * Single source of truth for all entity mapping functions.
 *
 * NOTE: The DB table naming is intentionally reversed:
 * - DB `workspaces` table = App **Workspace** (top-level container)
 * - DB `projects` table = App **Project** (child, has workspace_id FK)
 * - So `contexts.project_id` FK -> `projects` table = App Workspace -> maps to `workspaceId`
 * - And `contexts.workspace_id` FK -> `workspaces` table = App Project -> maps to `projectId`
 */

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** DB `workspaces` table -> App Workspace */
export function workspaceFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    gradient: row.gradient,
    category: row.category,
    resources: row.resources ?? [],
  };
}

/** DB `projects` table -> App Project */
export function projectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspace_id,
    parentItemId: row.parent_item_id ?? null,
    category: row.category,
    categoryIcon: row.category_icon,
    type: row.type,
    resources: row.resources ?? [],
  };
}

export function objectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    category: row.category,
    builtIn: row.built_in ?? false,
    availableGlobal: row.available_global ?? false,
    availableInProjects: row.available_in_projects ?? [],
    availableInWorkspaces: row.available_in_workspaces ?? [],
    fields: row.fields ?? [],
  };
}

export function itemFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    objectId: row.object_id ?? null,
    contextId: row.context_id ?? null,
    projectId: row.project_id ?? null,
    markdownId: row.markdown_id ?? null,
    viewLayout: row.view_layout ?? 'visualization',
    fieldValues: row.field_values ?? {},
    contextData: row.context_data ?? { nodes: [] },
  };
}

/** Maps with intentional column swap (see module doc) */
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

export function connectionFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    url: row.url,
    config: row.config ?? {},
    icon: row.icon,
    scope: row.scope,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
  };
}
