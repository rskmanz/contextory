import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

function projectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    gradient: row.gradient,
    category: row.category,
  };
}

function workspaceFromDb(row: Record<string, unknown>) {
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

function objectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    category: row.category,
    builtIn: row.built_in ?? false,
    availableGlobal: row.available_global ?? false,
    availableInWorkspaces: row.available_in_workspaces ?? [],
    availableInProjects: row.available_in_projects ?? [],
    fields: row.fields ?? [],
  };
}

function itemFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    objectId: row.object_id,
    workspaceId: row.workspace_id ?? null,
    markdownId: row.markdown_id ?? null,
    viewLayout: row.view_layout ?? 'visualization',
    fieldValues: row.field_values ?? {},
    contextData: row.context_data ?? { nodes: [] },
  };
}

function contextFromDb(row: Record<string, unknown>) {
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

// GET - Read all data from Supabase
export async function GET() {
  try {
    const supabase = await createClient();

    const [projectsRes, workspacesRes, contextsRes, objectsRes, itemsRes] = await Promise.all([
      supabase.from('workspaces').select('*').order('created_at', { ascending: true }),
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase.from('contexts').select('*').order('created_at', { ascending: true }),
      supabase.from('objects').select('*').order('created_at', { ascending: true }),
      supabase.from('items').select('*').order('created_at', { ascending: true }),
    ]);

    return NextResponse.json({
      projects: (projectsRes.data || []).map(projectFromDb),
      workspaces: (workspacesRes.data || []).map(workspaceFromDb),
      contexts: (contextsRes.data || []).map(contextFromDb),
      objects: (objectsRes.data || []).map(objectFromDb),
      items: (itemsRes.data || []).map(itemFromDb),
    });
  } catch (e) {
    console.error('Error reading data:', e);
    return NextResponse.json({ projects: [], workspaces: [], contexts: [], objects: [], items: [] });
  }
}

// POST - Bulk write data to Supabase (used for data migration/import)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Upsert each entity type with user_id
    if (body.projects?.length) {
      await supabase.from('workspaces').upsert(
        body.projects.map((p: Record<string, unknown>) => ({
          id: p.id,
          user_id: user.id,
          name: p.name,
          icon: p.icon,
          gradient: p.gradient,
          category: p.category,
        }))
      );
    }

    if (body.workspaces?.length) {
      await supabase.from('projects').upsert(
        body.workspaces.map((w: Record<string, unknown>) => ({
          id: w.id,
          user_id: user.id,
          name: w.name,
          workspace_id: w.workspaceId,
          parent_item_id: w.parentItemId || null,
          category: w.category,
          category_icon: w.categoryIcon,
          type: w.type,
          resources: w.resources || [],
        }))
      );
    }

    if (body.objects?.length) {
      await supabase.from('objects').upsert(
        body.objects.map((o: Record<string, unknown>) => ({
          id: o.id,
          user_id: user.id,
          name: o.name,
          icon: o.icon,
          type: o.type,
          category: o.category,
          built_in: o.builtIn || false,
          available_global: o.availableGlobal ?? false,
          available_in_workspaces: o.availableInWorkspaces || [],
          available_in_projects: o.availableInProjects || [],
          fields: o.fields || [],
        }))
      );
    }

    if (body.contexts?.length) {
      await supabase.from('contexts').upsert(
        body.contexts.map((c: Record<string, unknown>) => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          icon: c.icon,
          type: c.type,
          view_style: c.viewStyle,
          scope: c.scope,
          project_id: c.workspaceId || null,
          workspace_id: c.projectId || null,
          object_ids: c.objectIds || [],
          markdown_id: c.markdownId || null,
          data: c.data || { nodes: [] },
        }))
      );
    }

    if (body.items?.length) {
      await supabase.from('items').upsert(
        body.items.map((i: Record<string, unknown>) => ({
          id: i.id,
          user_id: user.id,
          name: i.name,
          object_id: i.objectId,
          workspace_id: i.workspaceId || null,
          markdown_id: i.markdownId || null,
          view_layout: i.viewLayout || 'visualization',
          field_values: i.fieldValues || {},
          context_data: i.contextData || { nodes: [] },
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error writing data:', e);
    return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
  }
}
