import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MARKDOWN_DIR = path.join(process.cwd(), 'src/data/markdown');

// GET /api/markdown?id=xxx&type=items|contexts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'items';

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const filePath = path.join(MARKDOWN_DIR, type, `${id}.md`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return NextResponse.json({ id, content });
    } catch {
      // File doesn't exist - return empty content
      return NextResponse.json({ id, content: '' });
    }
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

    const dirPath = path.join(MARKDOWN_DIR, type);
    const filePath = path.join(dirPath, `${id}.md`);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write content
    await fs.writeFile(filePath, content || '', 'utf-8');

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
    const type = searchParams.get('type') || 'items';

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const filePath = path.join(MARKDOWN_DIR, type, `${id}.md`);

    try {
      await fs.unlink(filePath);
      return NextResponse.json({ success: true, id });
    } catch {
      // File doesn't exist - that's fine
      return NextResponse.json({ success: true, id });
    }
  } catch (error) {
    console.error('Failed to delete markdown:', error);
    return NextResponse.json({ error: 'Failed to delete markdown' }, { status: 500 });
  }
}
