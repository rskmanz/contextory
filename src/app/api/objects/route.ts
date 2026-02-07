import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { generateId, objectFromDb } from '@/lib/db-mappers';

// GET - List objects (filter by availability)
export async function GET(request: NextRequest) {
  try {
    const global = request.nextUrl.searchParams.get('global');
    const projectId = request.nextUrl.searchParams.get('projectId');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('objects')
      .select('*')
      .order('created_at', { ascending: true });

    if (auth) {
      query = query.eq('user_id', auth.userId);
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();

    const newObject = {
      id: generateId(),
      user_id: auth.userId,
      name: body.name || 'New Object',
      icon: body.icon || '',
      category: body.category || 'Work',
      built_in: body.builtIn || false,
      available_global: body.availableGlobal ?? true,
      available_in_projects: body.availableInProjects || ['*'],
      available_in_workspaces: body.availableInWorkspaces || ['*'],
      fields: body.fields || [],
    };

    const { data, error: dbError } = await queryClient
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
