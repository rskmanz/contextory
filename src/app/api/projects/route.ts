import { NextResponse } from 'next/server';
import { readDB, writeDB, generateId, success, list, error } from '@/lib/db';

// GET - List all projects
export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(list(db.projects));
  } catch (e) {
    console.error('Error listing projects:', e);
    return NextResponse.json(error('Failed to list projects'), { status: 500 });
  }
}

// POST - Create project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDB();

    const newProject = {
      id: generateId(),
      name: body.name || 'New Project',
      icon: body.icon || '📁',
      gradient: body.gradient || 'from-blue-500 to-purple-500',
      category: body.category || 'Personal',
    };

    db.projects.push(newProject);
    await writeDB(db);

    return NextResponse.json(success(newProject), { status: 201 });
  } catch (e) {
    console.error('Error creating project:', e);
    return NextResponse.json(error('Failed to create project'), { status: 500 });
  }
}
