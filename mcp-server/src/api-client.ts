import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.CONTEXTORY_URL || 'http://localhost:3000';
const ENV_API_KEY = process.env.CONTEXTORY_API_KEY || '';

function getApiKey(): string {
  // Try env var first, then fallback to .api-key file
  if (ENV_API_KEY) return ENV_API_KEY;
  try {
    const keyFile = join(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), '..', '.api-key');
    return readFileSync(keyFile, 'utf-8').trim();
  } catch {
    return '';
  }
}

export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function callAPI(
  method: string,
  path: string,
  body?: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const key = getApiKey();
    if (key) {
      headers['Authorization'] = `Bearer ${key}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json() as ApiResponse;

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
    };
  }
}
