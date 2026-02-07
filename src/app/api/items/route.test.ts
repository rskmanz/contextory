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
  // Make the chain thenable so await resolves to array data
  self.then = vi.fn().mockImplementation((resolve: (val: { data: unknown; error: unknown }) => void) =>
    Promise.resolve().then(() => resolve({ data, error }))
  );
  return self;
}

describe('GET /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns items filtered by objectId', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const dbRows = [
      { id: 'i1', name: 'Item 1', object_id: 'obj-1', project_id: 'ws-1', markdown_id: null, view_layout: 'visualization', context_data: { nodes: [] }, user_id: 'user-123' },
    ];

    mockFrom.mockReturnValue(mockQuery(dbRows));

    const request = fakeRequest('http://localhost/api/items?objectId=obj-1');
    const response = await GET(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].objectId).toBe('obj-1');
    expect(body.data[0].name).toBe('Item 1');
  });

  it('returns empty for unauthenticated GET (MCP compatibility)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    mockFrom.mockReturnValue(mockQuery([]));

    const request = fakeRequest('http://localhost/api/items');
    const response = await GET(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});

describe('POST /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when objectId is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const request = fakeRequest('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Item without objectId' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('objectId');
  });

  it('creates an item when objectId is provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const createdRow = {
      id: 'new-id',
      name: 'My Item',
      object_id: 'obj-1',
      project_id: null,
      markdown_id: null,
      view_layout: 'visualization',
      context_data: { nodes: [] },
      user_id: 'user-123',
    };

    mockFrom.mockReturnValue(mockQuery([createdRow]));

    const request = fakeRequest('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Item', objectId: 'obj-1' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('My Item');
    expect(body.data.objectId).toBe('obj-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const request = fakeRequest('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', objectId: 'obj-1' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
