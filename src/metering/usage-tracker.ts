/**
 * Usage Tracker Core - Phase 3
 * Track API calls, bookings, reports, email sends per org/user
 * with idempotency, quota checking, and overage calculation
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '@/utils/logger';

const logger = createLogger('UsageTracker');

export type MetricType = 'api_calls' | 'bookings' | 'reports' | 'email_sends';

export interface TrackUsageOptions {
  orgId: string;
  userId?: string;
  metricType: MetricType;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  metricType: string;
  currentUsage: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  isOverLimit: boolean;
  overageUnits: number;
}

export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  currentUsage: number;
  limitValue: number;
}

export interface OverageResult {
  metricType: string;
  overageUnits: number;
  overageAmount: number;
}

/**
 * Generate idempotency key for deduplication
 */
function generateIdempotencyKey(orgId: string, metricType: string, period: string): string {
  return `${orgId}:${metricType}:${period}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get current billing period (YYYY-MM format)
 */
function getCurrentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Track usage event with idempotency
 */
export async function trackUsage(options: TrackUsageOptions): Promise<void> {
  const { orgId, userId, metricType, quantity = 1, metadata = {} } = options;
  const period = getCurrentPeriod();
  const idempotencyKey = generateIdempotencyKey(orgId, metricType, period);

  try {
    const { error } = await supabase.from('usage_metrics').insert({
      org_id: orgId,
      user_id: userId,
      metric_type: metricType,
      quantity,
      billing_period: period,
      metadata,
      idempotency_key: idempotencyKey,
    });

    if (error) throw new Error(`Failed to track usage: ${error.message}`);
  } catch (error) {
    logger.error('trackUsage failed', { orgId, metricType, quantity, error });
    throw error;
  }
}

/**
 * Get usage summary for all metrics in a period
 */
export async function getUsageSummary(orgId: string, period?: string): Promise<UsageSummary[]> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    // Get current usage from DB
    const { data: usage, error: usageError } = await supabase
      .from('usage_metrics')
      .select('metric_type, quantity')
      .eq('org_id', orgId)
      .eq('billing_period', targetPeriod);

    if (usageError) throw new Error(`Failed to fetch usage: ${usageError.message}`);

    // Get org's plan tier (simplified - assumes org has plan)
    const { data: planData } = await supabase.rpc('check_org_quota', {
      p_org_id: orgId,
      p_metric_type: 'api_calls',
      p_period: targetPeriod,
    });

    // Aggregate usage by metric type
    const usageByType: Record<string, number> = {};
    const metrics: MetricType[] = ['api_calls', 'bookings', 'reports', 'email_sends'];

    metrics.forEach((type) => {
      const filtered = usage?.filter((u) => u.metric_type === type) || [];
      usageByType[type] = filtered.reduce((sum, u) => sum + (u.quantity || 0), 0);
    });

    // Get limits from billing config (free tier as default)
    const { data: config } = await supabase
      .from('usage_billing_config')
      .select('*')
      .eq('plan_tier', 'free')
      .single();

    const limits: Record<string, number> = {
      api_calls: config?.api_calls_limit || 1000,
      bookings: config?.bookings_limit || 10,
      reports: config?.reports_limit || 5,
      email_sends: config?.email_sends_limit || 100,
    };

    return metrics.map((metricType) => {
      const currentUsage = usageByType[metricType] || 0;
      const limit = limits[metricType] || 0;
      const remaining = Math.max(0, limit - currentUsage);
      const percentageUsed = limit > 0 ? Math.min(100, Math.round((currentUsage / limit) * 100)) : 0;
      const isOverLimit = currentUsage > limit;
      const overageUnits = isOverLimit ? currentUsage - limit : 0;

      return {
        metricType,
        currentUsage,
        limit,
        remaining,
        percentageUsed,
        isOverLimit,
        overageUnits,
      };
    });
  } catch (error) {
    logger.error('getUsageSummary failed', { orgId, period: targetPeriod, error });
    return [];
  }
}

/**
 * Check quota for a specific metric
 */
export async function checkQuota(
  orgId: string,
  metricType: string,
  period?: string
): Promise<{ allowed: boolean; remaining: number }> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    const { data, error } = await supabase.rpc('check_org_quota', {
      p_org_id: orgId,
      p_metric_type: metricType,
      p_period: targetPeriod,
    });

    if (error) throw new Error(`Quota check failed: ${error.message}`);

    const result = Array.isArray(data) ? data[0] : data;
    return {
      allowed: result?.allowed ?? true,
      remaining: result?.remaining ?? 0,
    };
  } catch (error) {
    logger.error('checkQuota failed', { orgId, metricType, error });
    return { allowed: true, remaining: Infinity };
  }
}

/**
 * Get overage units for billing calculation
 */
export async function getOverageUnits(orgId: string, period?: string): Promise<number> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    const { data, error } = await supabase.rpc('get_org_overage_units', {
      p_org_id: orgId,
      p_period: targetPeriod,
    });

    if (error) throw new Error(`Overage calculation failed: ${error.message}`);

    // Sum all overage units across metrics
    const overages = Array.isArray(data) ? data : data?.overages || [];
    return overages.reduce((sum: number, o: OverageResult) => sum + (o.overageUnits || 0), 0);
  } catch (error) {
    logger.error('getOverageUnits failed', { orgId, period: targetPeriod, error });
    return 0;
  }
}

/**
 * Batch track multiple usage events
 */
export async function trackUsageBatch(events: TrackUsageOptions[]): Promise<number> {
  const period = getCurrentPeriod();

  const rows = events.map((e) => ({
    org_id: e.orgId,
    user_id: e.userId,
    metric_type: e.metricType,
    quantity: e.quantity ?? 1,
    billing_period: period,
    metadata: e.metadata ?? {},
    idempotency_key: generateIdempotencyKey(e.orgId, e.metricType, period),
  }));

  try {
    const { count, error } = await supabase.from('usage_metrics').insert(rows, { count: 'exact' });

    if (error) throw new Error(`Batch track failed: ${error.message}`);
    return count ?? rows.length;
  } catch (error) {
    logger.error('trackUsageBatch failed', { count: rows.length, error });
    throw error;
  }
}

/**
 * Get total API calls for an org in current period
 */
export async function getApiCallCount(orgId: string, period?: string): Promise<number> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('metric_type', 'api_calls')
      .eq('billing_period', targetPeriod);

    if (error) throw new Error(`Failed to fetch API calls: ${error.message}`);

    return data?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;
  } catch (error) {
    logger.error('getApiCallCount failed', { orgId, error });
    return 0;
  }
}

/**
 * Get total bookings for an org in current period
 */
export async function getBookingCount(orgId: string, period?: string): Promise<number> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('metric_type', 'bookings')
      .eq('billing_period', targetPeriod);

    if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);

    return data?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;
  } catch (error) {
    logger.error('getBookingCount failed', { orgId, error });
    return 0;
  }
}

/**
 * Get total reports for an org in current period
 */
export async function getReportCount(orgId: string, period?: string): Promise<number> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('metric_type', 'reports')
      .eq('billing_period', targetPeriod);

    if (error) throw new Error(`Failed to fetch reports: ${error.message}`);

    return data?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;
  } catch (error) {
    logger.error('getReportCount failed', { orgId, error });
    return 0;
  }
}

/**
 * Get total email sends for an org in current period
 */
export async function getEmailSendCount(orgId: string, period?: string): Promise<number> {
  const targetPeriod = period || getCurrentPeriod();

  try {
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('metric_type', 'email_sends')
      .eq('billing_period', targetPeriod);

    if (error) throw new Error(`Failed to fetch email sends: ${error.message}`);

    return data?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;
  } catch (error) {
    logger.error('getEmailSendCount failed', { orgId, error });
    return 0;
  }
}
