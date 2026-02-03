const BASE_URL = process.env.CONTEXT_OS_URL || 'http://localhost:3000';

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
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
