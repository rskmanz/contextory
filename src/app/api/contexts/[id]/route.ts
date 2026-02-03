import { NextResponse } from 'next/server';
import { readDB, writeDB, success, error } from '@/lib/db';
import { Context } from '@/types';

// GET - Get single context
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();
    const context = db.contexts.find((c) => c.id === id);

    if (!context) {
      return NextResponse.json(error('Context not found'), { status: 404 });
    }

    return NextResponse.json(success(context));
  } catch (e) {
    console.error('Error getting context:', e);
    return NextResponse.json(error('Failed to get context'), { status: 500 });
  }
}

// PUT - Update context
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const db = await readDB();

    const index = db.contexts.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(error('Context not found'), { status: 404 });
    }

    // Protect "home" context from deletion via update
    const existingContext = db.contexts[index];
    if (existingContext.name === 'home' && updates.name && updates.name !== 'home') {
      return NextResponse.json(error('Cannot rename home context'), { status: 400 });
    }

    db.contexts[index] = { ...db.contexts[index], ...updates, id } as Context;
    await writeDB(db);

    return NextResponse.json(success(db.contexts[index]));
  } catch (e) {
    console.error('Error updating context:', e);
    return NextResponse.json(error('Failed to update context'), { status: 500 });
  }
}

// DELETE - Delete context (protected: home cannot be deleted)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();

    const index = db.contexts.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(error('Context not found'), { status: 404 });
    }

    // Protect "home" context from deletion
    const context = db.contexts[index];
    if (context.name === 'home') {
      return NextResponse.json(error('Cannot delete home context'), { status: 400 });
    }

    db.contexts.splice(index, 1);
    await writeDB(db);

    return NextResponse.json(success({ deleted: true }));
  } catch (e) {
    console.error('Error deleting context:', e);
    return NextResponse.json(error('Failed to delete context'), { status: 500 });
  }
}
