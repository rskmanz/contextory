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

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns projects for authenticated user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const dbRows = [
      { id: 'p1', name: 'Project 1', icon: '', gradient: '', category: 'Work', user_id: 'user-123' },
    ];

    mockFrom.mockReturnValue(mockQuery(dbRows));

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Project 1');
    expect(body.total).toBe(1);
  });

  it('returns empty array when no user (MCP compatibility)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    mockFrom.mockReturnValue(mockQuery([]));

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a project for authenticated user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const createdRow = {
      id: 'new-id',
      name: 'My Project',
      icon: '',
      gradient: 'from-blue-500 to-purple-500',
      category: 'Personal',
      user_id: 'user-123',
    };

    mockFrom.mockReturnValue(mockQuery([createdRow]));

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Project' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('My Project');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Project' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });
});
