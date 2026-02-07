import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

// GET /api/markdown?id=xxx&type=items|contexts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'items';

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    const { data } = await queryClient
      .from('markdown_content')
      .select('content')
      .eq('id', id)
      .eq('type', type)
      .single();

    return NextResponse.json({ id, content: data?.content ?? '' });
  } catch (error) {
    console.error('Failed to read markdown:', error);
    return NextResponse.json({ error: 'Failed to read markdown' }, { status: 500 });
  }
}

// POST /api/markdown
// Body: { id: string, type: 'items' | 'contexts', content: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type = 'items', content } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabase
      .from('markdown_content')
      .upsert({
        id,
        user_id: user.id,
        type,
        content: content || '',
      });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to write markdown:', error);
    return NextResponse.json({ error: 'Failed to write markdown' }, { status: 500 });
  }
}

// DELETE /api/markdown?id=xxx&type=items|contexts
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase
      .from('markdown_content')
      .delete()
      .eq('id', id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete markdown:', error);
    return NextResponse.json({ error: 'Failed to delete markdown' }, { status: 500 });
  }
}
