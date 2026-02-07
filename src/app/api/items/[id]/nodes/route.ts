import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ContextNode } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function itemFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    objectId: row.object_id,
    workspaceId: row.workspace_id ?? null,
    markdownId: row.markdown_id ?? null,
    viewLayout: row.view_layout ?? 'visualization',
    contextData: row.context_data ?? { nodes: [] },
  };
}

// GET - Get item's context nodes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Allow unauthenticated access for MCP server compatibility
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('items')
      .select('context_data')
      .eq('id', id);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query.single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const contextData = data.context_data as { nodes?: ContextNode[] } | null;
    return NextResponse.json({ success: true, data: contextData?.nodes || [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to get nodes' }, { status: 500 });
  }
}

// PUT - Replace all nodes (AI apply)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nodes } = await request.json();

    if (!Array.isArray(nodes)) {
      return NextResponse.json({ success: false, error: 'Nodes must be an array' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current item to merge context_data
    const { data: existing, error: fetchError } = await supabase
      .from('items')
      .select('context_data')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const currentContextData = (existing.context_data as Record<string, unknown>) || {};
    const updatedContextData = { ...currentContextData, nodes };

    const { data, error: dbError } = await supabase
      .from('items')
      .update({ context_data: updatedContextData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: 'Failed to update nodes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: itemFromDb(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to update nodes' }, { status: 500 });
  }
}

// POST - Add single node
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const nodeData = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current item
    const { data: existing, error: fetchError } = await supabase
      .from('items')
      .select('context_data')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const newNode: ContextNode = {
      id: generateId(),
      content: nodeData.content || '',
      parentId: nodeData.parentId || null,
      metadata: nodeData.metadata || {},
    };

    const currentContextData = (existing.context_data as Record<string, unknown>) || {};
    const currentNodes = (currentContextData.nodes as ContextNode[]) || [];
    const updatedContextData = { ...currentContextData, nodes: [...currentNodes, newNode] };

    await supabase
      .from('items')
      .update({ context_data: updatedContextData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, data: newNode });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to add node' }, { status: 500 });
  }
}
