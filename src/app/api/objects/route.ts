import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

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

// GET - List objects (filter by availability)
export async function GET(request: NextRequest) {
  try {
    const global = request.nextUrl.searchParams.get('global');
    const projectId = request.nextUrl.searchParams.get('projectId');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    let query = queryClient
      .from('objects')
      .select('*')
      .order('created_at', { ascending: true });

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    let objects = (data || []).map(objectFromDb);

    // Apply filters in JS to match original behavior with array contains logic
    if (global === 'true') {
      objects = objects.filter((o: Record<string, unknown>) => o.availableGlobal);
    }
    if (projectId) {
      objects = objects.filter((o: Record<string, unknown>) => {
        const projects = o.availableInProjects as string[];
        return projects.includes('*') || projects.includes(projectId);
      });
    }
    if (workspaceId) {
      objects = objects.filter((o: Record<string, unknown>) => {
        const workspaces = o.availableInWorkspaces as string[];
        return workspaces.includes('*') || workspaces.includes(workspaceId);
      });
    }

    return NextResponse.json({ success: true, data: objects, total: objects.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list objects' }, { status: 500 });
  }
}

// POST - Create object
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const newObject = {
      id: generateId(),
      user_id: user.id,
      name: body.name || 'New Object',
      icon: body.icon || '',
      category: body.category || 'Work',
      built_in: body.builtIn || false,
      available_global: body.availableGlobal ?? true,
      available_in_projects: body.availableInProjects || ['*'],
      available_in_workspaces: body.availableInWorkspaces || ['*'],
      fields: body.fields || [],
    };

    const { data, error: dbError } = await supabase
      .from('objects')
      .insert(newObject)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: objectFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create object' }, { status: 500 });
  }
}
