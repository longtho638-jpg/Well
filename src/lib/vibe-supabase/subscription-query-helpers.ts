/**
 * Vibe Supabase SDK — Subscription Query Helpers
 *
 * Centralized Supabase queries for user-level subscription CRUD operations.
 * Extracted from subscription-service to separate DB access from business logic.
 * All queries take (supabase, ...) — no singleton capture.
 *
 * Usage:
 *   import { subscriptionQueries } from '@/lib/vibe-supabase';
 *   const plans = await subscriptionQueries.getPlans(supabase);
 */

import type { SupabaseLike } from './typed-query-helpers';
import type {
  SubscriptionPlan,
  UserSubscription,
  ActivePlanInfo,
} from '@/lib/vibe-subscription';

// ─── Plan Queries ────────────────────────────────────────────────

/** Fetch all active subscription plans ordered by sort_order */
export async function getPlans(
  supabase: SupabaseLike,
): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw new Error(error.message);
  return data as SubscriptionPlan[];
}

// ─── User Subscription Queries ───────────────────────────────────

/** Get active plan info for a user via Postgres RPC */
export async function getUserActivePlan(
  supabase: SupabaseLike,
  userId: string,
): Promise<ActivePlanInfo | null> {
  const { data, error } = await supabase
    .rpc('get_user_active_plan', { p_user_id: userId });

  if (error) throw new Error(error.message);
  return (data as ActivePlanInfo[])?.[0] ?? null;
}

/** Get user's current active subscription (most recent, not expired) */
export async function getUserSubscription(
  supabase: SupabaseLike,
  userId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .gt('current_period_end', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as UserSubscription | null;
}

/** Insert a new subscription record */
export async function createSubscription(
  supabase: SupabaseLike,
  row: Record<string, unknown>,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as UserSubscription;
}

/** Cancel a subscription by ID (set status + canceled_at) */
export async function cancelSubscription(
  supabase: SupabaseLike,
  subscriptionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error) throw new Error(error.message);
}

/** Create a subscription payment intent via PayOS Edge Function */
export async function createSubscriptionIntent(
  supabase: SupabaseLike,
  params: {
    planId: string;
    billingCycle: 'monthly' | 'yearly';
    returnUrl: string;
    cancelUrl: string;
    orgId?: string;
  },
): Promise<{ checkoutUrl: string; orderCode: number }> {
  const { data, error } = await supabase.functions.invoke('payos-create-subscription', {
    body: params,
  });

  if (error) throw new Error(error.message);
  const result = data as { checkoutUrl: string; orderCode: number };
  return { checkoutUrl: result.checkoutUrl, orderCode: result.orderCode };
}

// ─── Convenience Namespace ──────────────────────────────────────

/** Grouped subscription queries for clean imports */
export const subscriptionQueries = {
  getPlans,
  getUserActivePlan,
  getUserSubscription,
  createSubscription,
  cancelSubscription,
  createSubscriptionIntent,
} as const;
