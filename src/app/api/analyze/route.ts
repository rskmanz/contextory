import { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function emit(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: Record<string, unknown>) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { resources, workspaceId, projectId, provider, model, apiKey } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // === STEP 1: COLLECT ===
        emit(controller, encoder, {
          type: 'step', step: 'collect',
          message: `Collecting ${resources.length} source${resources.length !== 1 ? 's' : ''}...`,
        });

        const contents: string[] = [];
        for (const r of resources) {
          const text = r.content || r.summary || '';
          if (text) contents.push(`## ${r.name}\n${text}`);
        }

        // === STEP 2: PARSE ===
        emit(controller, encoder, { type: 'step', step: 'parse', message: 'Parsing content...' });

        let parsedContent = contents.join('\n\n');
        parsedContent = stripHtml(parsedContent);
        parsedContent = parsedContent.slice(0, 12000);

        if (!parsedContent.trim()) {
          emit(controller, encoder, { type: 'delta', content: 'No analyzable content found in sources.' });
          emit(controller, encoder, { type: 'done' });
          controller.close();
          return;
        }

        // === STEP 3: ANALYZE ===
        emit(controller, encoder, { type: 'step', step: 'analyze', message: 'Analyzing structure...' });

        const sb = getSupabase();
        let existingObjects: Array<{ id: string; name: string; icon: string }> = [];
        try {
          const query = projectId
            ? sb.from('objects').select('id, name, icon').eq('project_id', projectId)
            : sb.from('objects').select('id, name, icon').eq('workspace_id', workspaceId);
          const { data } = await query;
          existingObjects = (data || []) as Array<{ id: string; name: string; icon: string }>;
        } catch { /* ignore */ }

        const key = apiKey || (provider === 'openai'
          ? process.env.OPENAI_API_KEY
          : process.env.ANTHROPIC_API_KEY);

        if (!key) {
          emit(controller, encoder, { type: 'error', error: `No API key configured for ${provider}` });
          controller.close();
          return;
        }

        const aiModel = provider === 'anthropic'
          ? createAnthropic({ apiKey: key })(model || 'claude-sonnet-4-20250514')
          : createOpenAI({ apiKey: key })(model || 'gpt-4o');

        const existingObjectsContext = existingObjects.length
          ? `\n\nEXISTING OBJECTS (prefer adding items to these if they match):\n${existingObjects.map(o => `- ${o.icon} ${o.name} (id: ${o.id})`).join('\n')}`
          : '';

        const systemPrompt = `You are an intelligent content analyzer for Contextory, a knowledge management tool.
Analyze the provided text and identify structured data that can be extracted into Objects (data tables) or Contexts (visual views).

EXTRACTION TYPES:
1. **object_with_items** — Lists of entities with shared attributes → Object with Items + Fields
2. **context_nodes** — Content that maps to a visual view → Context with Nodes
   Choose viewStyle: flow, kanban, mindmap, gantt, notes
3. **standalone_items** — Items that belong to an existing Object

RULES:
1. Only suggest extractions when there is genuinely structured or list-like data.
2. Prefer reusing existing objects over creating new ones when they match.
3. For tabular data, infer field types: text, number, date, url, checkbox, select.
4. For context_nodes, always set viewStyle to the most appropriate view type.
5. For flow contexts, include edges connecting sequential nodes.
6. For kanban contexts, use parent nodes as column headers and child nodes as cards.
7. For gantt contexts, include startDate and endDate in node metadata.
8. Keep names concise (under 60 characters).
9. Generate an appropriate emoji icon for each suggestion.
10. For item field values, set "field" to the field NAME and "value" to its string value.
11. Set sourceHeading to the markdown heading the data was found under.
12. If no extractable data is found, return an empty suggestions array.
${existingObjectsContext}`;

        const result = await generateObject({
          model: aiModel,
          schema: extractionSchema,
          prompt: `${systemPrompt}\n\n--- CONTENT TO ANALYZE ---\n${parsedContent}\n--- END CONTENT ---`,
        });

        const suggestions = result.object.suggestions;

        // === STEP 4: SUGGEST ===
        if (suggestions.length === 0) {
          emit(controller, encoder, { type: 'delta', content: 'No structured data found to extract.' });
          emit(controller, encoder, { type: 'done' });
          controller.close();
          return;
        }

        emit(controller, encoder, {
          type: 'suggestions',
          suggestions: suggestions.map(s => ({
            type: s.type,
            title: s.title,
            icon: s.icon,
            description: s.description,
          })),
        });

        // === STEP 5: EXTRACT & CREATE ===
        emit(controller, encoder, {
          type: 'step', step: 'create',
          message: `Creating ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}...`,
        });

        const createdItems: Array<{ type: string; name: string; id: string }> = [];

        for (const suggestion of suggestions) {
          if (suggestion.type === 'object_with_items' && suggestion.objectName) {
            const { data: objData, error: objErr } = await sb.from('objects').insert({
              name: suggestion.objectName,
              icon: suggestion.icon || null,
              scope: projectId ? 'project' : 'workspace',
              workspace_id: workspaceId,
              project_id: projectId || null,
              category: null,
              fields: (suggestion.fields || []).map((f, i) => ({
                id: `field_${i}`,
                name: f.name,
                type: f.type,
              })),
            }).select('id, name').single();

            if (objErr) continue;

            emit(controller, encoder, {
              type: 'tool_result',
              toolName: 'create_object',
              toolOutput: JSON.stringify({ id: objData.id, name: objData.name }),
            });
            createdItems.push({ type: 'object', name: objData.name, id: objData.id });

            const items = suggestion.items || [];
            for (const item of items) {
              const fieldValues: Record<string, string> = {};
              if (item.fields) {
                for (const f of item.fields) {
                  const fieldIndex = (suggestion.fields || []).findIndex(fd => fd.name === f.field);
                  if (fieldIndex >= 0) {
                    fieldValues[`field_${fieldIndex}`] = f.value;
                  }
                }
              }

              const { data: itemData, error: itemErr } = await sb.from('items').insert({
                object_id: objData.id,
                name: item.name,
                project_id: projectId || null,
                field_values: fieldValues,
              }).select('id, name').single();

              if (itemErr) continue;

              emit(controller, encoder, {
                type: 'tool_result',
                toolName: 'create_item',
                toolOutput: JSON.stringify({ id: itemData.id, name: itemData.name }),
              });
              createdItems.push({ type: 'item', name: itemData.name, id: itemData.id });
            }
          } else if (suggestion.type === 'context_nodes' && suggestion.contextName) {
            const viewStyle = suggestion.viewStyle || 'notes';
            const contextType = ['flow', 'grid', 'table', 'freeform'].includes(viewStyle) ? 'canvas'
              : viewStyle === 'kanban' ? 'board'
              : 'tree';

            const { data: ctxData, error: ctxErr } = await sb.from('contexts').insert({
              project_id: projectId,
              name: suggestion.contextName,
              icon: suggestion.icon || null,
              type: contextType,
              view_style: viewStyle,
            }).select('id, name').single();

            if (ctxErr) continue;

            emit(controller, encoder, {
              type: 'tool_result',
              toolName: 'create_context',
              toolOutput: JSON.stringify({ id: ctxData.id, name: ctxData.name }),
            });
            createdItems.push({ type: 'context', name: ctxData.name, id: ctxData.id });

            const nodes = suggestion.nodes || [];
            const nodeIdMap: Record<number, string> = {};

            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              const parentId = node.parentIndex != null && nodeIdMap[node.parentIndex]
                ? nodeIdMap[node.parentIndex]
                : null;

              const { data: nodeData, error: nodeErr } = await sb.from('context_nodes').insert({
                context_id: ctxData.id,
                content: node.content,
                parent_id: parentId,
              }).select('id').single();

              if (nodeErr) continue;
              nodeIdMap[i] = nodeData.id;
            }

            if (suggestion.edges?.length) {
              for (const edge of suggestion.edges) {
                const sourceId = nodeIdMap[edge.sourceIndex];
                const targetId = nodeIdMap[edge.targetIndex];
                if (sourceId && targetId) {
                  await sb.from('context_edges').insert({
                    context_id: ctxData.id,
                    source_id: sourceId,
                    target_id: targetId,
                  });
                }
              }
            }
          } else if (suggestion.type === 'standalone_items' && suggestion.targetObjectId) {
            const items = suggestion.standaloneItems || [];
            for (const item of items) {
              const { data: itemData, error: itemErr } = await sb.from('items').insert({
                object_id: suggestion.targetObjectId,
                name: item.name,
                project_id: projectId || null,
              }).select('id, name').single();

              if (itemErr) continue;

              emit(controller, encoder, {
                type: 'tool_result',
                toolName: 'create_item',
                toolOutput: JSON.stringify({ id: itemData.id, name: itemData.name }),
              });
              createdItems.push({ type: 'item', name: itemData.name, id: itemData.id });
            }
          }
        }

        // === STEP 6: SUMMARIZE ===
        const objectCount = createdItems.filter(i => i.type === 'object').length;
        const itemCount = createdItems.filter(i => i.type === 'item').length;
        const contextCount = createdItems.filter(i => i.type === 'context').length;

        const parts: string[] = [];
        if (objectCount > 0) parts.push(`${objectCount} object${objectCount !== 1 ? 's' : ''}`);
        if (itemCount > 0) parts.push(`${itemCount} item${itemCount !== 1 ? 's' : ''}`);
        if (contextCount > 0) parts.push(`${contextCount} context${contextCount !== 1 ? 's' : ''}`);

        const summary = parts.length > 0
          ? `Created ${parts.join(', ')}. ${result.object.summary || ''}`
          : 'Analysis complete but no items were created.';

        emit(controller, encoder, { type: 'delta', content: summary });
        emit(controller, encoder, { type: 'done' });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Analysis failed';
        emit(controller, encoder, { type: 'error', error: errMsg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
