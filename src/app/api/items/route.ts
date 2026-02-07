import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { generateId, itemFromDb } from '@/lib/db-mappers';

// GET - List items (filter by objectId, projectId)
export async function GET(request: NextRequest) {
  try {
    const objectId = request.nextUrl.searchParams.get('objectId');
    const projectId = request.nextUrl.searchParams.get('projectId');

    const auth = await authenticateRequest(request);
    const queryClient = createServiceClient();

    let query = queryClient
      .from('items')
      .select('*')
      .order('created_at', { ascending: true });

    if (auth) {
      query = query.eq('user_id', auth.userId);
    }

    if (objectId) {
      query = query.eq('object_id', objectId);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const mapped = (data || []).map(itemFromDb);
    return NextResponse.json({ success: true, data: mapped, total: mapped.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list items' }, { status: 500 });
  }
}

// POST - Create item
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();

    if (!body.objectId) {
      return NextResponse.json({ success: false, error: 'objectId is required' }, { status: 400 });
    }

    const newItem = {
      id: generateId(),
      user_id: auth.userId,
      name: body.name || 'New Item',
      object_id: body.objectId,
      project_id: body.projectId || null,
      markdown_id: body.markdownId || null,
      field_values: body.fieldValues || {},
      context_data: body.contextData || { nodes: [] },
    };

    const { data, error: dbError } = await queryClient
      .from('items')
      .insert(newItem)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: itemFromDb(data) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}
