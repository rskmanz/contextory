import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { generateId, workspaceFromDb } from '@/lib/db-mappers';

// GET - List all workspaces (top-level containers)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true });

    if (auth) {
      query = query.eq('user_id', auth.userId);
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
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();

    const newWorkspace = {
      id: generateId(),
      user_id: auth.userId,
      name: body.name || 'New Workspace',
      icon: body.icon || '',
      gradient: body.gradient || 'from-blue-500 to-purple-500',
      category: body.category || 'Personal',
      resources: body.resources || [],
    };

    const { data, error: dbError } = await queryClient
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
