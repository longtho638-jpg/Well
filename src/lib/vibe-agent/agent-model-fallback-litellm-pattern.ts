/**
 * Agent Model Fallback — LiteLLM Fallback Chain Pattern
 *
 * Maps BerriAI/litellm's fallback + retry logic to agent execution.
 * When an agent's primary model fails, try backup models in order.
 *
 * LiteLLM concepts mapped:
 * - Fallback: ordered model list per completion call
 * - ContextWindow fallback: auto-switch on context overflow
 * - RetryPolicy: per-model retry with backoff
 * - HealthCheck: model availability probing
 *
 * Pattern source: BerriAI/litellm litellm/router.py fallback logic
 */

// ─── Types ──────────────────────────────────────────────────

/** Fallback strategy (LiteLLM fallback modes) */
export type FallbackStrategy = 'ordered' | 'round-robin' | 'least-cost' | 'lowest-latency';

/** Model health probe result */
export interface HealthProbe {
  modelId: string;
  healthy: boolean;
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

/** Fallback execution result */
export interface FallbackResult<T = unknown> {
  success: boolean;
  result: T | null;
  modelUsed: string;
  attemptsMade: number;
  fallbacksTriggered: string[];
  totalLatencyMs: number;
  error?: string;
}

/** Per-model retry configuration */
export interface ModelRetryConfig {
  modelId: string;
  maxRetries: number;
  retryDelayMs: number;
  /** Errors that trigger fallback (not retry) */
  fallbackErrors: string[];
}

// ─── Fallback Engine ────────────────────────────────────────

/**
 * Singleton fallback engine for agent model execution.
 * Mirrors LiteLLM's fallback chain with health tracking.
 */
class AgentModelFallback {
  private chains = new Map<string, string[]>();
  private retryConfigs = new Map<string, ModelRetryConfig>();
  private healthHistory = new Map<string, HealthProbe[]>();
  private strategy: FallbackStrategy = 'ordered';
  private maxProbeHistory = 10;

  /** Set fallback strategy */
  setStrategy(strategy: FallbackStrategy): void {
    this.strategy = strategy;
  }

  /** Define a fallback chain for a named operation */
  defineChain(operationName: string, modelIds: string[]): void {
    this.chains.set(operationName, modelIds);
  }

  /** Set retry config for a model */
  setRetryConfig(config: ModelRetryConfig): void {
    this.retryConfigs.set(config.modelId, config);
  }

  /** Execute with fallback chain */
  async executeWithFallback<T>(
    operationName: string,
    executor: (modelId: string) => Promise<T>,
  ): Promise<FallbackResult<T>> {
    const chain = this.chains.get(operationName);
    if (!chain || chain.length === 0) {
      return { success: false, result: null, modelUsed: '', attemptsMade: 0, fallbacksTriggered: [], totalLatencyMs: 0, error: 'No fallback chain defined' };
    }

    const orderedChain = this.orderByStrategy(chain);
    const fallbacksTriggered: string[] = [];
    const startTime = Date.now();
    let attemptsMade = 0;

    for (const modelId of orderedChain) {
      const retryConfig = this.retryConfigs.get(modelId);
      const maxRetries = retryConfig?.maxRetries ?? 1;
      const retryDelay = retryConfig?.retryDelayMs ?? 1000;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        attemptsMade++;
        try {
          const result = await executor(modelId);
          this.recordProbe(modelId, true, Date.now() - startTime);
          return {
            success: true,
            result,
            modelUsed: modelId,
            attemptsMade,
            fallbacksTriggered,
            totalLatencyMs: Date.now() - startTime,
          };
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const isFallbackError = retryConfig?.fallbackErrors.some((e) => errorMsg.includes(e));

          if (isFallbackError) break; // Skip to next model
          if (attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, retryDelay));
          }
        }
      }

      this.recordProbe(modelId, false, Date.now() - startTime);
      fallbacksTriggered.push(modelId);
    }

    return {
      success: false,
      result: null,
      modelUsed: '',
      attemptsMade,
      fallbacksTriggered,
      totalLatencyMs: Date.now() - startTime,
      error: `All ${orderedChain.length} models failed`,
    };
  }

  /** Record health probe result */
  private recordProbe(modelId: string, healthy: boolean, latencyMs: number, error?: string): void {
    const probes = this.healthHistory.get(modelId) ?? [];
    probes.push({ modelId, healthy, latencyMs, checkedAt: new Date().toISOString(), error });
    if (probes.length > this.maxProbeHistory) probes.shift();
    this.healthHistory.set(modelId, probes);
  }

  /** Order chain by strategy */
  private orderByStrategy(chain: string[]): string[] {
    if (this.strategy === 'ordered') return chain;

    if (this.strategy === 'lowest-latency') {
      return [...chain].sort((a, b) => {
        const aLatency = this.getAvgLatency(a);
        const bLatency = this.getAvgLatency(b);
        return aLatency - bLatency;
      });
    }

    return chain; // Default: ordered
  }

  /** Get average latency for a model */
  private getAvgLatency(modelId: string): number {
    const probes = this.healthHistory.get(modelId) ?? [];
    const healthy = probes.filter((p) => p.healthy);
    if (healthy.length === 0) return Infinity;
    return healthy.reduce((sum, p) => sum + p.latencyMs, 0) / healthy.length;
  }

  /** Get health status for all tracked models */
  getHealthStatus(): Array<{ modelId: string; healthy: boolean; avgLatencyMs: number; successRate: number }> {
    const result: Array<{ modelId: string; healthy: boolean; avgLatencyMs: number; successRate: number }> = [];
    for (const [modelId, probes] of this.healthHistory) {
      const successCount = probes.filter((p) => p.healthy).length;
      result.push({
        modelId,
        healthy: probes.length > 0 ? probes[probes.length - 1].healthy : true,
        avgLatencyMs: this.getAvgLatency(modelId),
        successRate: probes.length === 0 ? 1 : successCount / probes.length,
      });
    }
    return result;
  }

  /** Clear all chains and history */
  clear(): void {
    this.chains.clear();
    this.retryConfigs.clear();
    this.healthHistory.clear();
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentModelFallback = new AgentModelFallback();
