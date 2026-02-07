import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// OpenAI strict structured outputs requires ALL properties in 'required'
// and forbids z.record() (produces 'propertyNames') and .optional() (removes from 'required').
// Use .nullable() throughout and a fields array instead of z.record() for fieldValues.
const extractionSchema = z.object({
  summary: z.string().describe('Brief one-sentence description of what was found'),
  suggestions: z.array(z.object({
    type: z.enum(['object_with_items', 'context_nodes', 'standalone_items']),
    title: z.string().describe('Human-readable group name'),
    icon: z.string().describe('Single emoji icon'),
    description: z.string().describe('What this group represents'),
    sourceHeading: z.string().nullable().describe('The markdown heading this data was extracted from, or null'),
    objectName: z.string().nullable().describe('Name for the Object type (object_with_items only, null otherwise)'),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string().describe('One of: text, number, date, url, checkbox, select'),
    })).nullable().describe('Field definitions for the object (object_with_items only, null otherwise)'),
    items: z.array(z.object({
      name: z.string(),
      fields: z.array(z.object({
        field: z.string().describe('Field name matching a field in the fields array'),
        value: z.string().describe('Field value as string'),
      })).nullable().describe('Field values for this item, or null'),
    })).nullable().describe('Items to create (object_with_items only, null otherwise)'),
    contextName: z.string().nullable().describe('Name for the Context (context_nodes only, null otherwise)'),
    viewStyle: z.enum(['mindmap', 'notes', 'kanban', 'flow', 'gantt', 'grid', 'table']).nullable()
      .describe('Best view type. flow=process, kanban=grouped by status, mindmap=hierarchy, gantt=timeline, notes=general. Null if not context_nodes.'),
    nodes: z.array(z.object({
      content: z.string(),
      parentIndex: z.number().nullable().describe('0-based index of parent node, null for root'),
      metadata: z.object({
        startDate: z.string().nullable().describe('ISO date YYYY-MM-DD (gantt only), or null'),
        endDate: z.string().nullable().describe('ISO date YYYY-MM-DD (gantt only), or null'),
        progress: z.number().nullable().describe('0-100 percentage (gantt only), or null'),
      }).nullable(),
    })).nullable().describe('Tree nodes (context_nodes only, null otherwise)'),
    edges: z.array(z.object({
      sourceIndex: z.number().describe('0-based index of source node'),
      targetIndex: z.number().describe('0-based index of target node'),
    })).nullable().describe('Connections between nodes (flow/kanban only, null otherwise)'),
    targetObjectId: z.string().nullable().describe('Existing object ID (standalone_items only, null otherwise)'),
    targetObjectName: z.string().nullable().describe('Existing object name (standalone_items only, null otherwise)'),
    standaloneItems: z.array(z.object({
      name: z.string(),
    })).nullable().describe('Items to add to existing object (standalone_items only, null otherwise)'),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, provider, model, apiKey, existingObjects } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const key = apiKey || (provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : process.env.ANTHROPIC_API_KEY);

    if (!key) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please add it in Settings.` },
        { status: 400 }
      );
    }

    const aiModel = provider === 'anthropic'
      ? createAnthropic({ apiKey: key })(model || 'claude-sonnet-4-20250514')
      : createOpenAI({ apiKey: key })(model || 'gpt-4o');

    const existingObjectsContext = existingObjects?.length
      ? `\n\nEXISTING OBJECTS (prefer adding items to these if they match):\n${existingObjects.map((o: { id: string; name: string; icon: string }) => `- ${o.icon} ${o.name} (id: ${o.id})`).join('\n')}`
      : '';

    const truncatedContent = content.slice(0, 12000);

    const systemPrompt = `You are an intelligent content analyzer for Contextory, a knowledge management tool.
Analyze the provided text and identify structured data that can be extracted into Objects (data tables) or Contexts (visual views).

EXTRACTION TYPES:
1. **object_with_items** — Lists of entities with shared attributes → Object with Items + Fields
   - Tables, comparison lists, entity lists with properties
   - Example: a list of tools with name, language, price → Object "Tools" with fields

2. **context_nodes** — Content that maps to a visual view → Context with Nodes
   Choose the best viewStyle based on content pattern:
   - **flow** — Sequential processes, workflows, pipelines, step-by-step instructions
   - **kanban** — Items grouped by status/category/phase (e.g. To Do/In Progress/Done)
   - **mindmap** — Hierarchical outlines, topic trees, brainstorm structures
   - **gantt** — Timelines with dates, schedules, project plans
   - **notes** — General structured notes (default when no specific pattern matches)

3. **standalone_items** — Items that belong to an existing Object

RULES:
1. Only suggest extractions when there is genuinely structured or list-like data.
2. Prefer reusing existing objects (listed below) over creating new ones when they match.
3. For tabular data, infer field types: text, number, date, url, checkbox, select.
4. For context_nodes, always set viewStyle to the most appropriate view type.
5. For flow contexts, include edges connecting sequential nodes.
6. For kanban contexts, use parent nodes as column headers and child nodes as cards.
7. For gantt contexts, include startDate and endDate in node metadata when dates are mentioned.
8. Keep names concise (under 60 characters).
9. Generate an appropriate emoji icon for each suggestion.
10. For item field values, set "field" to the field NAME and "value" to its string value.
11. Set sourceHeading to the markdown heading the data was found under.
12. If no extractable data is found, return an empty suggestions array.
${existingObjectsContext}`;

    const result = await generateObject({
      model: aiModel,
      schema: extractionSchema,
      prompt: `${systemPrompt}\n\n--- CONTENT TO ANALYZE ---\n${truncatedContent}\n--- END CONTENT ---`,
    });

    // Transform: convert nullable → undefined, convert item fields array → fieldValues record
    const transformed = {
      ...result.object,
      suggestions: result.object.suggestions.map((s) => ({
        ...s,
        sourceHeading: s.sourceHeading ?? undefined,
        objectName: s.objectName ?? undefined,
        fields: s.fields ?? undefined,
        contextName: s.contextName ?? undefined,
        viewStyle: s.viewStyle ?? undefined,
        nodes: s.nodes?.map((n) => ({
          content: n.content,
          parentIndex: n.parentIndex ?? undefined,
          metadata: n.metadata ?? undefined,
        })) ?? undefined,
        edges: s.edges ?? undefined,
        targetObjectId: s.targetObjectId ?? undefined,
        targetObjectName: s.targetObjectName ?? undefined,
        standaloneItems: s.standaloneItems ?? undefined,
        items: s.items?.map((item) => ({
          name: item.name,
          fieldValues: item.fields
            ? Object.fromEntries(item.fields.map((f) => [f.field, f.value]))
            : undefined,
        })) ?? undefined,
      })),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Extract API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
