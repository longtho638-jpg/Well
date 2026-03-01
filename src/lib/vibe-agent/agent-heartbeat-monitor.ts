/**
 * Agent Heartbeat Monitor — Uptime-Kuma heartbeat loop pattern.
 *
 * Maps Uptime-Kuma's monitor.beat() heartbeat system to agent health probes.
 * Each agent has a configurable heartbeat interval, retry threshold,
 * and grace period before alerting — exactly like Uptime-Kuma monitors.
 *
 * Pattern source: louislam/uptime-kuma server/model/monitor.js
 *
 * Key differences from agent-health-monitor.ts:
 * - agent-health-monitor: Passive — records success/error after execution
 * - agent-heartbeat-monitor: Active — periodically probes agents for liveness
 */

// ─── Heartbeat Types ───────────────────────────────────────

export type HeartbeatStatus = 'up' | 'down' | 'pending' | 'maintenance';

export interface HeartbeatConfig {
  /** Check interval in ms (default: 60000 = 1 min, Uptime-Kuma default) */
  intervalMs: number;
  /** Number of retries before marking DOWN (Uptime-Kuma: retryInterval) */
  retryCount: number;
  /** Delay between retries in ms */
  retryDelayMs: number;
  /** Max response time before timeout (ms) */
  timeoutMs: number;
  /** Resend notification interval (0 = don't resend) */
  resendIntervalMs: number;
}

export interface HeartbeatRecord {
  agentName: string;
  status: HeartbeatStatus;
  responseTimeMs: number;
  message: string;
  timestamp: string;
  retryAttempt: number;
}

export interface MonitoredAgent {
  agentName: string;
  config: HeartbeatConfig;
  /** The health probe function — returns true if agent is alive */
  probe: () => Promise<boolean>;
  /** Current status */
  status: HeartbeatStatus;
  /** Consecutive failures before alerting */
  consecutiveFailures: number;
  /** Last N heartbeat records (ring buffer, max 50) */
  heartbeats: HeartbeatRecord[];
  /** Uptime percentage (last 24h) */
  uptimePercent: number;
  /** Whether in maintenance window */
  maintenanceUntil: number | null;
  /** Last notification sent timestamp */
  lastNotificationAt: number | null;
}

const DEFAULT_CONFIG: HeartbeatConfig = {
  intervalMs: 60_000,
  retryCount: 3,
  retryDelayMs: 5_000,
  timeoutMs: 10_000,
  resendIntervalMs: 0,
};

const MAX_HEARTBEAT_HISTORY = 50;

// ─── Notification Callback ─────────────────────────────────

type HeartbeatNotifyCallback = (
  agentName: string,
  status: HeartbeatStatus,
  message: string,
) => void | Promise<void>;

// ─── Heartbeat Monitor ─────────────────────────────────────

/**
 * Active heartbeat monitor for agents.
 * Uptime-Kuma pattern: periodic probe → retry on failure → alert after threshold.
 */
class AgentHeartbeatMonitor {
  private agents: Map<string, MonitoredAgent> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private onNotify: HeartbeatNotifyCallback | null = null;

  /** Set notification callback (like Uptime-Kuma notification providers) */
  setNotificationHandler(handler: HeartbeatNotifyCallback): void {
    this.onNotify = handler;
  }

  /**
   * Register an agent for heartbeat monitoring.
   * Like Uptime-Kuma's "Add New Monitor" with probe function.
   */
  register(
    agentName: string,
    probe: () => Promise<boolean>,
    config: Partial<HeartbeatConfig> = {},
  ): void {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

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

  /**
   * Start heartbeat loop for an agent.
   * Uptime-Kuma pattern: setInterval → beat() → record → alert if needed.
   */
  start(agentName: string): void {
    const agent = this.agents.get(agentName);
    if (!agent) return;

    // Clear existing timer if any
    this.stop(agentName);

    // Run first beat immediately
    this.beat(agentName);

    // Schedule periodic beats
    const timer = setInterval(() => this.beat(agentName), agent.config.intervalMs);
    this.timers.set(agentName, timer);
  }

  /** Start all registered monitors */
  startAll(): void {
    for (const name of this.agents.keys()) {
      this.start(name);
    }
  }

  /** Stop heartbeat loop for an agent */
  stop(agentName: string): void {
    const timer = this.timers.get(agentName);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(agentName);
    }
  }

  /** Stop all monitors */
  stopAll(): void {
    for (const name of this.timers.keys()) {
      this.stop(name);
    }
  }

  /**
   * Execute a single heartbeat — probe with retry.
   * Uptime-Kuma pattern: try probe → retry N times → mark UP or DOWN.
   */
  async beat(agentName: string): Promise<HeartbeatRecord | null> {
    const agent = this.agents.get(agentName);
    if (!agent) return null;

    // Skip if in maintenance window (Uptime-Kuma maintenance mode)
    if (agent.maintenanceUntil && Date.now() < agent.maintenanceUntil) {
      const record = this.createRecord(agent, 'maintenance', 0, 'Maintenance window active');
      this.appendRecord(agent, record);
      return record;
    }

    // Probe with retry (Uptime-Kuma retryInterval pattern)
    let lastError = '';
    for (let attempt = 0; attempt <= agent.config.retryCount; attempt++) {
      const start = Date.now();
      try {
        const result = await this.probeWithTimeout(agent.probe, agent.config.timeoutMs);
        const responseTime = Date.now() - start;

        if (result) {
          // SUCCESS — reset failures, mark UP
          const previousStatus = agent.status;
          agent.status = 'up';
          agent.consecutiveFailures = 0;

          const record = this.createRecord(agent, 'up', responseTime, 'OK');
          this.appendRecord(agent, record);
          this.recalcUptime(agent);

          // Notify recovery (DOWN → UP transition)
          if (previousStatus === 'down') {
            this.notify(agentName, 'up', `Agent ${agentName} recovered`);
          }

          return record;
        }
        lastError = 'Probe returned false';
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      // Wait before retry (except on last attempt)
      if (attempt < agent.config.retryCount) {
        await this.sleep(agent.config.retryDelayMs);
      }
    }

    // All retries exhausted — mark DOWN
    const responseTime = Date.now();
    const previousStatus = agent.status;
    agent.status = 'down';
    agent.consecutiveFailures++;

    const record = this.createRecord(agent, 'down', 0, lastError);
    this.appendRecord(agent, record);
    this.recalcUptime(agent);

    // Notify on first DOWN or resend interval
    if (previousStatus !== 'down' || this.shouldResendNotification(agent)) {
      this.notify(agentName, 'down', `Agent ${agentName} is DOWN: ${lastError}`);
      agent.lastNotificationAt = responseTime;
    }

    return record;
  }

  /**
   * Set maintenance window (Uptime-Kuma maintenance schedule).
   * Suppresses alerts during maintenance period.
   */
  setMaintenance(agentName: string, durationMs: number): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.maintenanceUntil = Date.now() + durationMs;
      agent.status = 'maintenance';
    }
  }

  /** Clear maintenance window */
  clearMaintenance(agentName: string): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.maintenanceUntil = null;
      agent.status = 'pending';
    }
  }

  /** Get status for a specific agent */
  getStatus(agentName: string): MonitoredAgent | undefined {
    return this.agents.get(agentName);
  }

  /** Get status page data (Uptime-Kuma public status page pattern) */
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

  /** Get aggregate system uptime */
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

  /** Clear all monitors and timers */
  clear(): void {
    this.stopAll();
    this.agents.clear();
  }

  // ─── Internal Helpers ──────────────────────────────────────

  /** Send notification via registered callback (Uptime-Kuma notification dispatch) */
  private notify(agentName: string, status: HeartbeatStatus, message: string): void {
    if (this.onNotify) {
      Promise.resolve(this.onNotify(agentName, status, message)).catch(() => {});
    }
  }

  private createRecord(
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

  private appendRecord(agent: MonitoredAgent, record: HeartbeatRecord): void {
    agent.heartbeats.push(record);
    if (agent.heartbeats.length > MAX_HEARTBEAT_HISTORY) {
      agent.heartbeats.shift();
    }
  }

  private recalcUptime(agent: MonitoredAgent): void {
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

  private shouldResendNotification(agent: MonitoredAgent): boolean {
    if (agent.config.resendIntervalMs <= 0) return false;
    if (!agent.lastNotificationAt) return true;
    return Date.now() - agent.lastNotificationAt >= agent.config.resendIntervalMs;
  }

  private async probeWithTimeout(probe: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
    return Promise.race([
      probe(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Probe timeout')), timeoutMs),
      ),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Singleton Export ───────────────────────────────────────

export const agentHeartbeatMonitor = new AgentHeartbeatMonitor();
