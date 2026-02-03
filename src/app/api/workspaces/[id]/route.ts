import { NextResponse } from 'next/server';
import { readDB, writeDB, success, error } from '@/lib/db';

// GET - Get single workspace
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();
    const workspace = db.workspaces.find((w) => w.id === id);

    if (!workspace) {
      return NextResponse.json(error('Workspace not found'), { status: 404 });
    }

    return NextResponse.json(success(workspace));
  } catch (e) {
    console.error('Error getting workspace:', e);
    return NextResponse.json(error('Failed to get workspace'), { status: 500 });
  }
}

// PUT - Update workspace
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const db = await readDB();

    const index = db.workspaces.findIndex((w) => w.id === id);
    if (index === -1) {
      return NextResponse.json(error('Workspace not found'), { status: 404 });
    }

    db.workspaces[index] = { ...db.workspaces[index], ...updates, id };
    await writeDB(db);

    return NextResponse.json(success(db.workspaces[index]));
  } catch (e) {
    console.error('Error updating workspace:', e);
    return NextResponse.json(error('Failed to update workspace'), { status: 500 });
  }
}

// DELETE - Delete workspace
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();

    const index = db.workspaces.findIndex((w) => w.id === id);
    if (index === -1) {
      return NextResponse.json(error('Workspace not found'), { status: 404 });
    }

    db.workspaces.splice(index, 1);
    // Also delete related contexts and local objects
    db.contexts = db.contexts.filter((c) => c.workspaceId !== id);
    db.objects = db.objects.filter((o) => o.workspaceId !== id);

    await writeDB(db);

    return NextResponse.json(success({ deleted: true }));
  } catch (e) {
    console.error('Error deleting workspace:', e);
    return NextResponse.json(error('Failed to delete workspace'), { status: 500 });
  }
}
