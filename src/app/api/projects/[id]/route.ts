import { NextResponse } from 'next/server';
import { readDB, writeDB, success, error } from '@/lib/db';

// GET - Get single project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();
    const project = db.projects.find((p) => p.id === id);

    if (!project) {
      return NextResponse.json(error('Project not found'), { status: 404 });
    }

    return NextResponse.json(success(project));
  } catch (e) {
    console.error('Error getting project:', e);
    return NextResponse.json(error('Failed to get project'), { status: 500 });
  }
}

// PUT - Update project
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const db = await readDB();

    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json(error('Project not found'), { status: 404 });
    }

    db.projects[index] = { ...db.projects[index], ...updates, id };
    await writeDB(db);

    return NextResponse.json(success(db.projects[index]));
  } catch (e) {
    console.error('Error updating project:', e);
    return NextResponse.json(error('Failed to update project'), { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();

    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json(error('Project not found'), { status: 404 });
    }

    db.projects.splice(index, 1);
    // Also delete related workspaces, objects, items
    db.workspaces = db.workspaces.filter((w) => w.projectId !== id);
    db.objects = db.objects.filter((o) => o.projectId !== id);

    await writeDB(db);

    return NextResponse.json(success({ deleted: true }));
  } catch (e) {
    console.error('Error deleting project:', e);
    return NextResponse.json(error('Failed to delete project'), { status: 500 });
  }
}
