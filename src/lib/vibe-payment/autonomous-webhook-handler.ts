/**
 * Autonomous Billing Webhook Handler
 *
 * Provider-agnostic webhook processing pipeline extracted from PayOS integration.
 * Handles: signature verification, idempotency, state machine, event routing.
 *
 * Designed for Supabase Edge Functions but decoupled from any specific provider.
 * The handler autonomously processes payment events without manual intervention.
 */

import type {
  VibePaymentProvider,
  VibePaymentStatusCode,
  VibeWebhookConfig,
  VibeWebhookEvent,
  WebhookProcessingResult,
} from './types';
import type {
  OrderRecord,
  SubscriptionIntentRecord,
  WebhookHandlerDeps,
} from './webhook-handler-dependency-injection-types';
import { processSubscriptionWebhook } from './webhook-handler-dependency-injection-types';

// ─── State Machine ──────────────────────────────────────────────

/** Valid status transitions — prevents invalid state changes */
const VALID_TRANSITIONS: Record<string, VibePaymentStatusCode[]> = {
  pending: ['PAID', 'CANCELLED'],
  paid: [], // terminal state
  cancelled: [], // terminal state
  failed: ['PENDING'], // retry allowed
};

function isValidTransition(current: string, next: VibePaymentStatusCode): boolean {
  const allowed = VALID_TRANSITIONS[current.toLowerCase()];
  if (!allowed) return false;
  return allowed.includes(next);
}

// ─── Main Handler ───────────────────────────────────────────────

/**
 * Process a webhook event autonomously.
 *
 * Pipeline:
 * 1. Verify webhook secret (caller responsibility — done before calling this)
 * 2. Parse & verify signature via provider adapter
 * 3. Route to order or subscription handler
 * 4. Apply state machine + idempotency guard
 * 5. Execute side effects (via config callbacks)
 * 6. Return processing result
 */
export async function processWebhookEvent(
  provider: VibePaymentProvider,
  rawPayload: unknown,
  signature: string,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  // Step 1: Parse and verify signature
  const event = await provider.parseWebhookEvent(rawPayload, signature, config.checksumKey);

  if (!event) {
    await deps.logAudit(null, 'WEBHOOK_SIGNATURE_FAILED', { provider: provider.name }, 'failure');
    return { status: 'error', message: 'Invalid signature' };
  }

  // Step 2: Try order first, then subscription intent
  const order = await deps.findOrder(event.orderCode);

  if (order) {
    return processOrderWebhook(event, order, config, deps);
  }

  const intent = await deps.findSubscriptionIntent(event.orderCode);

  if (intent) {
    return processSubscriptionWebhook(event, intent, config, deps);
  }

  await deps.logAudit(null, 'WEBHOOK_ORDER_NOT_FOUND', { orderCode: event.orderCode }, 'failure');
  return { status: 'error', message: `Order ${event.orderCode} not found` };
}

// ─── Order Processing ───────────────────────────────────────────

async function processOrderWebhook(
  event: VibeWebhookEvent,
  order: OrderRecord,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  const newStatus = eventTypeToStatus(event.type);

  // Idempotency: already in terminal state
  if (!isValidTransition(order.status, newStatus)) {
    await deps.logAudit(order.userId, 'WEBHOOK_IGNORED', {
      orderId: order.id,
      currentStatus: order.status,
      attemptedStatus: newStatus,
      reason: 'Invalid state transition',
    }, 'info');

    return { status: 'ignored', orderCode: event.orderCode, reason: `Order already ${order.status}` };
  }

  // Atomic update with optimistic concurrency guard
  const updated = await deps.updateOrderStatus(
    order.id,
    order.status,
    newStatus.toLowerCase(),
    event.raw,
  );

  if (!updated) {
    return { status: 'ignored', orderCode: event.orderCode, reason: 'Concurrent webhook already processed' };
  }

  await deps.logAudit(order.userId, 'WEBHOOK_SUCCESS', {
    orderId: order.id,
    oldStatus: order.status,
    newStatus,
    amount: event.amount,
  }, 'success');

  // Fire side-effect callbacks (non-blocking)
  if (newStatus === 'PAID' && config.onOrderPaid) {
    config.onOrderPaid(event, order.id).catch((err) =>
      deps.logAudit(order.userId, 'CALLBACK_FAILED', { callback: 'onOrderPaid', error: String(err) }, 'failure'),
    );
  }

  if (newStatus === 'CANCELLED' && config.onOrderCancelled) {
    config.onOrderCancelled(event, order.id).catch((err) =>
      deps.logAudit(order.userId, 'CALLBACK_FAILED', { callback: 'onOrderCancelled', error: String(err) }, 'failure'),
    );
  }

  return { status: 'processed', orderCode: event.orderCode, newStatus };
}

// ─── Helpers ────────────────────────────────────────────────────

function eventTypeToStatus(type: string): VibePaymentStatusCode {
  switch (type) {
    case 'payment.paid': return 'PAID';
    case 'payment.cancelled': return 'CANCELLED';
    default: return 'PENDING';
  }
}

// ─── Exports ────────────────────────────────────────────────────

export type { WebhookHandlerDeps, OrderRecord, SubscriptionIntentRecord };
export { isValidTransition, VALID_TRANSITIONS };

