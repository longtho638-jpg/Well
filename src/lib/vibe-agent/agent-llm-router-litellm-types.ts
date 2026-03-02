/**
 * Agent LLM Router — Types (LiteLLM Proxy Pattern)
 *
 * Extracted from agent-llm-router-litellm-pattern.ts.
 * Contains: LLMProvider, ModelDeployment, LLMRequest, LLMResponse, ModelCostRecord.
 */

/** Supported LLM providers (LiteLLM's provider enum) */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'local' | 'custom';

/** Model deployment descriptor (LiteLLM model_list entry) */
export interface ModelDeployment {
  id: string;
  provider: LLMProvider;
  modelName: string;
  /** API base URL */
  apiBase?: string;
  /** Cost per 1K input tokens */
  inputCostPer1k: number;
  /** Cost per 1K output tokens */
  outputCostPer1k: number;
  /** Max tokens per request */
  maxTokens: number;
  /** Requests per minute limit */
  rpm: number;
  /** Whether this deployment is currently healthy */
  healthy: boolean;
  /** Cooldown until (ISO timestamp) */
  cooldownUntil: string | null;
}

/** Request to the router */
export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Response from the router */
export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  usage: { inputTokens: number; outputTokens: number };
  cost: number;
  latencyMs: number;
}

/** Cost tracking per model */
export interface ModelCostRecord {
  modelId: string;
  totalCost: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  budgetLimit: number | null;
}
