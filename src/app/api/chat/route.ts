import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { contextOSTools } from '@/lib/ai-tools';

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  systemPrompt: string;
  provider: 'openai' | 'anthropic';
  model?: string;
  apiKey?: string;
  enableTools?: boolean;
}

interface ToolCallOutput {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, systemPrompt, provider, model, apiKey, enableTools = true } = body;

    // Get API key from request or environment
    const key = apiKey || (provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : process.env.ANTHROPIC_API_KEY);

    if (!key) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please add it in Settings.` },
        { status: 400 }
      );
    }

    // Convert messages to LangChain format
    const lcMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      )
    ];

    // Create model based on provider
    // LangSmith tracing is automatically enabled when LANGCHAIN_TRACING_V2=true
    const modelName = provider === 'anthropic'
      ? (model || 'claude-sonnet-4-20250514')
      : (model || 'gpt-4o');

    const baseLlm = provider === 'anthropic'
      ? new ChatAnthropic({
          modelName,
          anthropicApiKey: key,
          maxTokens: 2048,
        })
      : new ChatOpenAI({
          modelName,
          openAIApiKey: key,
          temperature: 0.7,
          maxTokens: 2048,
        });

    // Bind tools if enabled
    const llm = enableTools ? baseLlm.bindTools(contextOSTools) : baseLlm;

    // Invoke model (automatically traced to LangSmith)
    const response = await llm.invoke(lcMessages);

    // Extract tool calls if present
    const toolCalls: ToolCallOutput[] = [];
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const tc of response.tool_calls) {
        toolCalls.push({
          id: tc.id || crypto.randomUUID(),
          name: tc.name,
          args: tc.args as Record<string, unknown>,
        });
      }
    }

    // Get content (may be empty if tool calls are present)
    let content = '';
    if (typeof response.content === 'string') {
      content = response.content;
    } else if (Array.isArray(response.content)) {
      // Handle content blocks (Anthropic format)
      content = response.content
        .filter((block): block is { type: 'text'; text: string } =>
          typeof block === 'object' && block !== null && 'type' in block && block.type === 'text'
        )
        .map(block => block.text)
        .join('');
    }

    return NextResponse.json({
      content,
      model: modelName,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
