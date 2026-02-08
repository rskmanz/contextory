import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { itemFromDb } from '@/lib/db-mappers';

// GET - Get single item with contextData
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('items')
      .select('*')
      .eq('id', id);

    if (auth) {
      query = query.eq('user_id', auth.userId);
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const updates = await request.json();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.objectId !== undefined) dbUpdates.object_id = updates.objectId;
    if (updates.contextId !== undefined) dbUpdates.context_id = updates.contextId;
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.markdownId !== undefined) dbUpdates.markdown_id = updates.markdownId;
    if (updates.viewLayout !== undefined) dbUpdates.view_layout = updates.viewLayout;
    if (updates.fieldValues !== undefined) dbUpdates.field_values = updates.fieldValues;
    if (updates.contextData !== undefined) dbUpdates.context_data = updates.contextData;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await queryClient
      .from('items')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', auth.userId)
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    // Also delete sub-projects that reference this item
    await queryClient
      .from('projects')
      .delete()
      .eq('parent_item_id', id)
      .eq('user_id', auth.userId);

    const { error: dbError } = await queryClient
      .from('items')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.userId);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
