import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
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

// GET - List items (filter by objectId, workspaceId)
export async function GET(request: NextRequest) {
  try {
    const objectId = request.nextUrl.searchParams.get('objectId');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    let query = queryClient
      .from('items')
      .select('*')
      .order('created_at', { ascending: true });

    if (user) {
      query = query.eq('user_id', user.id);
    }

    if (objectId) {
      query = query.eq('object_id', objectId);
    }
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const mapped = (data || []).map(itemFromDb);
    return NextResponse.json({ success: true, data: mapped, total: mapped.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list items' }, { status: 500 });
  }
}

// POST - Create item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.objectId) {
      return NextResponse.json({ success: false, error: 'objectId is required' }, { status: 400 });
    }

    const newItem = {
      id: generateId(),
      user_id: user.id,
      name: body.name || 'New Item',
      object_id: body.objectId,
      workspace_id: body.workspaceId || null,
      markdown_id: body.markdownId || null,
      field_values: body.fieldValues || {},
      context_data: body.contextData || { nodes: [] },
    };

    const { data, error: dbError } = await supabase
      .from('items')
      .insert(newItem)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: itemFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}
