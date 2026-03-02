/**
 * Agent Heartbeat Monitor — Status page and system uptime query helpers.
 *
 * Extracted from agent-heartbeat-monitor.ts.
 * Provides getStatusPage() and getSystemUptime() data-shaping logic
 * operating on the MonitoredAgent map from the heartbeat monitor.
 */

import type { MonitoredAgent, HeartbeatStatus, HeartbeatRecord } from './agent-heartbeat-monitor-types';

export interface HeartbeatStatusPageEntry {
  agentName: string;
  status: HeartbeatStatus;
  uptimePercent: number;
  lastHeartbeat: HeartbeatRecord | null;
  isInMaintenance: boolean;
}

export interface HeartbeatSystemUptime {
  totalMonitors: number;
  upCount: number;
  downCount: number;
  avgUptime: number;
}

export function buildStatusPage(agents: Map<string, MonitoredAgent>): HeartbeatStatusPageEntry[] {
  return Array.from(agents.values()).map((agent) => ({
    agentName: agent.agentName,
    status: agent.status,
    uptimePercent: agent.uptimePercent,
    lastHeartbeat: agent.heartbeats[agent.heartbeats.length - 1] ?? null,
    isInMaintenance: agent.maintenanceUntil !== null && Date.now() < agent.maintenanceUntil,
  }));
}

export function buildSystemUptime(agents: Map<string, MonitoredAgent>): HeartbeatSystemUptime {
  const list = Array.from(agents.values());
  const upCount = list.filter((a) => a.status === 'up').length;
  const downCount = list.filter((a) => a.status === 'down').length;
  const avgUptime = list.length > 0
    ? list.reduce((sum, a) => sum + a.uptimePercent, 0) / list.length
    : 100;
  return {
    totalMonitors: list.length,
    upCount,
    downCount,
    avgUptime: Math.round(avgUptime * 100) / 100,
  };
}
