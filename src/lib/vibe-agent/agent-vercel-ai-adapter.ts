/**
 * Agent Vercel AI Adapter
 *
 * Bridges Vibe Agent's LiteLLM-style router with Vercel AI SDK.
 * Provides a unified way to get a LanguageModel instance for streaming.
 */

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { agentLLMRouter } from './agent-llm-router-litellm-pattern';
import type { LanguageModelV1 } from 'ai';

/**
 * Get a Vercel AI SDK LanguageModel based on router configuration.
 */
export function getVibeModel(preferredModel?: string): LanguageModelV1 {
  const deployment = agentLLMRouter.selectDeployment(preferredModel);

  if (!deployment) {
    // Fallback to a default if nothing is configured in the router
    // In a real RaaS project, we'd want to ensure the router is seeded.
    return google('models/gemini-1.5-pro-latest');
  }

  switch (deployment.provider) {
    case 'google':
      return google(deployment.modelName);
    case 'openai':
      return openai(deployment.modelName);
    case 'anthropic':
      // Assuming we'd add @ai-sdk/anthropic if needed
      // For now, mapping to a generic provider if available or throwing
      throw new Error(`Provider ${deployment.provider} not yet fully mapped in Vercel AI Adapter`);
    default:
      // Default to Google as per project primary stack
      return google('models/gemini-1.5-pro-latest');
  }
}

/**
 * Interface for streaming responses through Vibe Agent.
 */
export interface VibeStreamOptions {
  model?: string;
  system?: string;
  prompt?: string;
  messages?: any[];
}

/**
 * Wrapper for streamText that integrates with Vibe Agent metrics and logging.
 */
export async function streamVibeText(options: VibeStreamOptions) {
  const { streamText } = await import('ai');
  const model = getVibeModel(options.model);

  return streamText({
    model,
    system: options.system,
    prompt: options.prompt,
    messages: options.messages,
    onFinish: ({ usage, text }) => {
      // Track usage in the router for cost/kpi monitoring
      const deployment = agentLLMRouter.selectDeployment(options.model);
      if (deployment) {
        agentLLMRouter.recordUsage(deployment.id, {
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
        });
      }
    },
  });
}
