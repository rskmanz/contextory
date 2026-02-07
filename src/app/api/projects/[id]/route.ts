import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { projectFromDb } from '@/lib/db-mappers';

// GET - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('projects')
      .select('*')
      .eq('id', id);

    if (auth) {
      query = query.eq('user_id', auth.userId);
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

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

    const { data, error: dbError } = await queryClient
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', auth.userId)
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const { error: dbError } = await queryClient
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.userId);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
