import { ExtractionResult, ExtractionSuggestion, FieldDefinition, FieldType, ViewStyle, getContextTypeFromViewStyle } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';

interface AnalyzeContentParams {
  content: string;
  provider: string;
  model?: string;
  apiKey?: string;
  existingObjects?: Array<{ id: string; name: string; icon: string }>;
  workspaceId: string;
  projectId?: string;
}

export async function analyzeContent(params: AnalyzeContentParams): Promise<ExtractionResult> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to analyze content');
  }

  const data: ExtractionResult = await response.json();

  // Assign client-side IDs to each suggestion
  return {
    ...data,
    suggestions: data.suggestions.map(s => ({ ...s, id: generateId() })),
  };
}

interface ExecutionScope {
  workspaceId: string;
  projectId?: string;
}

interface ExecutionResult {
  created: Array<{ type: string; name: string; id: string }>;
  errors: string[];
}

export async function executeExtraction(
  suggestions: ExtractionSuggestion[],
  scope: ExecutionScope
): Promise<ExecutionResult> {
  const store = useStore.getState();
  const result: ExecutionResult = { created: [], errors: [] };

  for (const suggestion of suggestions) {
    try {
      switch (suggestion.type) {
        case 'object_with_items': {
          if (!suggestion.objectName || !suggestion.items?.length) break;

          // Build field definitions with generated IDs
          const fields: FieldDefinition[] = (suggestion.fields || []).map(f => ({
            id: generateId(),
            name: f.name,
            type: f.type as FieldType,
          }));

          // Create object
          const objectId = scope.projectId
            ? await store.addProjectObject(scope.workspaceId, scope.projectId, {
                name: suggestion.objectName,
                icon: suggestion.icon || '',
                builtIn: false,
                fields,
              })
            : await store.addObject({
                name: suggestion.objectName,
                icon: suggestion.icon || '',
                builtIn: false,
                availableGlobal: false,
                availableInWorkspaces: [scope.workspaceId],
                availableInProjects: scope.projectId ? [scope.projectId] : [],
                fields,
              });

          result.created.push({ type: 'object', name: suggestion.objectName, id: objectId });

          // Create items
          for (const item of suggestion.items) {
            // Map field name -> field id for fieldValues
            const mappedValues: Record<string, string | number | boolean | string[] | null> = {};
            if (item.fieldValues) {
              for (const [fieldName, value] of Object.entries(item.fieldValues)) {
                const field = fields.find(f => f.name === fieldName);
                if (field) {
                  mappedValues[field.id] = value;
                }
              }
            }

            const itemId = await store.addItem({
              name: item.name,
              objectId,
              projectId: scope.projectId || null,
              fieldValues: Object.keys(mappedValues).length > 0 ? mappedValues : undefined,
            });
            result.created.push({ type: 'item', name: item.name, id: itemId });
          }
          break;
        }

        case 'context_nodes': {
          if (!suggestion.contextName || !suggestion.nodes?.length) break;

          const viewStyle: ViewStyle = suggestion.viewStyle || 'notes';
          const contextType = getContextTypeFromViewStyle(viewStyle);

          const contextId = await store.addContext({
            name: suggestion.contextName,
            icon: suggestion.icon || '',
            type: contextType,
            viewStyle,
            scope: scope.projectId ? 'project' : 'workspace',
            workspaceId: scope.workspaceId,
            projectId: scope.projectId || null,
            data: { nodes: [], edges: [] },
          });

          result.created.push({ type: 'context', name: suggestion.contextName, id: contextId });

          // Add nodes in order, tracking IDs for parent resolution
          const nodeIds: string[] = [];
          for (const node of suggestion.nodes) {
            const parentId = node.parentIndex != null && nodeIds[node.parentIndex]
              ? nodeIds[node.parentIndex]
              : null;

            const nodeId = await store.addNode(contextId, {
              content: node.content,
              parentId,
              metadata: node.metadata || undefined,
            });
            nodeIds.push(nodeId);
          }

          // Add edges if provided (flow/kanban)
          if (suggestion.edges?.length) {
            for (const edge of suggestion.edges) {
              const sourceId = nodeIds[edge.sourceIndex];
              const targetId = nodeIds[edge.targetIndex];
              if (sourceId && targetId) {
                await store.addEdge(contextId, { sourceId, targetId });
              }
            }
          }
          break;
        }

        case 'standalone_items': {
          if (!suggestion.targetObjectId || !suggestion.standaloneItems?.length) break;

          for (const item of suggestion.standaloneItems) {
            const itemId = await store.addItem({
              name: item.name,
              objectId: suggestion.targetObjectId,
              projectId: scope.projectId || null,
            });
            result.created.push({ type: 'item', name: item.name, id: itemId });
          }
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Failed to create "${suggestion.title}": ${msg}`);
    }
  }

  return result;
}
