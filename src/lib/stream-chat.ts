export interface StreamEvent {
  type: 'delta' | 'tool_calls' | 'tool_result' | 'done' | 'error' | 'step' | 'suggestions';
  content?: string;
  toolCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  toolName?: string;
  toolOutput?: string;
  model?: string;
  error?: string;
  step?: string;
  message?: string;
  suggestions?: unknown[];
}

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onToolCalls: (toolCalls: NonNullable<StreamEvent['toolCalls']>) => void;
  onToolResult?: (name: string, output: string) => void;
  onDone: (model: string) => void;
  onError: (error: string) => void;
  onStep?: (step: string, message: string) => void;
  onSuggestions?: (suggestions: unknown[]) => void;
}

export async function streamChat(
  body: Record<string, unknown>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  url: string = '/api/chat'
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    callbacks.onError(errorData.error || 'Request failed');
    return;
  }

  if (!response.body) {
    callbacks.onError('Response body is empty');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event: StreamEvent = JSON.parse(line);
          switch (event.type) {
            case 'delta':
              callbacks.onDelta(event.content || '');
              break;
            case 'tool_calls':
              callbacks.onToolCalls(event.toolCalls || []);
              break;
            case 'tool_result':
              callbacks.onToolResult?.(event.toolName || '', event.toolOutput || '');
              break;
            case 'done':
              callbacks.onDone(event.model || '');
              break;
            case 'error':
              callbacks.onError(event.error || 'Unknown error');
              break;
            case 'step':
              callbacks.onStep?.(event.step || '', event.message || '');
              break;
            case 'suggestions':
              callbacks.onSuggestions?.(event.suggestions || []);
              break;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
