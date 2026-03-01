/**
 * Agent Status Page — Uptime-Kuma public status page pattern.
 *
 * Provides a data model for displaying agent system health,
 * incident history, and uptime metrics — exactly like Uptime-Kuma's
 * public status page feature.
 *
 * Pattern source: louislam/uptime-kuma server/model/status_page.js
 *
 * This module aggregates data from:
 * - agentHeartbeatMonitor (heartbeat records)
 * - agentHealthMonitor (execution health)
 * - notificationDispatcher (alert history)
 */

import { agentHealthMonitor, type AgentHealthStatus } from './agent-health-monitor';
import { agentHeartbeatMonitor, type HeartbeatStatus } from './agent-heartbeat-monitor';
import { notificationDispatcher, type AgentAlert } from './notification-dispatcher';

// ─── Status Page Types ─────────────────────────────────────

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
  /** Combined status from heartbeat + execution health */
  overallStatus: 'operational' | 'degraded' | 'down' | 'maintenance';
  /** Uptime percentage from heartbeat monitor */
  uptimePercent: number;
  /** Latest heartbeat status */
  heartbeatStatus: HeartbeatStatus | null;
  /** Execution health status */
  executionHealth: AgentHealthStatus | null;
  /** Average response time (ms) */
  avgResponseTimeMs: number;
  /** Whether currently in maintenance */
  isInMaintenance: boolean;
}

export interface MonitorGroup {
  name: string;
  description: string;
  agents: string[];
}

export interface StatusPageData {
  /** Page title */
  title: string;
  /** Overall system status */
  systemStatus: 'operational' | 'degraded' | 'major-outage';
  /** Individual agent statuses */
  agents: AgentStatusEntry[];
  /** Agent groups (Uptime-Kuma monitor groups) */
  groups: MonitorGroup[];
  /** Active incidents */
  activeIncidents: Incident[];
  /** Recent resolved incidents */
  recentIncidents: Incident[];
  /** System-wide uptime average */
  systemUptimePercent: number;
  /** Last updated timestamp */
  lastUpdated: string;
}

// ─── Status Page Manager ───────────────────────────────────

/**
 * Status page data aggregator.
 * Combines heartbeat, health, and alert data into a unified status view.
 */
class AgentStatusPage {
  private title = 'Well RaaS Agent-OS Status';
  private groups: MonitorGroup[] = [];
  private incidents: Incident[] = [];

  /** Set status page title */
  setTitle(title: string): void {
    this.title = title;
  }

  /** Define a monitor group (like Uptime-Kuma's monitor groups) */
  addGroup(name: string, description: string, agents: string[]): void {
    this.groups.push({ name, description, agents });
  }

  /** Create a new incident */
  createIncident(
    title: string,
    severity: IncidentSeverity,
    affectedAgents: string[],
    message: string,
  ): Incident {
    const incident: Incident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      severity,
      status: 'investigating',
      affectedAgents,
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.incidents.push(incident);
    return incident;
  }

  /** Update incident status */
  updateIncident(incidentId: string, status: IncidentStatus, message?: string): void {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    if (message) incident.message = message;
    if (status === 'resolved') {
      incident.resolvedAt = new Date().toISOString();
    }
  }

  /**
   * Generate full status page data.
   * Aggregates from heartbeat monitor, health monitor, and incidents.
   */
  getStatusPageData(): StatusPageData {
    // Get heartbeat statuses
    const heartbeatStatuses = agentHeartbeatMonitor.getStatusPage();

    // Get execution health statuses
    const healthStatuses = agentHealthMonitor.getAllStatuses();

    // Build agent status entries by merging both sources
    const agentNames = new Set<string>();
    for (const hb of heartbeatStatuses) agentNames.add(hb.agentName);
    for (const hs of healthStatuses) agentNames.add(hs.agentName);

    const agents: AgentStatusEntry[] = Array.from(agentNames).map((name) => {
      const hb = heartbeatStatuses.find((h) => h.agentName === name);
      const hs = healthStatuses.find((h) => h.agentName === name);

      return {
        agentName: name,
        overallStatus: this.computeOverallStatus(hb?.status ?? null, hs ?? null),
        uptimePercent: hb?.uptimePercent ?? 100,
        heartbeatStatus: hb?.status ?? null,
        executionHealth: hs ?? null,
        avgResponseTimeMs: hs?.avgLatencyMs ?? 0,
        isInMaintenance: hb?.isInMaintenance ?? false,
      };
    });

    // Calculate system status
    const downCount = agents.filter((a) => a.overallStatus === 'down').length;
    const degradedCount = agents.filter((a) => a.overallStatus === 'degraded').length;
    const systemStatus: StatusPageData['systemStatus'] =
      downCount > 0 ? 'major-outage' :
      degradedCount > 0 ? 'degraded' :
      'operational';

    // System uptime average
    const systemUptimePercent = agents.length > 0
      ? agents.reduce((sum, a) => sum + a.uptimePercent, 0) / agents.length
      : 100;

    // Split incidents
    const activeIncidents = this.incidents.filter((i) => i.status !== 'resolved');
    const recentIncidents = this.incidents
      .filter((i) => i.status === 'resolved')
      .slice(-10)
      .reverse();

    return {
      title: this.title,
      systemStatus,
      agents,
      groups: this.groups,
      activeIncidents,
      recentIncidents,
      systemUptimePercent: Math.round(systemUptimePercent * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };
  }

  /** Get recent alerts from notification dispatcher */
  getRecentAlerts(limit = 20): AgentAlert[] {
    return notificationDispatcher.getHistory(limit);
  }

  /** Clear all state */
  clear(): void {
    this.groups = [];
    this.incidents = [];
  }

  // ─── Internal ─────────────────────────────────────────────

  private computeOverallStatus(
    heartbeat: HeartbeatStatus | null,
    health: AgentHealthStatus | null,
  ): AgentStatusEntry['overallStatus'] {
    // Maintenance takes precedence
    if (heartbeat === 'maintenance') return 'maintenance';

    // Heartbeat DOWN = definitely down
    if (heartbeat === 'down') return 'down';

    // Health status check
    if (health) {
      if (health.state === 'disabled' || health.state === 'unhealthy') return 'down';
      if (health.state === 'degraded') return 'degraded';
    }

    // Heartbeat UP + Health healthy = operational
    if (heartbeat === 'up' && (!health || health.state === 'healthy')) return 'operational';

    // Pending or unknown = operational (optimistic default)
    return 'operational';
  }
}

// ─── Singleton Export ───────────────────────────────────────

export const agentStatusPage = new AgentStatusPage();
