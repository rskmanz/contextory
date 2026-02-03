import { NextResponse } from 'next/server';
import { readDB, writeDB, generateId, success, list, error } from '@/lib/db';

// GET - List workspaces (optionally filter by projectId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const db = await readDB();
    let workspaces = db.workspaces;

    if (projectId) {
      workspaces = workspaces.filter((w) => w.projectId === projectId);
    }

    return NextResponse.json(list(workspaces));
  } catch (e) {
    console.error('Error listing workspaces:', e);
    return NextResponse.json(error('Failed to list workspaces'), { status: 500 });
  }
}

// POST - Create workspace
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDB();

    if (!body.projectId) {
      return NextResponse.json(error('projectId is required'), { status: 400 });
    }

    const newWorkspace = {
      id: generateId(),
      name: body.name || 'New Workspace',
      projectId: body.projectId,
      parentItemId: body.parentItemId || null,
      category: body.category || 'General',
      categoryIcon: body.categoryIcon || '📁',
    };

    db.workspaces.push(newWorkspace);
    await writeDB(db);

    return NextResponse.json(success(newWorkspace), { status: 201 });
  } catch (e) {
    console.error('Error creating workspace:', e);
    return NextResponse.json(error('Failed to create workspace'), { status: 500 });
  }
}
