import { NextResponse } from 'next/server';
import { readDB, writeDB, success, error } from '@/lib/db';

// GET - Get single object
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();
    const obj = db.objects.find((o) => o.id === id);

    if (!obj) {
      return NextResponse.json(error('Object not found'), { status: 404 });
    }

    return NextResponse.json(success(obj));
  } catch (e) {
    console.error('Error getting object:', e);
    return NextResponse.json(error('Failed to get object'), { status: 500 });
  }
}

// PUT - Update object
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const db = await readDB();

    const index = db.objects.findIndex((o) => o.id === id);
    if (index === -1) {
      return NextResponse.json(error('Object not found'), { status: 404 });
    }

    db.objects[index] = { ...db.objects[index], ...updates, id };
    await writeDB(db);

    return NextResponse.json(success(db.objects[index]));
  } catch (e) {
    console.error('Error updating object:', e);
    return NextResponse.json(error('Failed to update object'), { status: 500 });
  }
}

// DELETE - Delete object
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();

    const index = db.objects.findIndex((o) => o.id === id);
    if (index === -1) {
      return NextResponse.json(error('Object not found'), { status: 404 });
    }

    db.objects.splice(index, 1);
    // Also delete related items
    db.items = db.items.filter((i) => i.objectId !== id);

    await writeDB(db);

    return NextResponse.json(success({ deleted: true }));
  } catch (e) {
    console.error('Error deleting object:', e);
    return NextResponse.json(error('Failed to delete object'), { status: 500 });
  }
}
