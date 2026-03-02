/**
 * Agent Heartbeat Monitor — Health Check Helper Functions
 *
 * Extracted from agent-heartbeat-monitor.ts.
 * Pure helper functions: probeWithTimeout, createHeartbeatRecord,
 * appendHeartbeatRecord, recalcUptime, shouldResendNotification.
 */

import type {
  HeartbeatStatus,
  HeartbeatRecord,
  MonitoredAgent,
} from './agent-heartbeat-monitor-types';
import { MAX_HEARTBEAT_HISTORY } from './agent-heartbeat-monitor-types';

/** Run probe with a hard timeout (Uptime-Kuma: monitor timeout) */
export function probeWithTimeout(
  probe: () => Promise<boolean>,
  timeoutMs: number,
): Promise<boolean> {
  return Promise.race([
    probe(),
    new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Probe timeout')), timeoutMs),
    ),
  ]);
}

/** Build a heartbeat record for a given agent + status */
export function createHeartbeatRecord(
  agent: MonitoredAgent,
  status: HeartbeatStatus,
  responseTimeMs: number,
  message: string,
): HeartbeatRecord {
  return {
    agentName: agent.agentName,
    status,
    responseTimeMs,
    message,
    timestamp: new Date().toISOString(),
    retryAttempt: agent.consecutiveFailures,
  };
}

/** Append a record to the agent's ring buffer, trimming to MAX_HEARTBEAT_HISTORY */
export function appendHeartbeatRecord(agent: MonitoredAgent, record: HeartbeatRecord): void {
  agent.heartbeats.push(record);
  if (agent.heartbeats.length > MAX_HEARTBEAT_HISTORY) {
    agent.heartbeats.shift();
  }
}

/** Recalculate uptime percentage from heartbeat ring buffer */
export function recalcUptime(agent: MonitoredAgent): void {
  if (agent.heartbeats.length === 0) {
    agent.uptimePercent = 100;
    return;
  }
  const upBeats = agent.heartbeats.filter((h) => h.status === 'up').length;
  const totalBeats = agent.heartbeats.filter((h) => h.status !== 'maintenance').length;
  agent.uptimePercent = totalBeats > 0
    ? Math.round((upBeats / totalBeats) * 10000) / 100
    : 100;
}

/** Check whether a resend-notification interval has elapsed */
export function shouldResendNotification(agent: MonitoredAgent): boolean {
  if (agent.config.resendIntervalMs <= 0) return false;
  if (!agent.lastNotificationAt) return true;
  return Date.now() - agent.lastNotificationAt >= agent.config.resendIntervalMs;
}

/** Simple async sleep */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
