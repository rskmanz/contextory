import { NextResponse } from 'next/server';
import { readDB, writeDB, generateId, success, list, error } from '@/lib/db';

// GET - List contexts (filter by workspaceId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    const db = await readDB();
    let contexts = db.contexts;

    if (workspaceId) {
      contexts = contexts.filter((c) => c.workspaceId === workspaceId);
    }

    return NextResponse.json(list(contexts));
  } catch (e) {
    console.error('Error listing contexts:', e);
    return NextResponse.json(error('Failed to list contexts'), { status: 500 });
  }
}

// POST - Create context
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDB();

    if (!body.workspaceId) {
      return NextResponse.json(error('workspaceId is required'), { status: 400 });
    }

    const newContext = {
      id: generateId(),
      name: body.name || 'New Context',
      icon: body.icon || '🗺️',
      type: body.type || 'tree',
      viewStyle: body.viewStyle || 'mindmap',
      workspaceId: body.workspaceId,
      objectIds: body.objectIds || [],
      markdownId: body.markdownId || null,
      data: body.data || { nodes: [] },
    };

    db.contexts.push(newContext);
    await writeDB(db);

    return NextResponse.json(success(newContext), { status: 201 });
  } catch (e) {
    console.error('Error creating context:', e);
    return NextResponse.json(error('Failed to create context'), { status: 500 });
  }
}
