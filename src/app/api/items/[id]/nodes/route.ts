import { NextResponse } from 'next/server';
import { readDB, writeDB, generateId, success, error } from '@/lib/db';
import { ContextNode } from '@/types';

// GET - Get item's context nodes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();
    const item = db.items.find((i) => i.id === id);

    if (!item) {
      return NextResponse.json(error('Item not found'), { status: 404 });
    }

    return NextResponse.json(success(item.contextData?.nodes || []));
  } catch (e) {
    console.error('Error getting item nodes:', e);
    return NextResponse.json(error('Failed to get nodes'), { status: 500 });
  }
}

// PUT - Replace all nodes (AI apply)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nodes } = await request.json();

    if (!Array.isArray(nodes)) {
      return NextResponse.json(error('Nodes must be an array'), { status: 400 });
    }

    const db = await readDB();
    const itemIndex = db.items.findIndex((i) => i.id === id);

    if (itemIndex === -1) {
      return NextResponse.json(error('Item not found'), { status: 404 });
    }

    // Update item's contextData.nodes
    db.items[itemIndex] = {
      ...db.items[itemIndex],
      contextData: {
        ...db.items[itemIndex].contextData,
        nodes: nodes,
      },
    };

    await writeDB(db);

    return NextResponse.json(success(db.items[itemIndex]));
  } catch (e) {
    console.error('Error updating item nodes:', e);
    return NextResponse.json(error('Failed to update nodes'), { status: 500 });
  }
}

// POST - Add single node
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const nodeData = await request.json();

    const db = await readDB();
    const itemIndex = db.items.findIndex((i) => i.id === id);

    if (itemIndex === -1) {
      return NextResponse.json(error('Item not found'), { status: 404 });
    }

    // Generate ID for new node
    const newNode: ContextNode = {
      id: generateId(),
      content: nodeData.content || '',
      parentId: nodeData.parentId || null,
      metadata: nodeData.metadata || {},
    };

    // Initialize contextData if not exists
    if (!db.items[itemIndex].contextData) {
      db.items[itemIndex].contextData = { nodes: [] };
    }

    db.items[itemIndex].contextData!.nodes.push(newNode);

    await writeDB(db);

    return NextResponse.json(success(newNode));
  } catch (e) {
    console.error('Error adding node:', e);
    return NextResponse.json(error('Failed to add node'), { status: 500 });
  }
}
