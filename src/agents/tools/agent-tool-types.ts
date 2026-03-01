/**
 * Agent Tool type definitions
 * Inspired by Vercel AI SDK tool() pattern
 */
import type { ZodSchema } from 'zod';

export interface AgentTool<TParams = unknown, TResult = unknown> {
  name: string;
  description: string;
  parameters: ZodSchema<TParams>;
  execute: (params: TParams) => Promise<TResult>;
}

export interface ToolCallRequest {
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolCallResponse {
  toolName: string;
  result: unknown;
  error?: string;
}
