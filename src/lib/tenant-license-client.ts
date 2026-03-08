/**
 * Tenant License Client - Phase 6.5
 *
 * Client library for multi-tenant license enforcement.
 * Provides methods to:
 * - Get tenant license status
 * - Apply quota overrides
 * - Get usage summaries
 * - Sync feature flags
 *
 * Integrates with RaaS Gateway for license validation.
 *
 * @example
 * ```typescript
 * const status = await tenantLicenseClient.getTenantLicenseStatus(tenantId);
 * await tenantLicenseClient.applyQuotaOverride({ tenantId, metricType, newLimit });
 * ```
 */

import { supabase } from '@/lib/supabase'
import type { LicenseTier } from '@/lib/rbac-engine'

/**
 * Tenant license status
 */
export interface TenantLicenseStatus {
  tenantId: string
  licenseId: string
  status: 'active' | 'suspended' | 'expired' | 'revoked'
  tier: LicenseTier
  customerId: string
  validFrom: string
  validUntil?: string
  features: string[]
  quotaOverrides?: QuotaOverride[]
  lastCheckedAt?: string
}

/**
 * Quota override configuration
 */
export interface QuotaOverride {
  id: string
  tenantId: string
  metricType: string
  quotaLimit: number
  validFrom: string
  validUntil?: string
  appliedBy: string
}

/**
 * Usage summary for tenant
 */
export interface TenantUsageSummary {
  tenantId: string
  periodStart: string
  periodEnd: string
  metrics: {
    api_calls: { used: number; limit: number; percentage: number }
    tokens: { used: number; limit: number; percentage: number }
    compute_minutes: { used: number; limit: number; percentage: number }
    model_inferences: { used: number; limit: number; percentage: number }
    agent_executions: { used: number; limit: number; percentage: number }
  }
  overages: {
    metricType: string
    used: number
    limit: number
    overageAmount: number
    overageCost?: number
  }[]
}

/**
 * Feature flags for tenant
 */
export interface TenantFeatureFlags {
  tenantId: string
  flags: Record<string, boolean>
  lastSyncedAt: string
}

/**
 * Apply quota override parameters
 */
export interface ApplyQuotaOverrideParams {
  tenantId: string
  metricType: string
  newLimit: number
  validUntil?: string
  reason?: string
}

/**
 * Get tenant license status
 */
export async function getTenantLicenseStatus(
  tenantId: string
): Promise<TenantLicenseStatus | null> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        status,
        customer_id,
        policy_id,
        raas_licenses (
          id,
          status,
          tier,
          valid_from,
          valid_until,
          features
        )
      `)
      .eq('id', tenantId)
      .single()

    if (error || !data) {
      console.error('[getTenantLicenseStatus] Error:', error)
      return null
    }

    const license = data.raas_licenses?.[0]

    if (!license) {
      return {
        tenantId: data.id,
        licenseId: '',
        status: 'expired',
        tier: 'basic',
        customerId: data.customer_id,
        validFrom: new Date().toISOString(),
        features: [],
        lastCheckedAt: new Date().toISOString(),
      }
    }

    // Get quota overrides
    const { data: overridesData } = await supabase
      .from('tenant_quota_overrides')
      .select('id, tenant_id, metric_type, quota_limit, valid_from, valid_until, applied_by')
      .eq('tenant_id', tenantId)
      .eq('active', true)

    // Transform snake_case to camelCase
    const quotaOverrides: QuotaOverride[] = (overridesData || []).map((o: any) => ({
      id: o.id,
      tenantId: o.tenant_id,
      metricType: o.metric_type,
      quotaLimit: o.quota_limit,
      validFrom: o.valid_from,
      validUntil: o.valid_until,
      appliedBy: o.applied_by,
    }))

    return {
      tenantId: data.id,
      licenseId: license.id,
      status: license.status as TenantLicenseStatus['status'],
      tier: license.tier as LicenseTier,
      customerId: data.customer_id,
      validFrom: license.valid_from,
      validUntil: license.valid_until || undefined,
      features: license.features || [],
      quotaOverrides,
      lastCheckedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[getTenantLicenseStatus] Error:', err)
    return null
  }
}

/**
 * Apply quota override for tenant
 */
export async function applyQuotaOverride(
  params: ApplyQuotaOverrideParams
): Promise<{ success: boolean; overrideId?: string; error?: string }> {
  try {
    const { tenantId, metricType, newLimit, validUntil, reason } = params

    // Get current user (for audit)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Create or update override
    const { data, error } = await supabase
      .from('tenant_quota_overrides')
      .upsert({
        tenant_id: tenantId,
        metric_type: metricType,
        quota_limit: newLimit,
        valid_from: new Date().toISOString(),
        valid_until: validUntil,
        applied_by: user.id,
        reason: reason,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      overrideId: data.id,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get usage summary for tenant
 */
export async function getUsageSummary(
  tenantId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<TenantUsageSummary | null> {
  try {
    const now = new Date()
    const start = periodStart ? new Date(periodStart) : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = periodEnd ? new Date(periodEnd) : now

    // Get tenant quota limits
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('policy_id')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenantData) {
      return null
    }

    // Get policy limits
    const { data: policyData } = await supabase
      .from('tenant_license_policies')
      .select('quota_config')
      .eq('id', tenantData.policy_id)
      .single()

    // Get current usage from usage_logs (simplified - no group by)
    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('metric_type, usage_value')
      .eq('tenant_id', tenantId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())

    // Aggregate usage by metric type
    const usageByMetric = new Map<string, number>()
    usageData?.forEach((item: any) => {
      const current = usageByMetric.get(item.metric_type) || 0
      usageByMetric.set(item.metric_type, current + (item.usage_value || 0))
    })

    // Get quota overrides
    const { data: overridesData } = await supabase
      .from('tenant_quota_overrides')
      .select('metric_type, quota_limit')
      .eq('tenant_id', tenantId)
      .eq('active', true)

    const overridesMap = new Map(overridesData?.map((o: any) => [o.metric_type, o.quota_limit]) || [])

    // Build metrics
    const metricTypes = ['api_calls', 'tokens', 'compute_minutes', 'model_inferences', 'agent_executions'] as const
    const metrics: any = {}

    for (const metricType of metricTypes) {
      const used = usageByMetric.get(metricType) || 0
      const limit = overridesMap.get(metricType) || policyData?.quota_config?.[metricType] || 0
      const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0

      metrics[metricType] = {
        used: Math.round(used),
        limit: Math.round(limit),
        percentage,
      }
    }

    // Calculate overages
    const overages = metricTypes
      .filter(type => metrics[type].used > metrics[type].limit && metrics[type].limit > 0)
      .map(type => ({
        metricType: type,
        used: metrics[type].used,
        limit: metrics[type].limit,
        overageAmount: metrics[type].used - metrics[type].limit,
      }))

    return {
      tenantId,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      metrics,
      overages,
    }
  } catch (err) {
    console.error('[getUsageSummary] Error:', err)
    return null
  }
}

/**
 * Sync feature flags for tenant
 */
export async function syncFeatureFlags(
  flags: Record<string, boolean>,
  tenantId: string
): Promise<{ success: boolean; syncedAt?: string; error?: string }> {
  try {
    const { error } = await supabase
      .from('tenant_feature_flags')
      .upsert({
        tenant_id: tenantId,
        flags: flags,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      syncedAt: new Date().toISOString(),
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get feature flags for tenant
 */
export async function getFeatureFlags(
  tenantId: string
): Promise<Record<string, boolean> | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_feature_flags')
      .select('flags')
      .eq('tenant_id', tenantId)
      .single()

    if (error || !data) {
      return null
    }

    return data.flags || null
  } catch (err) {
    console.error('[getFeatureFlags] Error:', err)
    return null
  }
}

/**
 * Client export for easy import
 */
export const tenantLicenseClient = {
  getTenantLicenseStatus,
  applyQuotaOverride,
  getUsageSummary,
  syncFeatureFlags,
  getFeatureFlags,
}
