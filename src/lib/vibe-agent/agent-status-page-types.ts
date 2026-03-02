/**
 * Agent Status Page — Types (Uptime-Kuma public status page pattern)
 *
 * Extracted from agent-status-page.ts.
 * Contains: IncidentSeverity, IncidentStatus, Incident, AgentStatusEntry,
 * MonitorGroup, StatusPageData.
 */

import type { HeartbeatStatus } from './agent-heartbeat-monitor-types';
import type { AgentHealthStatus } from './agent-health-monitor';

export type IncidentSeverity = 'minor' | 'major' | 'critical';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedAgents: string[];
  message: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface AgentStatusEntry {
  agentName: string;
  overallStatus: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptimePercent: number;
  heartbeatStatus: HeartbeatStatus | null;
  executionHealth: AgentHealthStatus | null;
  avgResponseTimeMs: number;
  isInMaintenance: boolean;
}

export interface MonitorGroup {
  name: string;
  description: string;
  agents: string[];
}

export interface StatusPageData {
  title: string;
  systemStatus: 'operational' | 'degraded' | 'major-outage';
  agents: AgentStatusEntry[];
  groups: MonitorGroup[];
  activeIncidents: Incident[];
  recentIncidents: Incident[];
  systemUptimePercent: number;
  lastUpdated: string;
}
