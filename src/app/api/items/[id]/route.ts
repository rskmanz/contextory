import { NextResponse } from 'next/server';
import { readDB, writeDB, success, error } from '@/lib/db';

// GET - Get single item with contextData
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

    return NextResponse.json(success(item));
  } catch (e) {
    console.error('Error getting item:', e);
    return NextResponse.json(error('Failed to get item'), { status: 500 });
  }
}

// PUT - Update item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const db = await readDB();

    const index = db.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return NextResponse.json(error('Item not found'), { status: 404 });
    }

    db.items[index] = { ...db.items[index], ...updates, id };
    await writeDB(db);

    return NextResponse.json(success(db.items[index]));
  } catch (e) {
    console.error('Error updating item:', e);
    return NextResponse.json(error('Failed to update item'), { status: 500 });
  }
}

// DELETE - Delete item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();

    const index = db.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return NextResponse.json(error('Item not found'), { status: 404 });
    }

    db.items.splice(index, 1);
    // Also delete sub-workspaces that reference this item
    db.workspaces = db.workspaces.filter((w) => w.parentItemId !== id);

    await writeDB(db);

    return NextResponse.json(success({ deleted: true }));
  } catch (e) {
    console.error('Error deleting item:', e);
    return NextResponse.json(error('Failed to delete item'), { status: 500 });
  }
}
