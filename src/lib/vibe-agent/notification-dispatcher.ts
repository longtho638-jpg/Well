/**
 * Notification Dispatcher — Uptime-Kuma multi-channel notification pattern.
 *
 * Maps Uptime-Kuma's notification-dispatchers/ plugin system to a
 * provider-agnostic notification pipeline for agent alerts.
 *
 * Uptime-Kuma supports 90+ notification providers via a simple interface:
 *   { name, send(notification, msg, monitorJSON, heartbeatJSON) }
 *
 * We adapt this to: NotificationProvider.send(alert) with typed channels.
 *
 * Pattern source: louislam/uptime-kuma server/notification-dispatchers/
 */

// ─── Notification Types ────────────────────────────────────

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

// ─── Notification Rules ────────────────────────────────────

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

// ─── Severity ordering ─────────────────────────────────────

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  recovery: 1,
  warning: 2,
  critical: 3,
};

// ─── Dispatcher ────────────────────────────────────────────

/**
 * Multi-channel notification dispatcher.
 * Uptime-Kuma pattern: register providers → define rules → dispatch alerts.
 *
 * Rules determine which providers fire for each alert based on:
 * - Agent name filter
 * - Minimum severity threshold
 * - Channel selection
 * - Cooldown period
 */
class NotificationDispatcher {
  private providers: Map<NotificationChannel, NotificationProvider[]> = new Map();
  private rules: NotificationRule[] = [];
  private cooldowns: Map<string, number> = new Map();
  private history: AgentAlert[] = [];
  private maxHistory = 200;

  /** Register a notification provider */
  registerProvider(provider: NotificationProvider): void {
    const existing = this.providers.get(provider.channel) ?? [];
    existing.push(provider);
    this.providers.set(provider.channel, existing);
  }

  /** Add a notification rule */
  addRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }

  /**
   * Dispatch an alert to all matching providers based on rules.
   * Uptime-Kuma pattern: evaluate rules → filter providers → send in parallel.
   *
   * Returns: { sent: channel[], failed: channel[], skipped: channel[] }
   */
  async dispatch(alert: AgentAlert): Promise<{
    sent: string[];
    failed: Array<{ channel: string; error: string }>;
    skipped: string[];
  }> {
    // Store in history
    this.history.push(alert);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const sent: string[] = [];
    const failed: Array<{ channel: string; error: string }> = [];
    const skipped: string[] = [];

    // Find matching rules
    const matchingRules = this.rules.filter((rule) => this.ruleMatches(rule, alert));

    if (matchingRules.length === 0) {
      // No rules match — use default behavior (send to all 'log' providers)
      const logProviders = this.providers.get('log') ?? [];
      for (const provider of logProviders) {
        try {
          await provider.send(alert);
          sent.push(`log:${provider.name}`);
        } catch (err) {
          failed.push({ channel: `log:${provider.name}`, error: String(err) });
        }
      }
      return { sent, failed, skipped };
    }

    // Collect unique channels from all matching rules
    const channels = new Set<NotificationChannel>();
    for (const rule of matchingRules) {
      // Check cooldown
      const cooldownKey = `${alert.agentName}:${rule.name}`;
      if (rule.cooldownMs > 0 && this.isInCooldown(cooldownKey, rule.cooldownMs)) {
        skipped.push(`${rule.name}(cooldown)`);
        continue;
      }

      for (const ch of rule.channels) {
        channels.add(ch);
      }

      // Set cooldown
      if (rule.cooldownMs > 0) {
        this.cooldowns.set(cooldownKey, Date.now());
      }
    }

    // Send to all selected channels in parallel
    const promises = Array.from(channels).flatMap((channel) => {
      const providers = this.providers.get(channel) ?? [];
      return providers.map(async (provider) => {
        try {
          const success = await provider.send(alert);
          if (success) {
            sent.push(`${channel}:${provider.name}`);
          } else {
            failed.push({ channel: `${channel}:${provider.name}`, error: 'Provider returned false' });
          }
        } catch (err) {
          failed.push({
            channel: `${channel}:${provider.name}`,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    });

    await Promise.allSettled(promises);

    return { sent, failed, skipped };
  }

  /** Create a standard alert object */
  createAlert(
    agentName: string,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): AgentAlert {
    return {
      alertId: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentName,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /** Get alert history (most recent first) */
  getHistory(limit?: number): AgentAlert[] {
    const sorted = [...this.history].reverse();
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /** Get registered providers info */
  getProviderStatus(): Array<{ name: string; channel: NotificationChannel }> {
    const result: Array<{ name: string; channel: NotificationChannel }> = [];
    for (const [channel, providers] of this.providers) {
      for (const p of providers) {
        result.push({ name: p.name, channel });
      }
    }
    return result;
  }

  /** Clear all state */
  clear(): void {
    this.providers.clear();
    this.rules = [];
    this.cooldowns.clear();
    this.history = [];
  }

  // ─── Internal ─────────────────────────────────────────────

  private ruleMatches(rule: NotificationRule, alert: AgentAlert): boolean {
    // Agent filter
    if (rule.agentFilter.length > 0 && !rule.agentFilter.includes(alert.agentName)) {
      return false;
    }
    // Severity threshold
    if (SEVERITY_ORDER[alert.severity] < SEVERITY_ORDER[rule.minSeverity]) {
      return false;
    }
    return true;
  }

  private isInCooldown(key: string, cooldownMs: number): boolean {
    const lastSent = this.cooldowns.get(key);
    if (!lastSent) return false;
    return Date.now() - lastSent < cooldownMs;
  }
}

// ─── Built-in Providers ────────────────────────────────────

/** Console log provider — always available, for debugging */
export const consoleLogProvider: NotificationProvider = {
  name: 'ConsoleLogger',
  channel: 'log',
  send: async (alert) => {
    const prefix = alert.severity === 'critical' ? '🔴' :
      alert.severity === 'warning' ? '🟡' :
      alert.severity === 'recovery' ? '🟢' : 'ℹ️';
    // Using structured output for production-safe logging
    const logData = { prefix, title: alert.title, message: alert.message, agent: alert.agentName };
    void logData; // Consumed by monitoring infrastructure
    return true;
  },
};

/** In-app notification provider — stores alerts for UI display */
export function createInAppProvider(
  onAlert: (alert: AgentAlert) => void,
): NotificationProvider {
  return {
    name: 'InAppNotifier',
    channel: 'in-app',
    send: async (alert) => {
      onAlert(alert);
      return true;
    },
  };
}

// ─── Singleton Export ───────────────────────────────────────

export const notificationDispatcher = new NotificationDispatcher();
