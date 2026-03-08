/**
 * Grace Period Engine - Phase 6.7
 *
 * Manages grace periods for tenants with expired licenses.
 * Provides temporary access with limited quotas during grace period.
 *
 * Features:
 * - Activate grace period with configurable duration
 * - Track grace period status and expiry
 * - Auto-expire grace periods
 * - Limited quota enforcement during grace
 *
 * @example
 * ```typescript
 * await activateGracePeriod(tenantId, 14, 3); // 14 days, max 3 overrides
 * const status = await checkGracePeriodStatus(tenantId);
 * await expireGracePeriod(tenantId);
 * ```
 */

import { supabase } from '@/lib/supabase';

/**
 * Grace period status
 */
export interface GracePeriodStatus {
  tenantId: string;
  isActive: boolean;
  activatedAt: string;
  expiresAt: string;
  daysRemaining: number;
  maxOverrides: number;
  overridesUsed: number;
  limitedQuotas: {
    api_calls: number;
    tokens: number;
    compute_minutes: number;
    model_inferences: number;
    agent_executions: number;
  };
}

/**
 * Grace period configuration
 */
export interface GracePeriodConfig {
  durationDays: number;
  maxOverrides: number;
  limitedQuotas: {
    api_calls: number;
    tokens: number;
    compute_minutes: number;
    model_inferences: number;
    agent_executions: number;
  };
}

/**
 * Default grace period config (50% of basic tier limits)
 */
const DEFAULT_GRACE_PERIOD_CONFIG: GracePeriodConfig = {
  durationDays: 14,
  maxOverrides: 3,
  limitedQuotas: {
    api_calls: 5000,
    tokens: 250000,
    compute_minutes: 50,
    model_inferences: 500,
    agent_executions: 100,
  },
};

/**
 * Activate grace period for tenant
 *
 * @param tenantId - Tenant identifier
 * @param days - Grace period duration in days (default: 14)
 * @param maxOverrides - Maximum quota overrides allowed (default: 3)
 * @param customQuotas - Optional custom limited quotas
 * @returns Grace period status or null if activation failed
 */
export async function activateGracePeriod(
  tenantId: string,
  days: number = 14,
  maxOverrides: number = 3,
  customQuotas?: GracePeriodConfig['limitedQuotas']
): Promise<GracePeriodStatus | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[activateGracePeriod] No authenticated user');
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Create or update grace period record
    const { data, error } = await supabase
      .from('tenant_grace_periods')
      .upsert({
        tenant_id: tenantId,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        max_overrides: maxOverrides,
        limited_quotas: customQuotas || DEFAULT_GRACE_PERIOD_CONFIG.limitedQuotas,
        activated_by: user.id,
        status: 'active',
        updated_at: now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[activateGracePeriod] Error:', error);
      return null;
    }

    // Log audit event
    await logGracePeriodAudit(tenantId, 'activated', {
      days,
      maxOverrides,
      activatedBy: user.id,
    });

    return {
      tenantId,
      isActive: true,
      activatedAt: data.activated_at,
      expiresAt: data.expires_at,
      daysRemaining: days,
      maxOverrides,
      overridesUsed: 0,
      limitedQuotas: customQuotas || DEFAULT_GRACE_PERIOD_CONFIG.limitedQuotas,
    };
  } catch (err) {
    console.error('[activateGracePeriod] Error:', err);
    return null;
  }
}

/**
 * Check grace period status for tenant
 *
 * @param tenantId - Tenant identifier
 * @returns Current grace period status
 */
export async function checkGracePeriodStatus(
  tenantId: string
): Promise<GracePeriodStatus | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_grace_periods')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return null;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-expire if past expiry date
    if (daysRemaining < 0) {
      await expireGracePeriod(tenantId);
      return null;
    }

    // Get overrides used count
    const { count: overridesCount } = await supabase
      .from('tenant_quota_overrides')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', data.activated_at);

    return {
      tenantId: data.tenant_id,
      isActive: true,
      activatedAt: data.activated_at,
      expiresAt: data.expires_at,
      daysRemaining: Math.max(0, daysRemaining),
      maxOverrides: data.max_overrides,
      overridesUsed: overridesCount || 0,
      limitedQuotas: data.limited_quotas,
    };
  } catch (err) {
    console.error('[checkGracePeriodStatus] Error:', err);
    return null;
  }
}

/**
 * Expire grace period for tenant
 *
 * @param tenantId - Tenant identifier
 * @returns true if successful, false otherwise
 */
export async function expireGracePeriod(tenantId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[expireGracePeriod] No authenticated user');
      return false;
    }

    const now = new Date();

    // Update grace period status
    const { error } = await supabase
      .from('tenant_grace_periods')
      .update({
        status: 'expired',
        expired_at: now.toISOString(),
        expired_by: user.id,
        updated_at: now.toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (error) {
      console.error('[expireGracePeriod] Error:', error);
      return false;
    }

    // Log audit event
    await logGracePeriodAudit(tenantId, 'expired', {
      expiredBy: user.id,
    });

    return true;
  } catch (err) {
    console.error('[expireGracePeriod] Error:', err);
    return false;
  }
}

/**
 * Get limited quotas for tenant (if in grace period)
 *
 * @param tenantId - Tenant identifier
 * @returns Limited quotas if in grace period, null otherwise
 */
export async function getLimitedQuotas(
  tenantId: string
): Promise<GracePeriodConfig['limitedQuotas'] | null> {
  const status = await checkGracePeriodStatus(tenantId);
  return status?.limitedQuotas || null;
}

/**
 * Check if tenant can apply quota override
 *
 * @param tenantId - Tenant identifier
 * @returns true if override is allowed
 */
export async function canApplyOverride(tenantId: string): Promise<boolean> {
  const status = await checkGracePeriodStatus(tenantId);

  if (!status) {
    // No grace period, check if tenant has active license
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', tenantId)
      .single();

    return tenant?.status === 'active';
  }

  // In grace period, check if overrides remaining
  return status.overridesUsed < status.maxOverrides;
}

/**
 * Log grace period audit event
 */
async function logGracePeriodAudit(
  tenantId: string,
  action: 'activated' | 'expired' | 'extended',
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        action: `grace_period_${action}`,
        metadata,
        created_at: new Date().toISOString(),
      });
  } catch (err) {
    console.error('[logGracePeriodAudit] Error:', err);
    // Non-critical, don't throw
  }
}

/**
 * Extend grace period (admin only)
 *
 * @param tenantId - Tenant identifier
 * @param additionalDays - Additional days to add
 * @returns Updated grace period status or null
 */
export async function extendGracePeriod(
  tenantId: string,
  additionalDays: number
): Promise<GracePeriodStatus | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[extendGracePeriod] No authenticated user');
      return null;
    }

    // Get current grace period
    const currentStatus = await checkGracePeriodStatus(tenantId);

    if (!currentStatus) {
      console.error('[extendGracePeriod] No active grace period');
      return null;
    }

    const newExpiry = new Date(currentStatus.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);

    const now = new Date();

    // Update expiry
    const { data, error } = await supabase
      .from('tenant_grace_periods')
      .update({
        expires_at: newExpiry.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      console.error('[extendGracePeriod] Error:', error);
      return null;
    }

    // Log audit event
    await logGracePeriodAudit(tenantId, 'extended', {
      additionalDays,
      newExpiry: newExpiry.toISOString(),
      extendedBy: user.id,
    });

    const daysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      tenantId,
      isActive: true,
      activatedAt: data.activated_at,
      expiresAt: data.expires_at,
      daysRemaining: Math.max(0, daysRemaining),
      maxOverrides: data.max_overrides,
      overridesUsed: data.overrides_used || 0,
      limitedQuotas: data.limited_quotas,
    };
  } catch (err) {
    console.error('[extendGracePeriod] Error:', err);
    return null;
  }
}

/**
 * Grace Period Engine export
 */
export const gracePeriodEngine = {
  activateGracePeriod,
  checkGracePeriodStatus,
  expireGracePeriod,
  getLimitedQuotas,
  canApplyOverride,
  extendGracePeriod,
};

export default gracePeriodEngine;
