/**
 * Vibe Supabase SDK — Org-Scoped Usage Tracking Query Helpers
 *
 * Centralized Supabase queries for metering feature usage per org.
 * Tracks API calls, feature activations, and resource consumption
 * so billing/quota enforcement can stay in pure logic (vibe-subscription).
 *
 * Usage:
 *   import { trackFeatureUsage, getOrgUsageSummary } from '@/lib/vibe-supabase';
 *   await trackFeatureUsage(supabase, { orgId, userId, feature: 'ai_copilot', quantity: 1 });
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UsageRecord, UsageSummary, UsageQuota } from '@/lib/vibe-subscription';

// ─── Write Operations ──────────────────────────────────────────

/** Record a single usage event for an org feature */
export async function trackFeatureUsage(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    userId: string;
    feature: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<UsageRecord> {
  const { data, error } = await supabase
    .from('usage_records')
    .insert({
      org_id: params.orgId,
      user_id: params.userId,
      feature: params.feature,
      quantity: params.quantity ?? 1,
      metadata: params.metadata ?? {},
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as UsageRecord;
}

/** Batch insert multiple usage events (efficient for bulk metering) */
export async function trackFeatureUsageBatch(
  supabase: SupabaseClient,
  records: Array<{
    orgId: string;
    userId: string;
    feature: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
  }>,
): Promise<number> {
  const rows = records.map((r) => ({
    org_id: r.orgId,
    user_id: r.userId,
    feature: r.feature,
    quantity: r.quantity ?? 1,
    metadata: r.metadata ?? {},
    recorded_at: new Date().toISOString(),
  }));

  const { error, count } = await supabase
    .from('usage_records')
    .insert(rows, { count: 'exact' });

  if (error) throw error;
  return count ?? rows.length;
}

// ─── Read Operations ───────────────────────────────────────────

/** Get aggregated usage summary for an org within a billing period */
export async function getOrgUsageSummary(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string,
): Promise<UsageSummary[]> {
  const { data, error } = await supabase
    .rpc('get_org_usage_summary', {
      p_org_id: orgId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

  if (error) throw error;
  return (data ?? []) as UsageSummary[];
}

/** Get usage for a specific feature within an org */
export async function getOrgUsageByFeature(
  supabase: SupabaseClient,
  orgId: string,
  feature: string,
  periodStart: string,
  periodEnd: string,
): Promise<UsageSummary | null> {
  const summaries = await getOrgUsageSummary(supabase, orgId, periodStart, periodEnd);
  return summaries.find((s) => s.feature === feature) ?? null;
}

/** Get raw usage timeline for an org (paginated, newest first) */
export async function getUsageTimeline(
  supabase: SupabaseClient,
  orgId: string,
  options?: {
    feature?: string;
    limit?: number;
    offset?: number;
  },
): Promise<UsageRecord[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('usage_records')
    .select('*')
    .eq('org_id', orgId)
    .order('recorded_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.feature) {
    query = query.eq('feature', options.feature);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UsageRecord[];
}

/** Check quota: compare current usage against plan limits */
export async function checkOrgQuota(
  supabase: SupabaseClient,
  orgId: string,
  feature: string,
  planLimit: number,
  periodStart: string,
  periodEnd: string,
): Promise<UsageQuota> {
  const summary = await getOrgUsageByFeature(
    supabase, orgId, feature, periodStart, periodEnd,
  );

  const used = summary?.total_quantity ?? 0;
  const remaining = Math.max(0, planLimit - used);
  const percentage = planLimit > 0 ? Math.round((used / planLimit) * 100) : 0;

  return { feature, limit: planLimit, used, remaining, percentage };
}

// ─── Convenience Namespace ──────────────────────────────────────

/** Grouped usage tracking queries for clean imports */
export const usageQueries = {
  trackFeatureUsage,
  trackFeatureUsageBatch,
  getOrgUsageSummary,
  getOrgUsageByFeature,
  getUsageTimeline,
  checkOrgQuota,
} as const;
