import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

function objectFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    category: row.category,
    builtIn: row.built_in ?? false,
    availableGlobal: row.available_global ?? false,
    availableInProjects: row.available_in_projects ?? [],
    availableInWorkspaces: row.available_in_workspaces ?? [],
    fields: row.fields ?? [],
  };
}

// GET - Get single object
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
      .from('objects')
      .select('*')
      .eq('id', id);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query.single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Object not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: objectFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get object' }, { status: 500 });
  }
}

// PUT - Update object
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
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.builtIn !== undefined) dbUpdates.built_in = updates.builtIn;
    if (updates.availableGlobal !== undefined) dbUpdates.available_global = updates.availableGlobal;
    if (updates.availableInProjects !== undefined) dbUpdates.available_in_projects = updates.availableInProjects;
    if (updates.availableInWorkspaces !== undefined) dbUpdates.available_in_workspaces = updates.availableInWorkspaces;
    if (updates.fields !== undefined) dbUpdates.fields = updates.fields;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('objects')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Object not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: objectFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update object' }, { status: 500 });
  }
}

// DELETE - Delete object (cascades to items via FK)
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
      .from('objects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to delete object' }, { status: 500 });
  }
}
