import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { generateId, connectionFromDb } from '@/lib/db-mappers';

// GET - List connections (filter by scope, workspaceId, projectId)
export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope');
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const projectId = request.nextUrl.searchParams.get('projectId');

    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('connections')
      .select('*')
      .order('created_at', { ascending: true });

    if (auth) {
      query = query.eq('user_id', auth.userId);
    }

    if (scope) {
      query = query.eq('scope', scope);
    }
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const connections = (data || []).map(connectionFromDb);

    return NextResponse.json({ success: true, data: connections, total: connections.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list connections' }, { status: 500 });
  }
}

// POST - Create connection
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();

    const newConnection = {
      id: generateId(),
      user_id: auth.userId,
      name: body.name || 'New Connection',
      type: body.type || 'custom',
      url: body.url || null,
      config: body.config || {},
      icon: body.icon || null,
      scope: body.scope || 'global',
      workspace_id: body.workspaceId || null,
      project_id: body.projectId || null,
    };

    const { data, error: dbError } = await queryClient
      .from('connections')
      .insert(newConnection)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: connectionFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create connection' }, { status: 500 });
  }
}
