/**
 * Agent Health Monitor — Electron crash recovery + process monitoring pattern.
 *
 * Tracks agent execution health: success rate, latency, error counts.
 * Implements circuit breaker for failing agents (auto-disable after N failures).
 *
 * Pattern source: electron crashReporter + Akka supervisor strategies
 */

import { agentEventBus } from './agent-event-bus';

// ─── Health Types ───────────────────────────────────────────

export interface AgentHealthStatus {
  agentName: string;
  state: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  consecutiveErrors: number;
  successRate: number;
  avgLatencyMs: number;
  lastExecutionAt: string | null;
  lastErrorMessage: string | null;
}

interface AgentHealthRecord {
  agentName: string;
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  consecutiveErrors: number;
  totalLatencyMs: number;
  lastExecutionAt: string | null;
  lastErrorMessage: string | null;
  disabledUntil: number | null;
}

// ─── Health Monitor ─────────────────────────────────────────

/**
 * Singleton monitor tracking agent health.
 * Circuit breaker: disables agent after consecutiveErrorThreshold failures.
 * Recovery: auto-re-enables after cooldownMs.
 */
class AgentHealthMonitor {
  private records: Map<string, AgentHealthRecord> = new Map();
  private consecutiveErrorThreshold = 5;
  private cooldownMs = 30_000; // 30 seconds

  /** Record a successful execution */
  recordSuccess(agentName: string, latencyMs: number): void {
    const record = this.getOrCreate(agentName);
    record.totalExecutions++;
    record.successCount++;
    record.consecutiveErrors = 0;
    record.totalLatencyMs += latencyMs;
    record.lastExecutionAt = new Date().toISOString();
    record.disabledUntil = null;

    agentEventBus.emit('agent:completed', {
      agentName,
      action: 'execute',
      timestamp: record.lastExecutionAt,
      durationMs: latencyMs,
    }, 'health-monitor').catch(() => {});
  }

  /** Record a failed execution */
  recordError(agentName: string, error: string, latencyMs: number): void {
    const record = this.getOrCreate(agentName);
    record.totalExecutions++;
    record.errorCount++;
    record.consecutiveErrors++;
    record.totalLatencyMs += latencyMs;
    record.lastExecutionAt = new Date().toISOString();
    record.lastErrorMessage = error;

    // Circuit breaker: disable if too many consecutive errors
    if (record.consecutiveErrors >= this.consecutiveErrorThreshold) {
      record.disabledUntil = Date.now() + this.cooldownMs;
    }

    agentEventBus.emit('agent:error', {
      agentName,
      action: 'execute',
      timestamp: record.lastExecutionAt,
      durationMs: latencyMs,
      error,
    }, 'health-monitor').catch(() => {});
  }

  /** Check if an agent is currently enabled */
  isEnabled(agentName: string): boolean {
    const record = this.records.get(agentName);
    if (!record) return true; // Unknown agents are allowed
    if (!record.disabledUntil) return true;
    // Auto-recovery after cooldown
    if (Date.now() > record.disabledUntil) {
      record.disabledUntil = null;
      record.consecutiveErrors = 0;
      return true;
    }
    return false;
  }

  /** Get health status for a specific agent */
  getStatus(agentName: string): AgentHealthStatus {
    const record = this.getOrCreate(agentName);
    const successRate = record.totalExecutions > 0
      ? (record.successCount / record.totalExecutions) * 100
      : 100;
    const avgLatencyMs = record.totalExecutions > 0
      ? record.totalLatencyMs / record.totalExecutions
      : 0;

    let state: AgentHealthStatus['state'] = 'healthy';
    if (record.disabledUntil && Date.now() < record.disabledUntil) {
      state = 'disabled';
    } else if (successRate < 50) {
      state = 'unhealthy';
    } else if (successRate < 80 || record.consecutiveErrors >= 2) {
      state = 'degraded';
    }

    return {
      agentName,
      state,
      totalExecutions: record.totalExecutions,
      successCount: record.successCount,
      errorCount: record.errorCount,
      consecutiveErrors: record.consecutiveErrors,
      successRate: Math.round(successRate * 100) / 100,
      avgLatencyMs: Math.round(avgLatencyMs),
      lastExecutionAt: record.lastExecutionAt,
      lastErrorMessage: record.lastErrorMessage,
    };
  }

  /** Get health status for all tracked agents */
  getAllStatuses(): AgentHealthStatus[] {
    return Array.from(this.records.keys()).map((name) => this.getStatus(name));
  }

  /** Get aggregate system health */
  getSystemHealth(): {
    totalAgents: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    disabled: number;
  } {
    const statuses = this.getAllStatuses();
    return {
      totalAgents: statuses.length,
      healthy: statuses.filter((s) => s.state === 'healthy').length,
      degraded: statuses.filter((s) => s.state === 'degraded').length,
      unhealthy: statuses.filter((s) => s.state === 'unhealthy').length,
      disabled: statuses.filter((s) => s.state === 'disabled').length,
    };
  }

  /** Reset all health records (useful for testing) */
  clear(): void {
    this.records.clear();
  }

  // ─── Internal ───────────────────────────────────────────────

  private getOrCreate(agentName: string): AgentHealthRecord {
    let record = this.records.get(agentName);
    if (!record) {
      record = {
        agentName,
        totalExecutions: 0,
        successCount: 0,
        errorCount: 0,
        consecutiveErrors: 0,
        totalLatencyMs: 0,
        lastExecutionAt: null,
        lastErrorMessage: null,
        disabledUntil: null,
      };
      this.records.set(agentName, record);
    }
    return record;
  }
}

// ─── Singleton Export ───────────────────────────────────────

export const agentHealthMonitor = new AgentHealthMonitor();
