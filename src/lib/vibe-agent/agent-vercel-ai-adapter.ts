/**
 * Agent Vercel AI Adapter
 *
 * Bridges Vibe Agent's LiteLLM-style router with Vercel AI SDK.
 * Provides a unified way to get a LanguageModel instance for streaming.
 * Includes streamVibeAgent() for AGI ReAct tool-use loops.
 */

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { agentLLMRouter } from './agent-llm-router-litellm-pattern';
import type { LanguageModel, ModelMessage } from 'ai';
import type { ReasoningStep, ReasoningTrace } from './agi-react-reasoning-loop';
import type { AGIToolRegistry } from './agi-tool-registry';

/**
 * Get a Vercel AI SDK LanguageModel based on router configuration.
 * Provider SDKs may return LanguageModelV1 — cast is safe since
 * streamText accepts both V1 and V2 at runtime.
 */
export function getVibeModel(preferredModel?: string): LanguageModel {
  const deployment = agentLLMRouter.selectDeployment(preferredModel);

  if (!deployment) {
    return google('models/gemini-1.5-pro-latest') as unknown as LanguageModel;
  }

  switch (deployment.provider) {
    case 'google':
      return google(deployment.modelName) as unknown as LanguageModel;
    case 'openai':
      return openai(deployment.modelName) as unknown as LanguageModel;
    case 'anthropic':
      return anthropic(deployment.modelName) as unknown as LanguageModel;
    default:
      return google('models/gemini-1.5-pro-latest') as unknown as LanguageModel;
  }
}

/**
 * Interface for streaming responses through Vibe Agent.
 */
export interface VibeStreamOptions {
  model?: string;
  system?: string;
  prompt?: string;
  messages?: ModelMessage[];
}

/**
 * Wrapper for streamText that integrates with Vibe Agent metrics and logging.
 */
export async function streamVibeText(options: VibeStreamOptions) {
  const { streamText } = await import('ai');
  const model = getVibeModel(options.model);

  // Build args — streamText uses a discriminated union (prompt XOR messages)
  const args = {
    model,
    system: options.system,
    ...(options.messages
      ? { messages: options.messages }
      : { prompt: options.prompt ?? '' }),
    onFinish: ({ usage }: { usage: { inputTokens?: number; outputTokens?: number } }) => {
      const deployment = agentLLMRouter.selectDeployment(options.model);
      if (deployment) {
        agentLLMRouter.recordUsage(deployment.id, {
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
        });
      }
    },
  };

  return streamText(args as Parameters<typeof streamText>[0]);
}

// ─── AGI Agent Streaming ─────────────────────────────────────

export interface VibeAgentOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxSteps?: number;
  tools?: Partial<AGIToolRegistry>;
  onStepFinish?: (step: ReasoningStep) => void;
}

/**
 * Stream a full AGI ReAct loop with tool use.
 * Wraps executeReActLoop with adapter-level model resolution.
 * Use this for agentic chat flows requiring tool calls.
 */
export async function streamVibeAgent(options: VibeAgentOptions): Promise<ReasoningTrace> {
  const { executeReActLoop } = await import('./agi-react-reasoning-loop');
  return executeReActLoop({
    prompt: options.prompt,
    system: options.system,
    model: options.model,
    maxSteps: options.maxSteps ?? 5,
    tools: options.tools,
    onStepFinish: options.onStepFinish,
  });
}
