import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MARKDOWN_DIR = path.join(process.cwd(), 'src/data/markdown');

// Helper to get markdown path
function getMarkdownPath(id: string): string {
  // ID format: "items/item-name" or "contexts/context-name"
  return path.join(MARKDOWN_DIR, `${id}.md`);
}

// GET - Get markdown content
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = getMarkdownPath(id);

    const content = await fs.readFile(filePath, 'utf-8');

    return NextResponse.json({
      success: true,
      data: { id, content },
    });
  } catch (e) {
    // File not found is OK, return empty
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({
        success: true,
        data: { id: (await params).id, content: '' },
      });
    }
    console.error('Error reading markdown:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to read markdown' },
      { status: 500 }
    );
  }
}

// PUT - Update markdown content
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = await request.json();
    const filePath = getMarkdownPath(id);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write content
    await fs.writeFile(filePath, content || '', 'utf-8');

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

// DELETE - Delete markdown file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = getMarkdownPath(id);

    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (e) {
    // File not found is OK for delete
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({
        success: true,
        data: { deleted: true },
      });
    }
    console.error('Error deleting markdown:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to delete markdown' },
      { status: 500 }
    );
  }
}
