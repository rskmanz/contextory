import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

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

// GET - Get single item with contextData
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
      .from('items')
      .select('*')
      .eq('id', id);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query.single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: itemFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get item' }, { status: 500 });
  }
}

// PUT - Update item
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
    if (updates.objectId !== undefined) dbUpdates.object_id = updates.objectId;
    if (updates.workspaceId !== undefined) dbUpdates.workspace_id = updates.workspaceId;
    if (updates.markdownId !== undefined) dbUpdates.markdown_id = updates.markdownId;
    if (updates.viewLayout !== undefined) dbUpdates.view_layout = updates.viewLayout;
    if (updates.fieldValues !== undefined) dbUpdates.field_values = updates.fieldValues;
    if (updates.contextData !== undefined) dbUpdates.context_data = updates.contextData;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('items')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: itemFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE - Delete item
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

    // Also delete sub-projects that reference this item
    await supabase
      .from('projects')
      .delete()
      .eq('parent_item_id', id)
      .eq('user_id', user.id);

    const { error: dbError } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
