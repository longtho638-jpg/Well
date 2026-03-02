/**
 * Agent Heartbeat Monitor — Uptime-Kuma heartbeat loop pattern.
 *
 * Active heartbeat monitor: periodically probes agents for liveness.
 * Pattern source: louislam/uptime-kuma server/model/monitor.js
 */

export type {
  HeartbeatStatus,
  HeartbeatConfig,
  HeartbeatRecord,
  MonitoredAgent,
} from './agent-heartbeat-monitor-types';

import type {
  HeartbeatStatus,
  HeartbeatConfig,
  MonitoredAgent,
  HeartbeatNotifyCallback,
} from './agent-heartbeat-monitor-types';
import { DEFAULT_HEARTBEAT_CONFIG } from './agent-heartbeat-monitor-types';

import {
  probeWithTimeout,
  createHeartbeatRecord,
  appendHeartbeatRecord,
  recalcUptime,
  shouldResendNotification,
  sleep,
} from './agent-heartbeat-monitor-health-check-helpers';

import type { HeartbeatRecord } from './agent-heartbeat-monitor-types';

// ─── Heartbeat Monitor ───────────────────────────────────────

/**
 * Active heartbeat monitor for agents.
 * Uptime-Kuma pattern: periodic probe → retry on failure → alert after threshold.
 */
class AgentHeartbeatMonitor {
  private agents: Map<string, MonitoredAgent> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private onNotify: HeartbeatNotifyCallback | null = null;

  setNotificationHandler(handler: HeartbeatNotifyCallback): void {
    this.onNotify = handler;
  }

  register(
    agentName: string,
    probe: () => Promise<boolean>,
    config: Partial<HeartbeatConfig> = {},
  ): void {
    const fullConfig = { ...DEFAULT_HEARTBEAT_CONFIG, ...config };
    this.agents.set(agentName, {
      agentName,
      config: fullConfig,
      probe,
      status: 'pending',
      consecutiveFailures: 0,
      heartbeats: [],
      uptimePercent: 100,
      maintenanceUntil: null,
      lastNotificationAt: null,
    });
  }

  start(agentName: string): void {
    const agent = this.agents.get(agentName);
    if (!agent) return;
    this.stop(agentName);
    this.beat(agentName);
    const timer = setInterval(() => this.beat(agentName), agent.config.intervalMs);
    this.timers.set(agentName, timer);
  }

  startAll(): void {
    for (const name of this.agents.keys()) this.start(name);
  }

  stop(agentName: string): void {
    const timer = this.timers.get(agentName);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(agentName);
    }
  }

  stopAll(): void {
    for (const name of this.timers.keys()) this.stop(name);
  }

  async beat(agentName: string): Promise<HeartbeatRecord | null> {
    const agent = this.agents.get(agentName);
    if (!agent) return null;

    // Maintenance window
    if (agent.maintenanceUntil && Date.now() < agent.maintenanceUntil) {
      const record = createHeartbeatRecord(agent, 'maintenance', 0, 'Maintenance window active');
      appendHeartbeatRecord(agent, record);
      return record;
    }

    // Probe with retry
    let lastError = '';
    for (let attempt = 0; attempt <= agent.config.retryCount; attempt++) {
      const start = Date.now();
      try {
        const result = await probeWithTimeout(agent.probe, agent.config.timeoutMs);
        const responseTime = Date.now() - start;

        if (result) {
          const previousStatus = agent.status;
          agent.status = 'up';
          agent.consecutiveFailures = 0;

          const record = createHeartbeatRecord(agent, 'up', responseTime, 'OK');
          appendHeartbeatRecord(agent, record);
          recalcUptime(agent);

          if (previousStatus === 'down') {
            this.notify(agentName, 'up', `Agent ${agentName} recovered`);
          }

          return record;
        }
        lastError = 'Probe returned false';
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      if (attempt < agent.config.retryCount) {
        await sleep(agent.config.retryDelayMs);
      }
    }

    // All retries exhausted
    const now = Date.now();
    const previousStatus = agent.status;
    agent.status = 'down';
    agent.consecutiveFailures++;

    const record = createHeartbeatRecord(agent, 'down', 0, lastError);
    appendHeartbeatRecord(agent, record);
    recalcUptime(agent);

    if (previousStatus !== 'down' || shouldResendNotification(agent)) {
      this.notify(agentName, 'down', `Agent ${agentName} is DOWN: ${lastError}`);
      agent.lastNotificationAt = now;
    }

    return record;
  }

  setMaintenance(agentName: string, durationMs: number): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.maintenanceUntil = Date.now() + durationMs;
      agent.status = 'maintenance';
    }
  }

  clearMaintenance(agentName: string): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.maintenanceUntil = null;
      agent.status = 'pending';
    }
  }

  getStatus(agentName: string): MonitoredAgent | undefined {
    return this.agents.get(agentName);
  }

  getStatusPage(): Array<{
    agentName: string;
    status: HeartbeatStatus;
    uptimePercent: number;
    lastHeartbeat: HeartbeatRecord | null;
    isInMaintenance: boolean;
  }> {
    return Array.from(this.agents.values()).map((agent) => ({
      agentName: agent.agentName,
      status: agent.status,
      uptimePercent: agent.uptimePercent,
      lastHeartbeat: agent.heartbeats[agent.heartbeats.length - 1] ?? null,
      isInMaintenance: agent.maintenanceUntil !== null && Date.now() < agent.maintenanceUntil,
    }));
  }

  getSystemUptime(): { totalMonitors: number; upCount: number; downCount: number; avgUptime: number } {
    const agents = Array.from(this.agents.values());
    const upCount = agents.filter((a) => a.status === 'up').length;
    const downCount = agents.filter((a) => a.status === 'down').length;
    const avgUptime = agents.length > 0
      ? agents.reduce((sum, a) => sum + a.uptimePercent, 0) / agents.length
      : 100;
    return {
      totalMonitors: agents.length,
      upCount,
      downCount,
      avgUptime: Math.round(avgUptime * 100) / 100,
    };
  }

  clear(): void {
    this.stopAll();
    this.agents.clear();
  }

  // ─── Internal ─────────────────────────────────────────

  private notify(agentName: string, status: HeartbeatStatus, message: string): void {
    if (this.onNotify) {
      Promise.resolve(this.onNotify(agentName, status, message)).catch(() => {});
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const agentHeartbeatMonitor = new AgentHeartbeatMonitor();
