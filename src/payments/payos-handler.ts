/**
 * PayOS Payment Handler Service
 *
 * Vietnamese QR payment integration for WellNexus subscription management.
 * Handles payment creation, success callbacks, and cancellation flows.
 *
 * Usage:
 *   import { createSubscriptionPayment, handlePaymentSuccess, handlePaymentCancel } from '@/payments/payos-handler';
 *
 *   const { checkoutUrl } = await createSubscriptionPayment({ userId, planId, billingCycle });
 *   await handlePaymentSuccess(orderCode, webhookData);
 */

import { PayOSAdapter } from '@/lib/vibe-payment';
import { supabase } from '@/lib/supabase';
import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';
import { subscriptionService } from '@/services/subscription-service';
import {
  markProcessed,
  isAlreadyProcessed,
  verifyWebhookSignature,
  storePaymentIntent,
  getPaymentIntent,
} from './payos-helpers';

// ─── Pricing Configuration (VND) ─────────────────────────────────────────────

const PRICING = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 299000, yearly: 2990000 },
  enterprise: { monthly: 999000, yearly: 9990000 },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePaymentRequest {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  orgId?: string;
}

export interface PaymentResult {
  checkoutUrl: string;
  orderCode: number;
  qrCode?: string;
  paymentUrl: string;
}

// ─── PayOS Handler Service ────────────────────────────────────────────────────

const payosProvider = new PayOSAdapter(supabase as unknown as SupabaseLike);

/**
 * Create subscription payment via PayOS
 * Generates checkout URL and QR code for Vietnamese QR payment
 */
export async function createSubscriptionPayment(
  request: CreatePaymentRequest,
): Promise<PaymentResult> {
  const { userId, planId, billingCycle, orgId } = request;

  // Calculate amount from pricing config
  const planKey = planId.toLowerCase() as keyof typeof PRICING;
  const pricing = PRICING[planKey];

  if (!pricing) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const amount = billingCycle === 'yearly' ? pricing.yearly : pricing.monthly;

  if (amount === 0) {
    throw new Error('Free plans do not require payment');
  }

  const orderCode = Date.now() % 10000000000;
  const description = `WellNexus ${planKey} ${billingCycle} subscription`;
  const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/dashboard/subscription?status=success`;
  const cancelUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/dashboard/subscription?status=canceled`;

  // Create payment via PayOS adapter
  const result = await payosProvider.createPayment({
    orderCode,
    amount,
    description,
    items: [{ name: description, quantity: 1, price: amount }],
    returnUrl,
    cancelUrl,
    metadata: { userId, planId, billingCycle, orgId },
  });

  // Store intent in database for webhook processing
  await storePaymentIntent({
    orderCode: result.orderCode,
    userId,
    planId,
    billingCycle,
    amount,
    orgId,
  });

  return {
    checkoutUrl: result.checkoutUrl,
    orderCode: result.orderCode,
    qrCode: result.qrCode,
    paymentUrl: result.checkoutUrl,
  };
}

/**
 * Handle payment success webhook from PayOS
 * Creates subscription record after signature verification
 *
 * Flow:
 * 1. Check idempotency (in-memory + database)
 * 2. Verify webhook signature
 * 3. Fetch payment intent
 * 4. Create subscription
 * 5. Update payment intent status to 'completed'
 * 6. Log to agent_logs for audit trail
 */
export async function handlePaymentSuccess(
  orderCode: number,
  webhookData: any,
): Promise<void> {
  // Step 1: Idempotency check - in-memory guard
  if (await isAlreadyProcessed(orderCode)) {
    return;
  }

  // Step 1b: Idempotency check - database (check if intent already completed)
  const existingIntent = await getPaymentIntent(orderCode);
  if (existingIntent?.status === 'completed') {
    await markProcessed(orderCode);
    return;
  }

  // Step 2: Verify webhook signature
  const signature = webhookData.signature as string;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';

  const signatureValid = await verifyWebhookSignature(webhookData.data, signature, checksumKey);
  if (!signatureValid) {
    throw new Error(`Invalid webhook signature for order ${orderCode}`);
  }

  // Step 3: Fetch payment intent
  const intent = existingIntent ?? await getPaymentIntent(orderCode);
  if (!intent) {
    throw new Error(`Payment intent not found for order ${orderCode}`);
  }

  // Step 4: Create subscription (with rollback on failure)
  let subscriptionId: string | null = null;
  try {
    const subscription = await subscriptionService.createSubscription({
      userId: intent.user_id,
      planId: intent.plan_id,
      billingCycle: intent.billing_cycle as 'monthly' | 'yearly',
      payosOrderCode: orderCode,
      orgId: intent.metadata?.orgId as string | undefined,
    });
    subscriptionId = subscription.id;
  } catch (error) {
    // Rollback: Log the failure for manual review
    await logPaymentEvent({
      orderCode,
      userId: intent.user_id,
      eventType: 'subscription_creation_failed',
      payload: { error: error instanceof Error ? error.message : String(error), intent },
    });
    throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Step 5: Update payment intent status to 'completed'
  try {
    await updatePaymentIntentStatus(orderCode, 'completed');
  } catch (error) {
    // Critical: Subscription created but intent not updated
    // Log for manual reconciliation
    await logPaymentEvent({
      orderCode,
      userId: intent.user_id,
      eventType: 'intent_status_update_failed',
      payload: { error: error instanceof Error ? error.message : String(error), subscriptionId },
    });
    // Don't throw - subscription was created successfully
  }

  // Step 6: Mark as processed and log success
  await markProcessed(orderCode);
  await logPaymentEvent({
    orderCode,
    userId: intent.user_id,
    eventType: 'payment_success',
    payload: { subscriptionId, intent },
  });
}

/**
 * Handle payment cancellation from PayOS
 *
 * Flow:
 * 1. Check idempotency
 * 2. Log cancellation (do NOT downgrade - user might have clicked cancel by accident)
 * 3. Update payment intent status to 'canceled'
 * 4. Log to agent_logs for audit trail
 * 5. Optionally send notification email
 */
export async function handlePaymentCancel(
  orderCode: number,
  reason?: string,
): Promise<void> {
  // Step 1: Idempotency check
  if (await isAlreadyProcessed(orderCode)) {
    return;
  }

  // Step 2: Fetch payment intent
  const intent = await getPaymentIntent(orderCode);
  if (!intent) {
    return;
  }

  // Step 3: Attempt to cancel payment via PayOS (best effort)
  try {
    await payosProvider.cancelPayment(orderCode, reason);
  } catch {
    // Don't throw - still want to update local state
  }

  // Step 4: Update payment intent status to 'canceled'
  try {
    await updatePaymentIntentStatus(orderCode, 'canceled');
  } catch {
    // Don't throw - still want to continue with cancellation flow
  }

  // Step 5: Mark as processed and log cancellation
  await markProcessed(orderCode);
  await logPaymentEvent({
    orderCode,
    userId: intent.user_id,
    eventType: 'payment_canceled',
    payload: { reason: reason || 'User canceled', intent },
  });

  // Step 6: Optional - Send notification email (TODO: implement when email service available)
  // await sendCancellationEmail(intent.user_id, orderCode, reason);
}
