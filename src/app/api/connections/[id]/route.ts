import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { connectionFromDb } from '@/lib/db-mappers';

// GET - Get single connection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('connections')
      .select('*')
      .eq('id', id);

    if (auth) {
      query = query.eq('user_id', auth.userId);
    }

    const { data, error: dbError } = await query.single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: connectionFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get connection' }, { status: 500 });
  }
}

// PUT - Update connection
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
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.config !== undefined) dbUpdates.config = updates.config;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.scope !== undefined) dbUpdates.scope = updates.scope;
    if (updates.workspaceId !== undefined) dbUpdates.workspace_id = updates.workspaceId;
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await queryClient
      .from('connections')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', auth.userId)
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: connectionFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update connection' }, { status: 500 });
  }
}

// DELETE - Delete connection
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
      .from('connections')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.userId);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete connection' }, { status: 500 });
  }
}
