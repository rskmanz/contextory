import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function workspaceFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    gradient: row.gradient,
    category: row.category,
  };
}

// GET - List all workspaces (top-level containers)
export async function GET() {
  try {
    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    let query = queryClient
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true });

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const mapped = (data || []).map(workspaceFromDb);
    return NextResponse.json({ success: true, data: mapped, total: mapped.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list workspaces' }, { status: 500 });
  }
}

// POST - Create workspace
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const newWorkspace = {
      id: generateId(),
      user_id: user.id,
      name: body.name || 'New Workspace',
      icon: body.icon || '',
      gradient: body.gradient || 'from-blue-500 to-purple-500',
      category: body.category || 'Personal',
    };

    const { data, error: dbError } = await supabase
      .from('workspaces')
      .insert(newWorkspace)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: workspaceFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create workspace' }, { status: 500 });
  }
}
