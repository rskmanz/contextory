import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { workspaceFromDb, projectFromDb, objectFromDb, itemFromDb, contextFromDb, connectionFromDb } from '@/lib/db-mappers';

// GET - Read all data from Supabase
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    const buildQuery = (table: string) => {
      let query = queryClient.from(table).select('*').order('created_at', { ascending: true });
      if (auth) {
        query = query.eq('user_id', auth.userId);
      }
      return query;
    };

    const [projectsRes, workspacesRes, contextsRes, objectsRes, itemsRes, connectionsRes] = await Promise.all([
      buildQuery('workspaces'),
      buildQuery('projects'),
      buildQuery('contexts'),
      buildQuery('objects'),
      buildQuery('items'),
      buildQuery('connections'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        projects: (projectsRes.data || []).map(workspaceFromDb),
        workspaces: (workspacesRes.data || []).map(projectFromDb),
        contexts: (contextsRes.data || []).map(contextFromDb),
        objects: (objectsRes.data || []).map(objectFromDb),
        items: (itemsRes.data || []).map(itemFromDb),
        connections: (connectionsRes.data || []).map(connectionFromDb),
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to load data' }, { status: 500 });
  }
}

// POST - Bulk write data to Supabase (used for data migration/import)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();

    // Upsert each entity type with user_id
    if (body.projects?.length) {
      await queryClient.from('workspaces').upsert(
        body.projects.map((p: Record<string, unknown>) => ({
          id: p.id,
          user_id: auth.userId,
          name: p.name,
          icon: p.icon,
          gradient: p.gradient,
          category: p.category,
          resources: p.resources || [],
        }))
      );
    }

    if (body.workspaces?.length) {
      await queryClient.from('projects').upsert(
        body.workspaces.map((w: Record<string, unknown>) => ({
          id: w.id,
          user_id: auth.userId,
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
      await queryClient.from('objects').upsert(
        body.objects.map((o: Record<string, unknown>) => ({
          id: o.id,
          user_id: auth.userId,
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
      await queryClient.from('contexts').upsert(
        body.contexts.map((c: Record<string, unknown>) => ({
          id: c.id,
          user_id: auth.userId,
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
      await queryClient.from('items').upsert(
        body.items.map((i: Record<string, unknown>) => ({
          id: i.id,
          user_id: auth.userId,
          name: i.name,
          object_id: i.objectId || null,
          context_id: i.contextId || null,
          project_id: i.projectId || null,
          markdown_id: i.markdownId || null,
          view_layout: i.viewLayout || 'visualization',
          field_values: i.fieldValues || {},
          context_data: i.contextData || { nodes: [] },
        }))
      );
    }

    if (body.connections?.length) {
      await queryClient.from('connections').upsert(
        body.connections.map((c: Record<string, unknown>) => ({
          id: c.id,
          user_id: auth.userId,
          name: c.name,
          type: c.type,
          url: c.url || null,
          config: c.config || {},
          icon: c.icon || null,
          scope: c.scope || 'global',
          workspace_id: c.workspaceId || null,
          project_id: c.projectId || null,
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to write data' }, { status: 500 });
  }
}
