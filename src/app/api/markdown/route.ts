import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';

// GET /api/markdown?id=xxx&type=items|contexts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'items';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await authenticateRequest(request);
    const queryClient = createServiceClient();

    const { data } = await queryClient
      .from('markdown_content')
      .select('content')
      .eq('id', id)
      .eq('type', type)
      .single();

    return NextResponse.json({ success: true, data: { id, content: data?.content ?? '' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read markdown' }, { status: 500 });
  }
}

// POST /api/markdown
// Body: { id: string, type: 'items' | 'contexts', content: string }
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const body = await request.json();
    const { id, type = 'items', content } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    await queryClient
      .from('markdown_content')
      .upsert({
        id,
        user_id: auth.userId,
        type,
        content: content || '',
      });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to write markdown' }, { status: 500 });
  }
}

// DELETE /api/markdown?id=xxx&type=items|contexts
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const queryClient = createServiceClient();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await queryClient
      .from('markdown_content')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.userId);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete markdown' }, { status: 500 });
  }
}
