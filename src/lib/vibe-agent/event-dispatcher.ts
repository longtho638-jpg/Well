import { z } from 'zod';
import { agentEventBus } from './agent-event-bus';

/**
 * Event Dispatcher — Cal.com-inspired Webhook & Event System.
 *
 * This system provides strongly-typed event definitions using Zod schemas,
 * allowing for both internal event bus propagation and external webhook delivery.
 *
 * Pattern source: cal-com/cal.com event-manager / webhook system
 */

// ─── Event Schema Definitions ────────────────────────────────

export const OrderCreatedSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string().default('VND'),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  timestamp: z.string().datetime(),
});

export const UserRegisteredSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  source: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const InventoryUpdatedSchema = z.object({
  productId: z.string(),
  oldStock: z.number(),
  newStock: z.number(),
  reason: z.string(),
  timestamp: z.string().datetime(),
});

/** Registry of available events and their schemas */
export const EventSchemas = {
  'order.created': OrderCreatedSchema,
  'user.registered': UserRegisteredSchema,
  'inventory.updated': InventoryUpdatedSchema,
} as const;

export type EventType = keyof typeof EventSchemas;
export type EventPayload<T extends EventType> = z.infer<typeof EventSchemas[T]>;

// ─── Webhook Types ──────────────────────────────────────────

export interface WebhookSubscription {
  id: string;
  url: string;
  events: EventType[];
  secret?: string; // For HMAC signatures
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  webhookId: string;
  status: number;
  success: boolean;
  timestamp: string;
  durationMs: number;
  error?: string;
}

// ─── Event Dispatcher Implementation ─────────────────────────

class EventDispatcher {
  private subscriptions: WebhookSubscription[] = [];

  /** Subscribe to events with a webhook URL */
  subscribe(subscription: WebhookSubscription): void {
    this.subscriptions.push(subscription);
  }

  /** Unsubscribe from events */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions = this.subscriptions.filter(s => s.id !== subscriptionId);
  }

  /**
   * Emit an event.
   * 1. Validates the payload using Zod.
   * 2. Emits to the internal agentEventBus.
   * 3. Triggers external webhooks for active subscriptions.
   */
  async emit<T extends EventType>(
    type: T,
    payload: EventPayload<T>,
    source: string = 'system'
  ): Promise<{
    internal: boolean;
    webhooks: WebhookDeliveryResult[];
  }> {
    // 1. Validate payload
    const schema = EventSchemas[type];
    const validatedPayload = schema.parse(payload);

    // 2. Internal dispatch (Agent Event Bus)
    // Map to agent-event-bus channels if they match, or use a generic channel
    await agentEventBus.emit(type as Parameters<typeof agentEventBus.emit>[0], validatedPayload, source);

    // 3. External dispatch (Webhooks)
    const activeWebhooks = this.subscriptions.filter(
      s => s.active && s.events.includes(type)
    );

    const deliveryPromises = activeWebhooks.map(webhook => this.deliverWebhook(webhook, type, validatedPayload));
    const webhookResults = await Promise.all(deliveryPromises);

    return {
      internal: true,
      webhooks: webhookResults,
    };
  }

  /** Private helper for webhook delivery */
  private async deliverWebhook(
    webhook: WebhookSubscription,
    type: EventType,
    payload: unknown
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WellNexus-Event': type,
          'X-WellNexus-Signature': webhook.secret ? 'mock-hmac-signature' : '', // Placeholder
        },
        body: JSON.stringify({
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          event: type,
          createdAt: new Date().toISOString(),
          data: payload,
        }),
      });

      return {
        webhookId: webhook.id,
        status: response.status,
        success: response.ok,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        webhookId: webhook.id,
        status: 0,
        success: false,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Get all active subscriptions */
  getSubscriptions(): WebhookSubscription[] {
    return this.subscriptions.filter(s => s.active);
  }
}

// ─── Singleton Export ───────────────────────────────────────

export const eventDispatcher = new EventDispatcher();
