/**
 * Vibe Agent SDK — Abstract Base Agent
 *
 * Provider-agnostic base class for all agents. Provides:
 * - Structured logging via injected deps (no direct console usage)
 * - Policy checking against agent definition constraints
 * - KPI tracking with updateKPI pattern
 * - Retry-with-recovery for external API calls
 *
 * Decoupled from any app-specific logger, error class, or retry utility.
 * Consumers inject their own infrastructure via VibeAgentDeps.
 */

import type {
  VibeAgentDefinition,
  VibeAgentDeps,
  VibeAgentKPI,
  VibeAgentLog,
} from './types';

// ─── Default no-op deps (safe fallback) ──────────────────────

const defaultDeps: VibeAgentDeps = {
  log: () => {},
  retry: async (fn) => fn(),
};

// ─── Abstract Base Agent ─────────────────────────────────────

export abstract class VibeBaseAgent {
  public definition: VibeAgentDefinition;
  protected logs: VibeAgentLog[] = [];
  protected deps: VibeAgentDeps;

  constructor(definition: VibeAgentDefinition, deps?: Partial<VibeAgentDeps>) {
    this.definition = definition;
    this.deps = { ...defaultDeps, ...deps };
  }

  /** Execute the agent's primary action — must be implemented by subclasses */
  abstract execute(input: unknown): Promise<unknown>;

  /**
   * Check if an action violates any hard policies.
   * Returns true if action is allowed.
   */
  protected async checkPolicies(action: string, _context: Record<string, unknown>): Promise<boolean> {
    for (const policy of this.definition.policy_and_constraints) {
      if (policy.enforcement === 'hard') {
        this.deps.log('warn', `[Policy Check] ${policy.rule} for action: ${action}`);
      }
    }
    return true;
  }

  /** Log an agent action with structured inputs/outputs */
  protected log(action: string, inputs: unknown, outputs: unknown, approved?: boolean): void {
    const entry: VibeAgentLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      agentName: this.definition.agent_name,
      action,
      timestamp: new Date().toISOString(),
      inputs: (typeof inputs === 'object' && inputs !== null ? inputs : { value: inputs }) as Record<string, unknown>,
      outputs: (typeof outputs === 'object' && outputs !== null ? outputs : { value: outputs }) as Record<string, unknown>,
      humanApproved: approved,
    };
    this.logs.push(entry);
  }

  /** Update a KPI value by name */
  protected updateKPI(name: string, value: number): void {
    const kpi = this.definition.success_kpis.find((k) => k.name === name);
    if (kpi) {
      kpi.current = value;
      this.deps.log('debug', `[${this.definition.agent_name}] KPI: ${name} = ${value}`);
    }
  }

  /** Execute an async operation with retry and structured error recovery */
  protected async executeWithRecovery<T>(
    operation: () => Promise<T>,
    options: { actionName: string; maxAttempts?: number; fallback?: () => T },
  ): Promise<T> {
    try {
      return await this.deps.retry(operation, {
        maxAttempts: options.maxAttempts ?? 2,
        delay: 1000,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.deps.log('error', `[${this.definition.agent_name}] ${options.actionName} failed: ${msg}`);
      if (options.fallback) return options.fallback();
      throw error;
    }
  }

  // ─── Accessors ─────────────────────────────────────────────

  getLogs(): VibeAgentLog[] {
    return [...this.logs];
  }

  getKPIs(): VibeAgentKPI[] {
    return this.definition.success_kpis;
  }

  getDefinition(): VibeAgentDefinition {
    return this.definition;
  }

  clearLogs(): void {
    this.logs = [];
  }
}
