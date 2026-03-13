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
 */
export async function handlePaymentSuccess(
  orderCode: number,
  webhookData: any,
): Promise<void> {
  if (await isAlreadyProcessed(orderCode)) {
    console.log(`[PayOS] Order ${orderCode} already processed, skipping`);
    return;
  }

  const signature = webhookData.signature as string;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';

  if (!(await verifyWebhookSignature(webhookData.data, signature, checksumKey))) {
    throw new Error('Invalid webhook signature');
  }

  const intent = await getPaymentIntent(orderCode);
  if (!intent) {
    throw new Error(`Payment intent not found for order ${orderCode}`);
  }

  await subscriptionService.createSubscription({
    userId: intent.user_id,
    planId: intent.plan_id,
    billingCycle: intent.billing_cycle as 'monthly' | 'yearly',
    payosOrderCode: orderCode,
    orgId: intent.metadata?.orgId as string | undefined,
  });

  await markProcessed(orderCode);
  console.log(`[PayOS] Successfully processed payment for order ${orderCode}`);
}

/**
 * Handle payment cancellation from PayOS
 */
export async function handlePaymentCancel(
  orderCode: number,
  reason?: string,
): Promise<void> {
  if (await isAlreadyProcessed(orderCode)) {
    console.log(`[PayOS] Order ${orderCode} already processed, skipping`);
    return;
  }

  const intent = await getPaymentIntent(orderCode);
  if (!intent) {
    console.log(`[PayOS] No intent found for canceled order ${orderCode}`);
    return;
  }

  try {
    await payosProvider.cancelPayment(orderCode, reason);
  } catch (error) {
    console.error(`[PayOS] Failed to cancel payment ${orderCode}:`, error);
  }

  await markProcessed(orderCode);
  console.log(`[PayOS] Successfully canceled order ${orderCode}: ${reason || 'User canceled'}`);
}
