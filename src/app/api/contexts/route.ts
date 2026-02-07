import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { getContextTypeFromViewStyle, ViewStyle } from '@/types';
import { generateId, contextFromDb } from '@/lib/db-mappers';

// GET - List contexts (filter by projectId)
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('contexts')
      .select('*')
      .order('created_at', { ascending: true });

    if (auth) {
      query = query.eq('user_id', auth.userId);
    }

    if (projectId) {
      query = query.eq('workspace_id', projectId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const mapped = (data || []).map(contextFromDb);
    return NextResponse.json({ success: true, data: mapped, total: mapped.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list contexts' }, { status: 500 });
  }
}

// POST - Create context
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();

    // Validate based on scope
    const scope = body.scope || 'project';
    if (scope === 'project' && !body.projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required for project contexts' }, { status: 400 });
    }
    if ((scope === 'project' || scope === 'workspace') && !body.workspaceId) {
      return NextResponse.json({ success: false, error: 'workspaceId is required for workspace/project contexts' }, { status: 400 });
    }

    const newContext = {
      id: generateId(),
      user_id: auth.userId,
      name: body.name || 'New Context',
      icon: body.icon || '',
      type: body.type || (body.viewStyle ? getContextTypeFromViewStyle(body.viewStyle as ViewStyle) : 'tree'),
      view_style: body.viewStyle || 'notes',
      scope: scope,
      project_id: scope === 'global' ? null : body.workspaceId,
      workspace_id: scope === 'project' ? body.projectId : null,
      object_ids: body.objectIds || [],
      markdown_id: body.markdownId || null,
      data: body.data || { nodes: [] },
    };

    const { data, error: dbError } = await queryClient
      .from('contexts')
      .insert(newContext)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: contextFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create context' }, { status: 500 });
  }
}
