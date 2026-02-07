import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { contextFromDb } from '@/lib/db-mappers';

// GET - Get single context
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('contexts')
      .select('*')
      .eq('id', id);

    if (auth) {
      query = query.eq('user_id', auth.userId);
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const updates = await request.json();

    // Check if this is a home context being renamed
    if (updates.name !== undefined) {
      const { data: existing } = await queryClient
        .from('contexts')
        .select('name')
        .eq('id', id)
        .eq('user_id', auth.userId)
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

    const { data, error: dbError } = await queryClient
      .from('contexts')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', auth.userId)
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    // Protect "home" context from deletion
    const { data: existing } = await queryClient
      .from('contexts')
      .select('name')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (existing?.name === 'home') {
      return NextResponse.json({ success: false, error: 'Cannot delete home context' }, { status: 400 });
    }

    const { error: dbError } = await queryClient
      .from('contexts')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.userId);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete context' }, { status: 500 });
  }
}
