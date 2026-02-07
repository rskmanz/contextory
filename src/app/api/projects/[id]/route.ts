import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

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

// GET - Get single project
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
      .from('projects')
      .select('*')
      .eq('id', id);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query.single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: projectFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get project' }, { status: 500 });
  }
}

// PUT - Update project
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

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.workspaceId !== undefined) dbUpdates.workspace_id = updates.workspaceId;
    if (updates.parentItemId !== undefined) dbUpdates.parent_item_id = updates.parentItemId;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.categoryIcon !== undefined) dbUpdates.category_icon = updates.categoryIcon;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.resources !== undefined) dbUpdates.resources = updates.resources;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: projectFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project (cascades to items via FK)
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

    const { error: dbError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
