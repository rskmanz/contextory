import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}));

import { GET, POST } from './route';

// Helper: create a fake NextRequest with nextUrl.searchParams
function fakeRequest(url: string, init?: RequestInit) {
  const req = new Request(url, init);
  const parsed = new URL(url);
  Object.defineProperty(req, 'nextUrl', { value: parsed });
  return req as unknown as import('next/server').NextRequest;
}

// Helper: create a chainable query mock that resolves with data
function mockQuery(data: unknown[], error: unknown = null) {
  const self: Record<string, ReturnType<typeof vi.fn>> = {};
  self.select = vi.fn().mockReturnValue(self);
  self.insert = vi.fn().mockReturnValue(self);
  self.order = vi.fn().mockReturnValue(self);
  self.eq = vi.fn().mockReturnValue(self);
  self.single = vi.fn().mockResolvedValue({ data: data[0] ?? null, error });
  self.then = vi.fn().mockImplementation((resolve: (val: { data: unknown; error: unknown }) => void) =>
    Promise.resolve().then(() => resolve({ data, error }))
  );
  return self;
}

describe('GET /api/contexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns contexts filtered by workspaceId', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const dbRows = [
      {
        id: 'ctx-1', name: 'home', icon: '', type: 'tree', view_style: 'notes',
        scope: 'local', project_id: 'p1', workspace_id: 'ws-1',
        object_ids: [], markdown_id: null, data: { nodes: [] },
      },
    ];

    mockFrom.mockReturnValue(mockQuery(dbRows));

    const request = fakeRequest('http://localhost/api/contexts?workspaceId=ws-1');
    const response = await GET(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].workspaceId).toBe('ws-1');
    expect(body.data[0].viewStyle).toBe('notes');
  });

  it('returns all contexts when no filter', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    mockFrom.mockReturnValue(mockQuery([]));

    const request = fakeRequest('http://localhost/api/contexts');
    const response = await GET(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});

describe('POST /api/contexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when workspaceId missing for local scope', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const request = fakeRequest('http://localhost/api/contexts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', scope: 'local', projectId: 'p1' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('workspaceId');
  });

  it('returns 400 when projectId missing for project scope', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const request = fakeRequest('http://localhost/api/contexts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', scope: 'project' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('projectId');
  });

  it('creates a context with valid data', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const createdRow = {
      id: 'new-ctx', name: 'Board', icon: '', type: 'board', view_style: 'kanban',
      scope: 'local', project_id: 'p1', workspace_id: 'ws-1',
      object_ids: [], markdown_id: null, data: { nodes: [] },
    };

    mockFrom.mockReturnValue(mockQuery([createdRow]));

    const request = fakeRequest('http://localhost/api/contexts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Board',
        type: 'board',
        viewStyle: 'kanban',
        scope: 'local',
        projectId: 'p1',
        workspaceId: 'ws-1',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('board');
    expect(body.data.viewStyle).toBe('kanban');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const request = fakeRequest('http://localhost/api/contexts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', scope: 'global' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
