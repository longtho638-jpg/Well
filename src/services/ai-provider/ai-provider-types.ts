/**
 * AI Provider type definitions
 * Inspired by Vercel AI SDK provider pattern
 */

export interface GenerateParams {
  model?: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentToolDefinition[];
  stream?: boolean;
}

export interface GenerateResult {
  text: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: 'stop' | 'length' | 'tool-calls' | 'error';
  toolCalls?: ToolCallResult[];
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // Zod schema serialized
}

export interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AIProvider {
  generateText(params: GenerateParams): Promise<GenerateResult>;
  streamText(params: GenerateParams): Promise<ReadableStream<string>>;
}
