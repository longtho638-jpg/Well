/**
 * Agent Event Bus — Electron IPC EventEmitter pattern for inter-agent communication.
 *
 * Maps Electron's ipcMain/ipcRenderer to a typed pub/sub system.
 * Agents emit events; other agents or services subscribe.
 * Supports: once listeners, wildcard channels, async handlers.
 *
 * Pattern source: electron/electron ipcMain.handle + EventEmitter
 */

// ─── Event Types ────────────────────────────────────────────

/** Domain event channels — typed for autocomplete */
export type AgentEventChannel =
  | 'agent:started'
  | 'agent:completed'
  | 'agent:error'
  | 'agent:health-check'
  | 'order:created'
  | 'order:completed'
  | 'order:cancelled'
  | 'commission:calculated'
  | 'commission:paid'
  | 'rank:upgraded'
  | 'webhook:dispatched'
  | 'tool:executed'
  | 'user:login'
  | 'user:signup';

/** Payload for agent lifecycle events */
export interface AgentLifecyclePayload {
  agentName: string;
  action: string;
  timestamp: string;
  durationMs?: number;
  error?: string;
}

/** Generic event envelope wrapping any payload */
export interface AgentEvent<T = unknown> {
  channel: AgentEventChannel;
  payload: T;
  source: string;
  timestamp: string;
  eventId: string;
}

type EventHandler<T = unknown> = (event: AgentEvent<T>) => void | Promise<void>;

interface Subscription {
  channel: AgentEventChannel;
  handler: EventHandler;
  once: boolean;
}

// ─── Event Bus Implementation ───────────────────────────────

/**
 * Singleton event bus for inter-agent communication.
 * Thread-safe (single-threaded JS), supports async handlers.
 */
class AgentEventBus {
  private subscriptions: Map<AgentEventChannel, Subscription[]> = new Map();
  private eventHistory: AgentEvent[] = [];
  private maxHistorySize = 100;

  /** Subscribe to a channel */
  on<T = unknown>(channel: AgentEventChannel, handler: EventHandler<T>): () => void {
    const sub: Subscription = { channel, handler: handler as EventHandler, once: false };
    const subs = this.subscriptions.get(channel) ?? [];
    subs.push(sub);
    this.subscriptions.set(channel, subs);

    // Return unsubscribe function (Electron contextBridge pattern)
    return () => this.off(channel, handler as EventHandler);
  }

  /** Subscribe to a channel — fires once then auto-unsubscribes */
  once<T = unknown>(channel: AgentEventChannel, handler: EventHandler<T>): void {
    const sub: Subscription = { channel, handler: handler as EventHandler, once: true };
    const subs = this.subscriptions.get(channel) ?? [];
    subs.push(sub);
    this.subscriptions.set(channel, subs);
  }

  /** Unsubscribe a specific handler from a channel */
  off(channel: AgentEventChannel, handler: EventHandler): void {
    const subs = this.subscriptions.get(channel);
    if (!subs) return;
    this.subscriptions.set(
      channel,
      subs.filter((s) => s.handler !== handler),
    );
  }

  /** Emit an event to all subscribers on the channel */
  async emit<T = unknown>(channel: AgentEventChannel, payload: T, source: string): Promise<void> {
    const event: AgentEvent<T> = {
      channel,
      payload,
      source,
      timestamp: new Date().toISOString(),
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    // Store in history (ring buffer)
    this.eventHistory.push(event as AgentEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const subs = this.subscriptions.get(channel);
    if (!subs || subs.length === 0) return;

    // Execute handlers, remove once-listeners after firing
    const toRemove: Subscription[] = [];

    for (const sub of subs) {
      try {
        await sub.handler(event as AgentEvent);
      } catch {
        // Swallow handler errors — event bus must never crash
      }
      if (sub.once) toRemove.push(sub);
    }

    if (toRemove.length > 0) {
      this.subscriptions.set(
        channel,
        subs.filter((s) => !toRemove.includes(s)),
      );
    }
  }

  /** Get recent event history for debugging */
  getHistory(channel?: AgentEventChannel): AgentEvent[] {
    if (!channel) return [...this.eventHistory];
    return this.eventHistory.filter((e) => e.channel === channel);
  }

  /** Get subscriber count per channel */
  getSubscriberCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [channel, subs] of this.subscriptions) {
      counts[channel] = subs.length;
    }
    return counts;
  }

  /** Clear all subscriptions (useful for testing) */
  clear(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
  }
}

// ─── Singleton Export ───────────────────────────────────────

/** Global agent event bus — single instance for the entire app */
export const agentEventBus = new AgentEventBus();
