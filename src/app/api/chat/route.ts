import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { StateGraph, MessagesAnnotation, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { serverTools } from '@/lib/ai-tools-server';

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  systemPrompt: string;
  provider: 'openai' | 'anthropic';
  model?: string;
  apiKey?: string;
  enableTools?: boolean;
  stream?: boolean;
  resources?: Array<{ name: string; content?: string; summary?: string; url?: string }>;
}

function buildResourceContext(resources: Array<{ name: string; content?: string; summary?: string; url?: string }>): string {
  if (!resources?.length) return '';

  const MAX_TOTAL = 8000;
  let used = 0;
  const sections: string[] = [];

  for (const r of resources) {
    const text = r.summary || r.content || '';
    if (!text) continue;

    const maxPerResource = Math.floor(MAX_TOTAL / resources.length);
    const truncated = text.slice(0, Math.min(maxPerResource, MAX_TOTAL - used));

    sections.push(`[Source: "${r.name}"${r.url ? ` (${r.url})` : ''}]\n${truncated}`);
    used += truncated.length;

    if (used >= MAX_TOTAL) break;
  }

  if (sections.length === 0) return '';
  return `\n\n--- RESOURCE SOURCES ---\n${sections.join('\n\n')}\n--- END SOURCES ---\n\nUse these sources to answer questions. Cite source names when referencing them.`;
}

function createLlm(provider: string, model: string, key: string, tools: typeof serverTools, enableTools: boolean) {
  const baseLlm = provider === 'anthropic'
    ? new ChatAnthropic({
        modelName: model,
        anthropicApiKey: key,
        maxTokens: 2048,
      })
    : new ChatOpenAI({
        modelName: model,
        openAIApiKey: key,
        temperature: 0.7,
        maxTokens: 2048,
      });

  return enableTools ? baseLlm.bindTools(tools) : baseLlm;
}

function buildGraph(llm: ReturnType<typeof createLlm>, enableTools: boolean) {
  const toolNode = new ToolNode(serverTools);

  async function agentNode(state: typeof MessagesAnnotation.State) {
    const response = await llm.invoke(state.messages);
    return { messages: [response] };
  }

  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    if (enableTools && last.tool_calls && last.tool_calls.length > 0) {
      return 'tools';
    }
    return END;
  }

  const graph = new StateGraph(MessagesAnnotation)
    .addNode('agent', agentNode)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue, { tools: 'tools', [END]: END })
    .addEdge('tools', 'agent')
    .compile();

  return graph;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, systemPrompt, provider, model, apiKey, enableTools = true, resources } = body;

    const resourceContext = buildResourceContext(resources || []);
    const fullSystemPrompt = (systemPrompt || '') + resourceContext;

    const key = apiKey || (provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : process.env.ANTHROPIC_API_KEY);

    if (!key) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please add it in Settings.` },
        { status: 400 }
      );
    }

    const modelName = provider === 'anthropic'
      ? (model || 'claude-sonnet-4-20250514')
      : (model || 'gpt-4o');

    const lcMessages: BaseMessage[] = [
      new SystemMessage(fullSystemPrompt),
      ...messages.map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ];

    const llm = createLlm(provider, modelName, key, serverTools, enableTools);
    const graph = buildGraph(llm, enableTools);

    if (body.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const eventStream = graph.streamEvents(
              { messages: lcMessages },
              { version: 'v2' }
            );

            for await (const event of eventStream) {
              // Stream text deltas from the LLM
              if (event.event === 'on_chat_model_stream') {
                const chunk = event.data?.chunk;
                if (!chunk) continue;

                let textDelta = '';
                if (typeof chunk.content === 'string') {
                  textDelta = chunk.content;
                } else if (Array.isArray(chunk.content)) {
                  textDelta = chunk.content
                    .filter((b: { type?: string; text?: string }) => b.type === 'text')
                    .map((b: { text?: string }) => b.text || '')
                    .join('');
                }

                if (textDelta) {
                  controller.enqueue(
                    encoder.encode(JSON.stringify({ type: 'delta', content: textDelta }) + '\n')
                  );
                }
              }

              // Stream tool execution results
              if (event.event === 'on_tool_end') {
                const toolOutput = event.data?.output;
                const toolName = event.name || '';
                if (toolOutput) {
                  controller.enqueue(
                    encoder.encode(JSON.stringify({
                      type: 'tool_result',
                      toolName,
                      toolOutput: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput),
                    }) + '\n')
                  );
                }
              }
            }

            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'done', model: modelName }) + '\n')
            );
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Stream error';
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'error', error: errMsg }) + '\n')
            );
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

    // Non-streaming path
    const result = await graph.invoke({ messages: lcMessages });
    const lastMessage = result.messages[result.messages.length - 1] as AIMessage;

    let content = '';
    if (typeof lastMessage.content === 'string') {
      content = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      content = (lastMessage.content as Array<{ type?: string; text?: string }>)
        .filter((block) => block.type === 'text')
        .map((block) => block.text || '')
        .join('');
    }

    return NextResponse.json({
      content,
      model: modelName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
