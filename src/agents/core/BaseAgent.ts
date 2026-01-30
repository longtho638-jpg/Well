import { AgentDefinition, AgentLog, AgentKPI, AgentPolicy } from '@/types/agentic';
import { agentLogger } from '@/utils/logger';

/**
 * Abstract base class for all agents in the Agentic OS.
 * Provides common functionality for policy checking, logging, and KPI tracking.
 * 
 * Phase 10: Unified agent interface with:
 * - Structured logging via agentLogger
 * - Shared updateKPI method
 * - Consistent execute pattern
 */
export abstract class BaseAgent {
  public definition: AgentDefinition;
  protected logs: AgentLog[] = [];

  constructor(definition: AgentDefinition) {
    this.definition = definition;
  }

  /**
   * Execute the agent's primary action.
   * Must be implemented by concrete agent classes.
   */
  abstract execute(input: unknown): Promise<unknown>;

  /**
   * Check if an action violates any policies.
   * @returns true if action is allowed, false if blocked
   */
  protected async checkPolicies(action: string, context: Record<string, unknown>): Promise<boolean> {
    for (const policy of this.definition.policy_and_constraints) {
      if (policy.enforcement === 'hard') {
        // Basic policy check - can be enhanced later
        // For now, we just log the check
        agentLogger.warn(`[Policy Check] ${policy.rule} for action: ${action}`);
      }
    }
    return true; // Allow by default for now
  }

  /**
   * Log an agent action with inputs and outputs.
   */
  protected log(action: string, inputs: unknown, outputs: unknown, approved?: boolean): void {
    const logEntry: AgentLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentName: this.definition.agent_name,
      action,
      timestamp: new Date().toISOString(),
      inputs: (typeof inputs === 'object' && inputs !== null ? inputs : { value: inputs }) as Record<string, unknown>,
      outputs: (typeof outputs === 'object' && outputs !== null ? outputs : { value: outputs }) as Record<string, unknown>,
      humanApproved: approved,
    };
    this.logs.push(logEntry);
  }

  /**
   * Update a KPI value by name.
   * Shared method for all agents - removes need for duplicate implementations.
   */
  protected updateKPI(name: string, value: number): void {
    const kpi = this.definition.success_kpis.find(k => k.name === name);
    if (kpi) {
      kpi.current = value;
      agentLogger.debug(`[${this.definition.agent_name}] KPI: ${name} = ${value}`);
    }
  }

  /**
   * Get all logs for this agent.
   */
  getLogs(): AgentLog[] {
    return [...this.logs];
  }

  /**
   * Get the agent's KPI definitions.
   */
  getKPIs(): AgentKPI[] {
    return this.definition.success_kpis;
  }

  /**
   * Get the agent's definition.
   */
  getDefinition(): AgentDefinition {
    return this.definition;
  }

  /**
   * Clear all logs (useful for testing).
   */
  clearLogs(): void {
    this.logs = [];
  }
}
