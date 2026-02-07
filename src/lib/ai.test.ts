import { describe, it, expect } from 'vitest';
import { buildContextPrompt, parseSuggestedNodes, getDefaultModel, formatContextBadge } from './ai';
import type { Project, Workspace, Context, ObjectType, ObjectItem } from '@/types';

// --- Fixtures ---

const mockProject: Project = {
  id: 'proj-1',
  name: 'Acme Project',
  workspaceId: 'ws-1',
  category: 'Work',
};

const mockWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Frontend',
  icon: '🚀',
  gradient: 'from-blue-500 to-purple-500',
  category: 'Work',
};

const mockContext: Context = {
  id: 'ctx-1',
  name: 'Roadmap',
  icon: '🗺️',
  type: 'tree',
  viewStyle: 'mindmap',
  scope: 'project',
  projectId: 'proj-1',
  workspaceId: 'ws-1',
  data: {
    nodes: [
      { id: 'n1', content: 'Root', parentId: null },
      { id: 'n2', content: 'Child', parentId: 'n1' },
    ],
  },
};

const mockObject: ObjectType = {
  id: 'obj-1',
  name: 'Tasks',
  icon: '📋',
  category: 'Work',
  builtIn: false,
  availableGlobal: true,
  availableInProjects: ['*'],
  availableInWorkspaces: ['*'],
};

const mockItem: ObjectItem = {
  id: 'item-1',
  name: 'Build login page',
  objectId: 'obj-1',
  projectId: 'proj-1',
  contextData: {
    nodes: [
      { id: 'in1', content: 'Step 1', parentId: null },
      { id: 'in2', content: 'Step 2', parentId: 'in1' },
      { id: 'in3', content: 'Step 3', parentId: 'in1' },
    ],
  },
};

// --- Tests ---

describe('buildContextPrompt', () => {
  it('returns base prompt when no context is provided', () => {
    const result = buildContextPrompt({});

    expect(result).toContain('You are a context assistant for Contextory');
    expect(result).toContain('Current context:');
    expect(result).toContain('Help the user build, navigate, and understand their context.');
    expect(result).not.toContain('- Project:');
  });

  it('includes project name when project is provided', () => {
    const result = buildContextPrompt({ project: mockProject });

    expect(result).toContain('- Project: Acme Project');
  });

  it('includes workspace name when workspace is provided', () => {
    const result = buildContextPrompt({ workspace: mockWorkspace });

    expect(result).toContain('- Workspace: Frontend');
  });

  it('includes context details and node count when context is provided', () => {
    const result = buildContextPrompt({ context: mockContext });

    expect(result).toContain('- Viewing Context: Roadmap (tree type, mindmap view)');
    expect(result).toContain('- Context has 2 nodes');
  });

  it('includes context name but no node count when context has no nodes', () => {
    const emptyContext: Context = {
      ...mockContext,
      data: { nodes: [] },
    };
    const result = buildContextPrompt({ context: emptyContext });

    expect(result).toContain('- Viewing Context: Roadmap');
    expect(result).not.toContain('Context has');
  });

  it('includes object name and category when object is provided', () => {
    const result = buildContextPrompt({ object: mockObject });

    expect(result).toContain('- Viewing Object: Tasks (Work)');
  });

  it('shows uncategorized when object has no category', () => {
    const uncategorized: ObjectType = { ...mockObject, category: undefined };
    const result = buildContextPrompt({ object: uncategorized });

    expect(result).toContain('- Viewing Object: Tasks (uncategorized)');
  });

  it('includes item name and node count when item is provided', () => {
    const result = buildContextPrompt({ item: mockItem });

    expect(result).toContain('- Selected Item: Build login page');
    expect(result).toContain('- Item has 3 context nodes');
  });

  it('includes item name but no node count when item has no contextData', () => {
    const noContextItem: ObjectItem = {
      ...mockItem,
      contextData: undefined,
    };
    const result = buildContextPrompt({ item: noContextItem });

    expect(result).toContain('- Selected Item: Build login page');
    expect(result).not.toContain('Item has');
  });

  it('includes all sections when full context is provided', () => {
    const result = buildContextPrompt({
      project: mockProject,
      workspace: mockWorkspace,
      context: mockContext,
      object: mockObject,
      item: mockItem,
    });

    expect(result).toContain('- Project: Acme Project');
    expect(result).toContain('- Workspace: Frontend');
    expect(result).toContain('- Viewing Context: Roadmap');
    expect(result).toContain('- Viewing Object: Tasks');
    expect(result).toContain('- Selected Item: Build login page');
  });
});

describe('parseSuggestedNodes', () => {
  it('parses a valid JSON array of nodes from a response', () => {
    const response = 'Here are some nodes: [{"id":"1","content":"Root","parentId":null},{"id":"2","content":"Child","parentId":"1"}]';
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result![0]).toEqual({
      id: '1',
      content: 'Root',
      parentId: null,
      metadata: {},
    });
    expect(result![1]).toEqual({
      id: '2',
      content: 'Child',
      parentId: '1',
      metadata: {},
    });
  });

  it('returns null when response contains no JSON array', () => {
    const response = 'No nodes here, just plain text.';
    const result = parseSuggestedNodes(response);

    expect(result).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    const response = 'Here: [not valid json at all]';
    const result = parseSuggestedNodes(response);

    expect(result).toBeNull();
  });

  it('generates default ids when nodes lack id field', () => {
    const response = '[{"content":"Node A","parentId":null},{"content":"Node B","parentId":null}]';
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result![0].id).toBe('suggested-0');
    expect(result![1].id).toBe('suggested-1');
  });

  it('uses name field as fallback for content', () => {
    const response = '[{"id":"1","name":"Fallback Name","parentId":null}]';
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result![0].content).toBe('Fallback Name');
  });

  it('filters out nodes with empty content', () => {
    const response = '[{"id":"1","content":"Valid","parentId":null},{"id":"2","content":"","parentId":null}]';
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].content).toBe('Valid');
  });

  it('defaults parentId to null when not provided', () => {
    const response = '[{"id":"1","content":"Orphan"}]';
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result![0].parentId).toBeNull();
  });

  it('preserves metadata when present', () => {
    const response = '[{"id":"1","content":"Styled","parentId":null,"metadata":{"color":"red","icon":"star"}}]';
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result![0].metadata).toEqual({ color: 'red', icon: 'star' });
  });

  it('extracts JSON array embedded in surrounding text', () => {
    const response = `
      Sure! Here are the suggested nodes:

      [{"id":"a","content":"Planning","parentId":null},{"id":"b","content":"Execution","parentId":null}]

      Let me know if you need changes.
    `;
    const result = parseSuggestedNodes(response);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result![0].content).toBe('Planning');
    expect(result![1].content).toBe('Execution');
  });
});

describe('getDefaultModel', () => {
  it('returns gpt-4o for openai provider', () => {
    expect(getDefaultModel('openai')).toBe('gpt-4o');
  });

  it('returns claude-sonnet-4-20250514 for anthropic provider', () => {
    expect(getDefaultModel('anthropic')).toBe('claude-sonnet-4-20250514');
  });

  it('returns gpt-4o as fallback for unknown provider', () => {
    // Cast to AIProvider to test the default branch
    expect(getDefaultModel('unknown' as any)).toBe('gpt-4o');
  });
});

describe('formatContextBadge', () => {
  it('returns "No context selected" when nothing is provided', () => {
    expect(formatContextBadge({})).toBe('No context selected');
  });

  it('returns project name only', () => {
    expect(formatContextBadge({ project: mockProject })).toBe('Acme Project');
  });

  it('joins project and workspace with >', () => {
    const result = formatContextBadge({
      project: mockProject,
      workspace: mockWorkspace,
    });

    expect(result).toBe('Acme Project > Frontend');
  });

  it('joins project, workspace, and context with >', () => {
    const result = formatContextBadge({
      project: mockProject,
      workspace: mockWorkspace,
      context: mockContext,
    });

    expect(result).toBe('Acme Project > Frontend > Roadmap');
  });

  it('joins all parts including item with >', () => {
    const result = formatContextBadge({
      project: mockProject,
      workspace: mockWorkspace,
      context: mockContext,
      item: mockItem,
    });

    expect(result).toBe('Acme Project > Frontend > Roadmap > Build login page');
  });

  it('works with only item provided', () => {
    expect(formatContextBadge({ item: mockItem })).toBe('Build login page');
  });

  it('works with non-adjacent parts', () => {
    const result = formatContextBadge({
      project: mockProject,
      item: mockItem,
    });

    expect(result).toBe('Acme Project > Build login page');
  });
});
