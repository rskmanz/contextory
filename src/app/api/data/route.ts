import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');

// GET - Read all data
export async function GET() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading db.json:', error);
    return NextResponse.json({ projects: [], workspaces: [], contexts: [], objects: [], items: [] });
  }
}

// POST - Write all data
export async function POST(request: Request) {
  try {
    const data = await request.json();
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing db.json:', error);
    return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
  }
}
