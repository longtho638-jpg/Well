/**
 * Autonomous webhook handler — DI types, record shapes, and subscription processing helper.
 * Extracted to keep autonomous-webhook-handler.ts under 200 LOC.
 */

import type { VibeWebhookEvent, VibeWebhookConfig, WebhookProcessingResult, VibePaymentStatusCode } from './types';

export interface OrderRecord {
  id: string;
  status: string;
  userId: string | null;
  orderCode: number;
}

export interface SubscriptionIntentRecord {
  id: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  status: string;
  orgId?: string | null;
}

export interface WebhookHandlerDeps {
  /** Find order by orderCode */
  findOrder: (orderCode: number) => Promise<OrderRecord | null>;
  /** Find subscription intent by orderCode */
  findSubscriptionIntent: (orderCode: number) => Promise<SubscriptionIntentRecord | null>;
  /** Atomically update order status (only if current status matches) */
  updateOrderStatus: (
    orderId: string,
    fromStatus: string,
    toStatus: string,
    paymentData: Record<string, unknown>
  ) => Promise<boolean>;
  /** Update subscription intent status */
  updateSubscriptionIntent: (intentId: string, status: string) => Promise<void>;
  /** Activate a subscription after payment */
  activateSubscription: (intent: SubscriptionIntentRecord) => Promise<void>;
  /** Log to audit table */
  logAudit: (
    userId: string | null,
    action: string,
    payload: Record<string, unknown>,
    severity: string
  ) => Promise<void>;
}

/**
 * Process subscription intent webhook — extracted to keep autonomous-webhook-handler.ts under 200 LOC.
 */
export async function processSubscriptionWebhook(
  event: VibeWebhookEvent,
  intent: SubscriptionIntentRecord,
  config: VibeWebhookConfig,
  deps: WebhookHandlerDeps,
): Promise<WebhookProcessingResult> {
  if (intent.status !== 'pending') {
    return { status: 'ignored', orderCode: event.orderCode, reason: 'Subscription already processed' };
  }

  const isPaid = event.type === 'payment.paid';
  const isCancelled = event.type === 'payment.cancelled';
  const newIntentStatus = isPaid ? 'paid' : isCancelled ? 'canceled' : 'pending';
  const newStatus: VibePaymentStatusCode = isPaid ? 'PAID' : isCancelled ? 'CANCELLED' : 'PENDING';

  await deps.updateSubscriptionIntent(intent.id, newIntentStatus);

  if (isPaid) {
    await deps.activateSubscription(intent);
    if (config.onSubscriptionPaid) {
      config.onSubscriptionPaid(event, {
        id: intent.id,
        userId: intent.userId,
        planId: intent.planId,
        billingCycle: intent.billingCycle,
        amount: event.amount,
        status: 'paid',
      }).catch((err) =>
        deps.logAudit(intent.userId, 'CALLBACK_FAILED', { callback: 'onSubscriptionPaid', error: String(err) }, 'failure'),
      );
    }
  }

  if (isCancelled && config.onSubscriptionCancelled) {
    config.onSubscriptionCancelled(event, {
      id: intent.id,
      userId: intent.userId,
      planId: intent.planId,
      billingCycle: intent.billingCycle,
      amount: event.amount,
      status: 'canceled',
    }).catch((err) =>
      deps.logAudit(intent.userId, 'CALLBACK_FAILED', { callback: 'onSubscriptionCancelled', error: String(err) }, 'failure'),
    );
  }

  return { status: 'processed', orderCode: event.orderCode, newStatus };
}
