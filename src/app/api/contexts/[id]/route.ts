import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

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

// GET - Get single context
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    let query = queryClient
      .from('contexts')
      .select('*')
      .eq('id', id);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query.single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Context not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: contextFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get context' }, { status: 500 });
  }
}

// PUT - Update context
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Check if this is a home context being renamed
    if (updates.name !== undefined) {
      const { data: existing } = await supabase
        .from('contexts')
        .select('name')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (existing?.name === 'home' && updates.name !== 'home') {
        return NextResponse.json({ success: false, error: 'Cannot rename home context' }, { status: 400 });
      }
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.viewStyle !== undefined) dbUpdates.view_style = updates.viewStyle;
    if (updates.scope !== undefined) dbUpdates.scope = updates.scope;
    if (updates.workspaceId !== undefined) dbUpdates.project_id = updates.workspaceId;
    if (updates.projectId !== undefined) dbUpdates.workspace_id = updates.projectId;
    if (updates.objectIds !== undefined) dbUpdates.object_ids = updates.objectIds;
    if (updates.markdownId !== undefined) dbUpdates.markdown_id = updates.markdownId;
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('contexts')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Context not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: contextFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update context' }, { status: 500 });
  }
}

// DELETE - Delete context (protected: home cannot be deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Protect "home" context from deletion
    const { data: existing } = await supabase
      .from('contexts')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existing?.name === 'home') {
      return NextResponse.json({ success: false, error: 'Cannot delete home context' }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('contexts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete context' }, { status: 500 });
  }
}
