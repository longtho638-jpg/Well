/**
 * PayOS Handler - Internal Helpers
 *
 * Internal utility functions for PayOS payment processing.
 * Not exported for public use - imported by payos-handler.ts only.
 */

import { supabase } from '@/lib/supabase';
import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';
import { computeHmacSha256, secureCompare } from '@/lib/vibe-payment';

// ─── Idempotency Guard ────────────────────────────────────────────────────────

const processedOrders = new Set<number>();

export async function markProcessed(orderCode: number): Promise<void> {
  processedOrders.add(orderCode);
}

export async function isAlreadyProcessed(orderCode: number): Promise<boolean> {
  return processedOrders.has(orderCode);
}

// ─── HMAC Signature Verification ──────────────────────────────────────────────

export async function verifyWebhookSignature(
  payload: unknown,
  signature: string,
  checksumKey: string,
): Promise<boolean> {
  const data = payload as Record<string, unknown>;
  const sortedKeys = Object.keys(data).sort();
  const signatureData = sortedKeys
    .map((key) => `${key}=${data[key]}`)
    .join('&');
  const computed = await computeHmacSha256(checksumKey, signatureData);
  return secureCompare(signature, computed);
}

// ─── Payment Intent Storage ───────────────────────────────────────────────────

export interface StoredIntent {
  id: string;
  order_code: number;
  user_id: string;
  plan_id: string;
  billing_cycle: string;
  amount: number;
  status: string;
  metadata: Record<string, unknown> | null;
}

export async function storePaymentIntent(params: {
  orderCode: number;
  userId: string;
  planId: string;
  billingCycle: string;
  amount: number;
  orgId?: string;
}): Promise<void> {
  const { data, error } = await (supabase as unknown as SupabaseLike)
    .from('payment_intents')
    .insert({
      order_code: params.orderCode,
      user_id: params.userId,
      plan_id: params.planId,
      billing_cycle: params.billingCycle,
      amount: params.amount,
      status: 'pending',
      metadata: params.orgId ? { orgId: params.orgId } : {},
    });

  if (error) {
    console.error('[PayOS] Failed to store payment intent:', error);
  }
}

export async function getPaymentIntent(orderCode: number): Promise<StoredIntent | null> {
  const { data, error } = await (supabase as unknown as SupabaseLike)
    .from('payment_intents')
    .select('*')
    .eq('order_code', orderCode)
    .single();

  if (error || !data) {
    return null;
  }

  return data as StoredIntent;
}
