/**
 * Agent LLM Router — LiteLLM Proxy Pattern
 *
 * Maps BerriAI/litellm's unified LLM interface to agent model routing.
 * Single API for multiple providers, with fallback, cost tracking, rate limiting.
 *
 * LiteLLM concepts mapped:
 * - Router: routes requests to model deployments
 * - ModelInfo: provider + model + pricing metadata
 * - Fallback: ordered list of models to try on failure
 * - Budget: per-model cost tracking and limits
 * - CooldownList: temporarily disable failed deployments
 *
 * Pattern source: BerriAI/litellm litellm/router.py
 */

// ─── Types ──────────────────────────────────────────────────

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

// ─── Router ─────────────────────────────────────────────────

/**
 * Singleton LLM router — LiteLLM's Router class equivalent.
 * Routes requests, tracks costs, handles fallback.
 */
class AgentLLMRouter {
  private deployments = new Map<string, ModelDeployment>();
  private costs = new Map<string, ModelCostRecord>();
  private fallbackOrder: string[] = [];
  private cooldownMs = 60_000;

  /** Register a model deployment */
  addDeployment(deployment: ModelDeployment): void {
    this.deployments.set(deployment.id, deployment);
    if (!this.costs.has(deployment.id)) {
      this.costs.set(deployment.id, {
        modelId: deployment.id,
        totalCost: 0,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        budgetLimit: null,
      });
    }
  }

  /** Set fallback order (list of deployment IDs) */
  setFallbackOrder(order: string[]): void {
    this.fallbackOrder = order;
  }

  /** Set budget limit for a model */
  setBudget(modelId: string, limit: number): void {
    const cost = this.costs.get(modelId);
    if (cost) cost.budgetLimit = limit;
  }

  /** Select best available deployment (LiteLLM routing logic) */
  selectDeployment(preferredModel?: string): ModelDeployment | null {
    const now = new Date().toISOString();
    const order = preferredModel
      ? [preferredModel, ...this.fallbackOrder.filter((id) => id !== preferredModel)]
      : this.fallbackOrder.length > 0
        ? this.fallbackOrder
        : Array.from(this.deployments.keys());

    for (const id of order) {
      const d = this.deployments.get(id);
      if (!d) continue;
      if (!d.healthy) continue;
      if (d.cooldownUntil && d.cooldownUntil > now) continue;

      // Check budget
      const cost = this.costs.get(id);
      if (cost?.budgetLimit && cost.totalCost >= cost.budgetLimit) continue;

      return d;
    }
    return null;
  }

  /** Record a successful request (cost tracking) */
  recordUsage(modelId: string, usage: { inputTokens: number; outputTokens: number }): number {
    const d = this.deployments.get(modelId);
    const cost = this.costs.get(modelId);
    if (!d || !cost) return 0;

    const requestCost =
      (usage.inputTokens / 1000) * d.inputCostPer1k +
      (usage.outputTokens / 1000) * d.outputCostPer1k;

    cost.totalCost += requestCost;
    cost.totalRequests++;
    cost.totalInputTokens += usage.inputTokens;
    cost.totalOutputTokens += usage.outputTokens;

    return requestCost;
  }

  /** Mark deployment as failed (cooldown — LiteLLM cooldown list) */
  markFailed(modelId: string): void {
    const d = this.deployments.get(modelId);
    if (!d) return;
    d.healthy = false;
    d.cooldownUntil = new Date(Date.now() + this.cooldownMs).toISOString();

    // Auto-recover after cooldown
    setTimeout(() => {
      d.healthy = true;
      d.cooldownUntil = null;
    }, this.cooldownMs);
  }

  /** Mark deployment as healthy */
  markHealthy(modelId: string): void {
    const d = this.deployments.get(modelId);
    if (!d) return;
    d.healthy = true;
    d.cooldownUntil = null;
  }

  /** Get cost summary for all models */
  getCostSummary(): ModelCostRecord[] {
    return Array.from(this.costs.values());
  }

  /** Get total spend across all models */
  getTotalSpend(): number {
    let total = 0;
    for (const c of this.costs.values()) total += c.totalCost;
    return total;
  }

  /** List all deployments with health status */
  listDeployments(): ModelDeployment[] {
    return Array.from(this.deployments.values());
  }

  /** Get healthy deployment count */
  getHealthyCount(): number {
    const now = new Date().toISOString();
    return Array.from(this.deployments.values()).filter(
      (d) => d.healthy && (!d.cooldownUntil || d.cooldownUntil <= now),
    ).length;
  }

  /** Configure cooldown duration */
  setCooldownMs(ms: number): void {
    this.cooldownMs = ms;
  }

  /** Clear all deployments and costs */
  clear(): void {
    this.deployments.clear();
    this.costs.clear();
    this.fallbackOrder = [];
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentLLMRouter = new AgentLLMRouter();
