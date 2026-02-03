import { Project, Workspace, Context, ObjectType, ObjectItem, ContextNode, AIProvider } from '@/types';

// Build context-aware system prompt
export function buildContextPrompt(ctx: {
  project?: Project;
  workspace?: Workspace;
  context?: Context;
  object?: ObjectType;
  item?: ObjectItem;
}): string {
  const parts: string[] = [
    'You are a context assistant for Context OS, a tool for organizing and visualizing project contexts.',
    '',
    'Current context:',
  ];

  if (ctx.project) {
    parts.push(`- Project: ${ctx.project.name}`);
  }
  if (ctx.workspace) {
    parts.push(`- Workspace: ${ctx.workspace.name}`);
  }
  if (ctx.context) {
    parts.push(`- Viewing Context: ${ctx.context.name} (${ctx.context.type} type, ${ctx.context.viewStyle} view)`);
    if (ctx.context.data?.nodes?.length) {
      parts.push(`- Context has ${ctx.context.data.nodes.length} nodes`);
    }
  }
  if (ctx.object) {
    parts.push(`- Viewing Object: ${ctx.object.name} (${ctx.object.category || 'uncategorized'})`);
  }
  if (ctx.item) {
    parts.push(`- Selected Item: ${ctx.item.name}`);
    if (ctx.item.contextData?.nodes?.length) {
      parts.push(`- Item has ${ctx.item.contextData.nodes.length} context nodes`);
    }
  }

  parts.push('');
  parts.push('Help the user build, navigate, and understand their context.');
  parts.push('When suggesting tree structures, return them as JSON arrays of nodes with id, content, and parentId fields.');
  parts.push('Keep responses concise and actionable.');

  return parts.join('\n');
}

// Parse suggested nodes from AI response
export function parseSuggestedNodes(response: string): ContextNode[] | null {
  try {
    // Look for JSON array in the response
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return null;

    // Validate and normalize nodes
    return parsed.map((node, index) => ({
      id: node.id || `suggested-${index}`,
      content: node.content || node.name || '',
      parentId: node.parentId || null,
      metadata: node.metadata || {},
    })).filter(node => node.content);
  } catch {
    return null;
  }
}

// Get default model for provider
export function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'anthropic':
      return 'claude-sonnet-4-20250514';
    default:
      return 'gpt-4o';
  }
}

// Format context badge text
export function formatContextBadge(ctx: {
  project?: Project;
  workspace?: Workspace;
  context?: Context;
  item?: ObjectItem;
}): string {
  const parts: string[] = [];
  if (ctx.project) parts.push(ctx.project.name);
  if (ctx.workspace) parts.push(ctx.workspace.name);
  if (ctx.context) parts.push(ctx.context.name);
  if (ctx.item) parts.push(ctx.item.name);
  return parts.join(' > ') || 'No context selected';
}
