/**
 * Notification Dispatcher — Channel, Alert, Provider, Rule Types
 *
 * Extracted from notification-dispatcher.ts.
 * Uptime-Kuma multi-channel notification pattern types:
 * NotificationChannel, AlertSeverity, AgentAlert, NotificationProvider, NotificationRule.
 */

export type NotificationChannel = 'in-app' | 'push' | 'email' | 'webhook' | 'log';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'recovery';

export interface AgentAlert {
  /** Unique alert ID */
  alertId: string;
  /** Agent that triggered the alert */
  agentName: string;
  /** Severity level */
  severity: AlertSeverity;
  /** Human-readable title (e.g., "Agent Sales Copilot is DOWN") */
  title: string;
  /** Detailed message */
  message: string;
  /** Timestamp */
  timestamp: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Notification Provider interface — Uptime-Kuma provider pattern.
 * Each provider handles one channel (in-app, push, email, webhook, etc.).
 */
export interface NotificationProvider {
  /** Provider name (e.g., 'InAppNotifier', 'WebhookNotifier') */
  name: string;
  /** Channel this provider handles */
  channel: NotificationChannel;
  /** Send an alert through this channel. Returns true on success. */
  send: (alert: AgentAlert) => Promise<boolean>;
}

export interface NotificationRule {
  /** Rule name for debugging */
  name: string;
  /** Which agents this rule applies to (empty = all) */
  agentFilter: string[];
  /** Minimum severity to trigger (e.g., 'warning' skips 'info') */
  minSeverity: AlertSeverity;
  /** Which channels to send through */
  channels: NotificationChannel[];
  /** Cooldown between notifications for same agent (ms, 0 = no cooldown) */
  cooldownMs: number;
}
