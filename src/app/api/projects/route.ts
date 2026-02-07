import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function projectFromDb(row: Record<string, unknown>) {
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

// GET - List projects (sub-units, optionally filter by workspaceId)
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    let query = queryClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (user) {
      query = query.eq('user_id', user.id);
    }

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const mapped = (data || []).map(projectFromDb);
    return NextResponse.json({ success: true, data: mapped, total: mapped.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list projects' }, { status: 500 });
  }
}

// POST - Create project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.workspaceId) {
      return NextResponse.json({ success: false, error: 'workspaceId is required' }, { status: 400 });
    }

    const newProject = {
      id: generateId(),
      user_id: user.id,
      name: body.name || 'New Project',
      workspace_id: body.workspaceId,
      parent_item_id: body.parentItemId || null,
      category: body.category || '',
      category_icon: body.categoryIcon || '',
    };

    const { data, error: dbError } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: projectFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}
