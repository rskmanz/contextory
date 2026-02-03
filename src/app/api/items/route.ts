import { NextResponse } from 'next/server';
import { readDB, writeDB, generateId, success, list, error } from '@/lib/db';

// GET - List items (filter by objectId, workspaceId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const objectId = searchParams.get('objectId');
    const workspaceId = searchParams.get('workspaceId');

    const db = await readDB();
    let items = db.items;

    if (objectId) {
      items = items.filter((i) => i.objectId === objectId);
    }
    if (workspaceId) {
      items = items.filter((i) => i.workspaceId === workspaceId);
    }

    return NextResponse.json(list(items));
  } catch (e) {
    console.error('Error listing items:', e);
    return NextResponse.json(error('Failed to list items'), { status: 500 });
  }
}

// POST - Create item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDB();

    if (!body.objectId) {
      return NextResponse.json(error('objectId is required'), { status: 400 });
    }

    const newItem = {
      id: generateId(),
      name: body.name || 'New Item',
      objectId: body.objectId,
      workspaceId: body.workspaceId || null,
      markdownId: body.markdownId || null,
      contextData: body.contextData || { nodes: [] },
    };

    db.items.push(newItem);
    await writeDB(db);

    return NextResponse.json(success(newItem), { status: 201 });
  } catch (e) {
    console.error('Error creating item:', e);
    return NextResponse.json(error('Failed to create item'), { status: 500 });
  }
}
