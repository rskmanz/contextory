import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
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

// GET - List contexts (filter by projectId)
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    let query = queryClient
      .from('contexts')
      .select('*')
      .order('created_at', { ascending: true });

    if (user) {
      query = query.eq('user_id', user.id);
    }

    if (projectId) {
      query = query.eq('workspace_id', projectId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const mapped = (data || []).map(contextFromDb);
    return NextResponse.json({ success: true, data: mapped, total: mapped.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list contexts' }, { status: 500 });
  }
}

// POST - Create context
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate based on scope
    const scope = body.scope || 'project';
    if (scope === 'project' && !body.projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required for project contexts' }, { status: 400 });
    }
    if ((scope === 'project' || scope === 'workspace') && !body.workspaceId) {
      return NextResponse.json({ success: false, error: 'workspaceId is required for workspace/project contexts' }, { status: 400 });
    }

    const newContext = {
      id: generateId(),
      user_id: user.id,
      name: body.name || 'New Context',
      icon: body.icon || '',
      type: body.type || 'tree',
      view_style: body.viewStyle || 'mindmap',
      scope: scope,
      project_id: scope === 'global' ? null : body.workspaceId,
      workspace_id: scope === 'project' ? body.projectId : null,
      object_ids: body.objectIds || [],
      markdown_id: body.markdownId || null,
      data: body.data || { nodes: [] },
    };

    const { data, error: dbError } = await supabase
      .from('contexts')
      .insert(newContext)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: contextFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create context' }, { status: 500 });
  }
}
