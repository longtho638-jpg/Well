/**
 * Domain Event Dispatcher — Cal.com webhook dispatcher pattern.
 *
 * Maps Cal.com's booking.created/confirmed/cancelled webhook system
 * to Well's order/commission/rank domain events.
 *
 * Supports: handler registration, async execution, error isolation.
 * Pattern source: cal-com/cal.com webhook infrastructure
 */

import { agentEventBus, type AgentEventChannel } from './agent-event-bus';

// ─── Domain Event Types ─────────────────────────────────────

export interface OrderEvent {
  orderId: string;
  userId: string;
  amount: number;
  products: Array<{ id: string; name: string; quantity: number }>;
  status: 'created' | 'completed' | 'cancelled';
}

export interface CommissionEvent {
  transactionId: string;
  distributorId: string;
  amount: number;
  type: 'direct' | 'team-bonus' | 'sponsor-bonus';
  orderId: string;
}

export interface RankUpgradeEvent {
  userId: string;
  previousRank: string;
  newRank: string;
  totalSales: number;
  teamVolume: number;
}

/** Map channel to payload type for type-safe dispatching */
export interface DomainEventMap {
  'order:created': OrderEvent;
  'order:completed': OrderEvent;
  'order:cancelled': OrderEvent;
  'commission:calculated': CommissionEvent;
  'commission:paid': CommissionEvent;
  'rank:upgraded': RankUpgradeEvent;
}

type DomainChannel = keyof DomainEventMap;

// ─── Side Effect Handlers ───────────────────────────────────

type SideEffectHandler<T> = (payload: T) => void | Promise<void>;

interface RegisteredEffect {
  channel: DomainChannel;
  name: string;
  handler: SideEffectHandler<unknown>;
}

/**
 * Domain Event Dispatcher — orchestrates side effects.
 *
 * Cal.com pattern: booking.created → [send email, fire webhook, update analytics]
 * Well pattern: order:completed → [calculate commission, send email, update leaderboard]
 */
class DomainEventDispatcher {
  private effects: Map<DomainChannel, RegisteredEffect[]> = new Map();

  /** Register a side effect handler for a domain event */
  registerEffect<C extends DomainChannel>(
    channel: C,
    name: string,
    handler: SideEffectHandler<DomainEventMap[C]>,
  ): void {
    const existing = this.effects.get(channel) ?? [];
    existing.push({ channel, name, handler: handler as SideEffectHandler<unknown> });
    this.effects.set(channel, existing);
  }

  /**
   * Dispatch a domain event — fires all registered side effects.
   * Also emits on the global agent event bus for cross-cutting concerns.
   *
   * Cal.com pattern: Write (sync) → Side effects (async, error-isolated)
   */
  async dispatch<C extends DomainChannel>(
    channel: C,
    payload: DomainEventMap[C],
    source: string,
  ): Promise<{ successes: string[]; failures: Array<{ name: string; error: string }> }> {
    const effects = this.effects.get(channel) ?? [];
    const successes: string[] = [];
    const failures: Array<{ name: string; error: string }> = [];

    // Execute all side effects — error isolation per handler
    for (const effect of effects) {
      try {
        await effect.handler(payload);
        successes.push(effect.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push({ name: effect.name, error: message });
      }
    }

    // Emit on global event bus for subscribers (agents, UI, analytics)
    await agentEventBus.emit(channel as AgentEventChannel, payload, source);

    return { successes, failures };
  }

  /** List all registered effects for a channel */
  getEffects(channel: DomainChannel): string[] {
    return (this.effects.get(channel) ?? []).map((e) => e.name);
  }

  /** Get all registered channels and their effect counts */
  getStatus(): Record<string, number> {
    const status: Record<string, number> = {};
    for (const [channel, effects] of this.effects) {
      status[channel] = effects.length;
    }
    return status;
  }

  /** Clear all effects (useful for testing) */
  clear(): void {
    this.effects.clear();
  }
}

// ─── Singleton Export ───────────────────────────────────────

export const domainEventDispatcher = new DomainEventDispatcher();
