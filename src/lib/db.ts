import { promises as fs } from 'fs';
import path from 'path';
import { Project, Workspace, Context, ObjectType, ObjectItem } from '@/types';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');

export interface DBData {
  projects: Project[];
  workspaces: Workspace[];
  contexts: Context[];
  objects: ObjectType[];
  items: ObjectItem[];
}

// Read entire DB
export async function readDB(): Promise<DBData> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [], workspaces: [], contexts: [], objects: [], items: [] };
  }
}

// Write entire DB
export async function writeDB(data: DBData): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Success response
export function success<T>(data: T) {
  return { success: true, data };
}

// Error response
export function error(message: string) {
  return { success: false, error: message };
}

// List response
export function list<T>(data: T[], total?: number) {
  return { success: true, data, total: total ?? data.length };
}
