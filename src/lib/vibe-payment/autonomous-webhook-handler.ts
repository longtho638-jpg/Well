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

// ─── Rate Limiting ──────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // per orderCode
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const cached = rateLimitCache.get(key);

  if (!cached || now > cached.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (cached.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }

  cached.count++;
  return true;
}

// ─── Input Validation ───────────────────────────────────────────

function validateWebhookPayload(payload: unknown): payload is { data: Record<string, unknown>; signature: string } {
  if (!payload || typeof payload !== 'object') return false;

  const data = (payload as Record<string, unknown>).data;
  const signature = (payload as Record<string, unknown>).signature;

  if (!data || typeof data !== 'object') return false;
  if (!signature || typeof signature !== 'string') return false;

  // Validate required fields
  const orderCode = (data as Record<string, unknown>).orderCode;
  const amount = (data as Record<string, unknown>).amount;
  const code = (data as Record<string, unknown>).code;

  if (typeof orderCode !== 'number' || orderCode <= 0) return false;
  if (typeof amount !== 'number' || amount <= 0) return false;
  if (typeof code !== 'string' || !/^\d{2}$/.test(code)) return false;

  return true;
}

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

// ─── Retry with Backoff ─────────────────────────────────────────

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; backoffMs: number; name: string; deps: WebhookHandlerDeps; userId: string | null },
): Promise<T | null> {
  const { maxRetries, backoffMs, name, deps, userId } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      await deps.logAudit(userId, 'CALLBACK_RETRY', {
        callback: name,
        attempt,
        maxRetries,
        error: String(err),
        isLastAttempt,
      }, isLastAttempt ? 'failure' : 'warning');

      if (!isLastAttempt) {
        await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  return null;
}

// ─── Main Handler ───────────────────────────────────────────────

export async function processWebhookEvent(
  provider: VibePaymentProvider,
  rawPayload: unknown,
  signature: string,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  // Step 0: Rate limiting
  const orderCode = ((rawPayload as Record<string, Record<string, unknown>>)?.data?.orderCode) as number | undefined;
  const rateLimitKey = orderCode ? `webhook:${orderCode}` : 'webhook:unknown';

  if (!checkRateLimit(rateLimitKey)) {
    await deps.logAudit(null, 'WEBHOOK_RATE_LIMITED', { key: rateLimitKey }, 'failure');
    return { status: 'error', message: 'Rate limit exceeded' };
  }

  // Step 1: Input validation
  if (!validateWebhookPayload({ data: rawPayload, signature })) {
    await deps.logAudit(null, 'WEBHOOK_VALIDATION_FAILED', { provider: provider.name }, 'failure');
    return { status: 'error', message: 'Invalid webhook payload' };
  }

  // Step 2: Parse and verify signature
  const event = await provider.parseWebhookEvent(rawPayload, signature, config.checksumKey);

  if (!event) {
    await deps.logAudit(null, 'WEBHOOK_SIGNATURE_FAILED', { provider: provider.name }, 'failure');
    return { status: 'error', message: 'Invalid signature' };
  }

  // Step 3: Try order first, then subscription intent
  const order = await deps.findOrder(event.orderCode);

  if (order) {
    return processOrderWebhook(event, order, config, deps);
  }

  const intent = await deps.findSubscriptionIntent(event.orderCode);

  if (intent) {
    return processSubscriptionWebhook(event, intent, config, deps);
  }

  await deps.logAudit(null, 'WEBHOOK_ORDER_NOT_FOUND', { orderCode: event.orderCode }, 'failure');
  return { status: 'error', message: 'Webhook processing failed' };
}

// ─── Order Processing ───────────────────────────────────────────

async function processOrderWebhook(
  event: VibeWebhookEvent,
  order: OrderRecord,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  const newStatus = eventTypeToStatus(event.type);

  if (!isValidTransition(order.status, newStatus)) {
    await deps.logAudit(order.userId, 'WEBHOOK_IGNORED', {
      orderId: order.id,
      currentStatus: order.status,
      attemptedStatus: newStatus,
      reason: 'Invalid state transition',
    }, 'info');

    return { status: 'ignored', orderCode: event.orderCode, reason: `Order already ${order.status}` };
  }

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

  // Fire side-effect callbacks with retry
  if (newStatus === 'PAID' && config.onOrderPaid) {
    await retryWithBackoff(
      () => config.onOrderPaid(event, order.id),
      { maxRetries: 3, backoffMs: 1000, name: 'onOrderPaid', deps, userId: order.userId }
    );
  }

  if (newStatus === 'CANCELLED' && config.onOrderCancelled) {
    await retryWithBackoff(
      () => config.onOrderCancelled(event, order.id),
      { maxRetries: 3, backoffMs: 1000, name: 'onOrderCancelled', deps, userId: order.userId }
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
export { isValidTransition, VALID_TRANSITIONS, checkRateLimit, validateWebhookPayload, retryWithBackoff };
