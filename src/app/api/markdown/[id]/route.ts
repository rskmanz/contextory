import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

// GET - Get markdown content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use service role client for unauthenticated access (MCP), anon client for authenticated
    const queryClient = user ? supabase : createServiceClient();

    const { data } = await queryClient
      .from('markdown_content')
      .select('content')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: { id, content: data?.content ?? '' },
    });
  } catch (e) {
    console.error('Error reading markdown:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to read markdown' },
      { status: 500 }
    );
  }
}

// PUT - Update markdown content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine type from the id pattern (items/xxx or contexts/xxx)
    const type = id.startsWith('contexts') ? 'contexts' : 'items';

    await supabase
      .from('markdown_content')
      .upsert({
        id,
        user_id: user.id,
        type,
        content: content || '',
      });

    return NextResponse.json({
      success: true,
      data: { id, content },
    });
  } catch (e) {
    console.error('Error writing markdown:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to write markdown' },
      { status: 500 }
    );
  }
}

// DELETE - Delete markdown content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    await supabase
      .from('markdown_content')
      .delete()
      .eq('id', id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (e) {
    console.error('Error deleting markdown:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to delete markdown' },
      { status: 500 }
    );
  }
}
