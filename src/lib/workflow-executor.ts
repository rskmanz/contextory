import { Workflow, WorkflowStep } from '@/types';
import { useStore } from '@/lib/store';
import { executeToolCall } from '@/lib/ai-tool-executor';
import { streamChat } from '@/lib/stream-chat';
import { generateId } from '@/lib/utils';

interface WorkflowConfig {
  apiSettings: { provider: string; model?: string; apiKey?: string };
  workspaceId: string;
  projectId?: string;
}

type StepStatus = 'running' | 'done' | 'error';

interface ProgressCallback {
  (stepId: string, status: StepStatus, message: string): void;
}

async function runAIPrompt(
  prompt: string,
  config: WorkflowConfig,
  signal?: AbortSignal
): Promise<string> {
  let result = '';

  await streamChat(
    {
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: 'You are a helpful assistant. Be concise and thorough.',
      provider: config.apiSettings.provider || 'openai',
      model: config.apiSettings.model,
      apiKey: config.apiSettings.apiKey,
      enableTools: false,
    },
    {
      onDelta: (text) => { result += text; },
      onToolCalls: () => {},
      onDone: () => {},
      onError: (err) => { throw new Error(err); },
    },
    signal
  );

  return result;
}

async function executeStep(
  step: WorkflowStep,
  previousOutput: string,
  config: WorkflowConfig,
  signal?: AbortSignal
): Promise<string> {
  switch (step.type) {
    case 'research': {
      const topic = step.config.topic || previousOutput || 'general research';
      const prompt = `Research the following topic thoroughly and provide a comprehensive summary with key findings, trends, and important details:\n\nTopic: ${topic}\n\nProvide well-structured findings.`;
      return runAIPrompt(prompt, config, signal);
    }

    case 'summarize': {
      if (!previousOutput) return 'No content to summarize.';
      const prompt = `Summarize the following content concisely, extracting the key points and insights:\n\n${previousOutput.slice(0, 6000)}`;
      return runAIPrompt(prompt, config, signal);
    }

    case 'create_item': {
      if (!step.config.objectId) return 'Error: No target object specified.';
      const store = useStore.getState();

      // Use AI to generate a good item name from the content
      const namePrompt = `Based on this content, generate a short, descriptive title (max 60 chars, no quotes):\n\n${previousOutput.slice(0, 2000)}`;
      const itemName = await runAIPrompt(namePrompt, config, signal);

      const itemId = await store.addItem({
        name: itemName.trim().slice(0, 60),
        objectId: step.config.objectId,
        projectId: config.projectId || null,
      });

      // Save content as item markdown
      try {
        await fetch('/api/markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: itemId,
            type: 'items',
            content: previousOutput,
          }),
        });
      } catch {
        // Content save failed but item was created
      }

      return `Created item "${itemName.trim()}" (${itemId})`;
    }

    case 'add_resource': {
      const store = useStore.getState();
      const resourceName = step.name || 'Workflow Result';
      const newResource = {
        id: generateId(),
        name: resourceName,
        type: 'note' as const,
        content: previousOutput,
        addedAt: new Date().toISOString(),
      };

      if (step.config.target === 'workspace' || !config.projectId) {
        const ws = store.workspaces.find((w) => w.id === config.workspaceId);
        await store.updateWorkspace(config.workspaceId, {
          resources: [...(ws?.resources || []), newResource],
        });
      } else {
        const proj = store.projects.find((p) => p.id === config.projectId);
        await store.updateProject(config.projectId, {
          resources: [...(proj?.resources || []), newResource],
        });
      }

      return `Added resource "${resourceName}"`;
    }

    case 'generate_context': {
      if (!step.config.contextId) return 'Error: No target context specified.';
      const store = useStore.getState();

      const nodesPrompt = `Convert the following content into a hierarchical outline. Return ONLY a JSON array of objects with "content" and optional "parentIndex" (0-based index of the parent node, omit for root nodes):\n\n${previousOutput.slice(0, 4000)}\n\nReturn valid JSON array only.`;
      const nodesJson = await runAIPrompt(nodesPrompt, config, signal);

      try {
        const match = nodesJson.match(/\[[\s\S]*\]/);
        if (match) {
          const nodes = JSON.parse(match[0]);
          const nodeIds: string[] = [];
          for (const node of nodes) {
            const parentId = node.parentIndex != null && nodeIds[node.parentIndex]
              ? nodeIds[node.parentIndex]
              : null;
            const nodeId = await store.addNode(step.config.contextId, {
              content: node.content,
              parentId,
            });
            nodeIds.push(nodeId);
          }
          return `Generated ${nodeIds.length} context nodes`;
        }
      } catch {
        return 'Failed to parse generated context nodes';
      }
      return 'No nodes generated';
    }

    case 'custom_prompt': {
      const prompt = step.config.prompt
        ? step.config.prompt.replace('{{input}}', previousOutput || '')
        : previousOutput || 'No input provided.';
      return runAIPrompt(prompt, config, signal);
    }

    default:
      return `Unknown step type: ${step.type}`;
  }
}

export async function executeWorkflow(
  workflow: Workflow,
  config: WorkflowConfig,
  onProgress: ProgressCallback,
  signal?: AbortSignal
): Promise<void> {
  let previousOutput = '';

  for (const step of workflow.steps) {
    if (signal?.aborted) break;

    onProgress(step.id, 'running', `Running: ${step.name}...`);

    try {
      const output = await executeStep(step, previousOutput, config, signal);
      previousOutput = output;
      onProgress(step.id, 'done', output);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Step failed';
      onProgress(step.id, 'error', message);
      break;
    }
  }
}
