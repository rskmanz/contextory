import { NextResponse } from 'next/server';
import { readDB, writeDB, generateId, success, list, error } from '@/lib/db';

// GET - List objects (filter by scope, projectId, workspaceId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const projectId = searchParams.get('projectId');
    const workspaceId = searchParams.get('workspaceId');

    const db = await readDB();
    let objects = db.objects;

    if (scope) {
      objects = objects.filter((o) => o.scope === scope);
    }
    if (projectId) {
      objects = objects.filter((o) => o.projectId === projectId);
    }
    if (workspaceId) {
      objects = objects.filter((o) => o.workspaceId === workspaceId);
    }

    return NextResponse.json(list(objects));
  } catch (e) {
    console.error('Error listing objects:', e);
    return NextResponse.json(error('Failed to list objects'), { status: 500 });
  }
}

// POST - Create object
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDB();

    const newObject = {
      id: generateId(),
      name: body.name || 'New Object',
      icon: body.icon || '📋',
      scope: body.scope || 'local',
      projectId: body.projectId || null,
      workspaceId: body.workspaceId || null,
      category: body.category || 'Work',
      builtIn: body.builtIn || false,
    };

    db.objects.push(newObject);
    await writeDB(db);

    return NextResponse.json(success(newObject), { status: 201 });
  } catch (e) {
    console.error('Error creating object:', e);
    return NextResponse.json(error('Failed to create object'), { status: 500 });
  }
}
