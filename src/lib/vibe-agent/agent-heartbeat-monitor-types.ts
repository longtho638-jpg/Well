/**
 * Agent Heartbeat Monitor — Types (extracted from agent-heartbeat-monitor.ts)
 *
 * Uptime-Kuma heartbeat loop pattern types:
 * HeartbeatStatus, HeartbeatConfig, HeartbeatRecord, MonitoredAgent,
 * HeartbeatNotifyCallback, DEFAULT_CONFIG, MAX_HEARTBEAT_HISTORY.
 */

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

export type HeartbeatNotifyCallback = (
  agentName: string,
  status: HeartbeatStatus,
  message: string,
) => void | Promise<void>;

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  intervalMs: 60_000,
  retryCount: 3,
  retryDelayMs: 5_000,
  timeoutMs: 10_000,
  resendIntervalMs: 0,
};

export const MAX_HEARTBEAT_HISTORY = 50;
