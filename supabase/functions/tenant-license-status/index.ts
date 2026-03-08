/**
 * Tenant License Status - Phase 6.2 Multi-tenant License Enforcement
 *
 * Retrieves tenant license status with effective quotas, feature access,
 * and current usage metrics. Aggregates data from multiple tables.
 *
 * **Endpoint:**
 *   GET /functions/v1/tenant-license-status
 *
 * **Query Parameters:**
 *   - org_id (optional): Organization ID (defaults to JWT org_id)
 *   - license_id (optional): Specific license ID
 *   - include_usage (optional): Include current usage metrics
 *
 * **Response:**
 *   {
 *     "success": true,
 *     "tenant_id": "uuid",
 *     "org_id": "uuid",
 *     "license": {
 *       "id": "uuid",
 *       "license_key": "RAAS-xxx-xxx",
 *       "tier": "premium",
 *       "status": "active",
 *       "expires_at": "ISO date"
 *     },
 *     "effective_quotas": {
 *       "quota_limit": 50000,
 *       "rate_limit_per_minute": 100,
 *       "allow_overage": true,
 *       "overage_rate_per_unit": 0.01,
 *       "quota_type": "monthly"
 *     },
 *     "features": {
 *       "ai_agents": { "enabled": true, "value": true },
 *       "advanced_analytics": { "enabled": true, "rollout_percentage": 100 },
 *       "beta_features": { "enabled": false }
 *     },
 *     "current_usage": {
 *       "api_calls": { "used": 25000, "limit": 50000, "percentage": 50 },
 *       "tokens": { "used": 500000, "limit": 1000000, "percentage": 50 }
 *     },
 *     "compliance_status": "compliant" | "warning" | "suspended",
 *     "warnings": ["Usage at 80%"]
 *   }
 */

// deno-lint-ignore-file no-explicit-any

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  extractBearerToken,
  validateJWT,
  createSupabaseClient,
  getTenantPolicy,
  checkFeatureAccess,
  getFeatureFlag,
  logAuditEvent,
  validateInput,
} from '../_shared/tenant-utils.ts'

interface LicenseStatusRequest {
  org_id?: string
  license_id?: string
  include_usage?: boolean
}

interface LicenseStatusResponse {
  success: boolean
  tenant_id?: string
  org_id?: string
  license?: Record<string, unknown>
  effective_quotas?: Record<string, unknown>
  features?: Record<string, { enabled: boolean; value?: unknown }>
  current_usage?: Record<string, { used: number; limit: number; percentage: number }>
  compliance_status?: string
  warnings?: string[]
  error?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient()

    // Extract and validate JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    const token = extractBearerToken(authHeader)

    let userId: string | null = null
    let userOrgId: string | null = null

    if (token) {
      const payload = await validateJWT(token)
      userId = payload.sub
      userOrgId = payload.org_id || payload.tenant_id || null
    }

    // Parse query parameters
    const url = new URL(req.url)
    const requestParams: LicenseStatusRequest = {
      org_id: url.searchParams.get('org_id') || undefined,
      license_id: url.searchParams.get('license_id') || undefined,
      include_usage: url.searchParams.get('include_usage') === 'true',
    }

    // Validate org_id
    const effectiveOrgId = requestParams.org_id || userOrgId

    if (!effectiveOrgId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'org_id is required (provide as query param or in JWT)',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch tenant license status
    const result = await getTenantLicenseStatus(
      supabase,
      effectiveOrgId,
      requestParams.license_id,
      requestParams.include_usage,
      userId
    )

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'TENANT_LICENSE_STATUS_CHECK',
      resource: 'tenant_license_status',
      resource_id: effectiveOrgId,
      metadata: {
        org_id: effectiveOrgId,
        license_id: requestParams.license_id,
        include_usage: requestParams.include_usage,
      },
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[LicenseStatus] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Get comprehensive tenant license status
 */
async function getTenantLicenseStatus(
  supabase: any,
  orgId: string,
  licenseId?: string,
  includeUsage?: boolean,
  userId?: string | null
): Promise<LicenseStatusResponse> {
  try {
    // Step 1: Fetch license details
    let licenseQuery = supabase
      .from('raas_licenses')
      .select('id, license_key, tier, status, expires_at, org_id, features, metadata')

    if (licenseId) {
      licenseQuery = licenseQuery.eq('id', licenseId)
    } else {
      licenseQuery = licenseQuery.eq('org_id', orgId)
    }

    const { data: license, error: licenseError } = await licenseQuery.single()

    if (licenseError || !license) {
      return {
        success: false,
        error: 'License not found for this organization',
      }
    }

    // Step 2: Fetch tenant policy (effective quotas)
    const policy = await getTenantPolicy(supabase, orgId)

    const effectiveQuotas: Record<string, unknown> = {
      quota_type: 'monthly', // Default
      allow_overage: false,
      overage_rate_per_unit: 0,
    }

    if (policy) {
      effectiveQuotas.quota_limit = policy.quota_limit
      effectiveQuotas.rate_limit_per_minute = policy.rate_limit_per_minute
      effectiveQuotas.quota_type = policy.quota_type
      effectiveQuotas.allow_overage = policy.allow_overage
      effectiveQuotas.overage_rate_per_unit = policy.overage_rate_per_unit
      effectiveQuotas.policy_id = policy.id
      effectiveQuotas.policy_name = policy.policy_name
    } else {
      // Apply tier-based default quotas
      const tierQuotas = getDefaultTierQuotas(license.tier)
      effectiveQuotas.quota_limit = tierQuotas.quota_limit
      effectiveQuotas.rate_limit_per_minute = tierQuotas.rate_limit_per_minute
    }

    // Step 3: Fetch feature flags
    const features: Record<string, { enabled: boolean; value?: unknown }> = {}

    // Get license features
    const licenseFeatures = (license.features as Record<string, boolean>) || {}
    for (const [featureKey, enabled] of Object.entries(licenseFeatures)) {
      features[featureKey] = { enabled }
    }

    // Get tenant-specific feature flags
    const { data: flagData } = await supabase
      .from('tenant_feature_flags')
      .select('flag_key, enabled, flag_type, percentage_value, rollout_strategy, json_value')
      .eq('org_id', orgId)

    if (flagData) {
      for (const flag of flagData) {
        const flagValue = await getFeatureFlag(supabase, orgId, flag.flag_key, userId || undefined)
        features[flag.flag_key] = flagValue
      }
    }

    // Step 4: Fetch current usage (if requested)
    let currentUsage: Record<string, { used: number; limit: number; percentage: number }> | undefined

    if (includeUsage) {
      currentUsage = await getCurrentUsage(supabase, orgId, license.id, effectiveQuotas.quota_limit as number)
    }

    // Step 5: Determine compliance status
    const complianceStatus = determineComplianceStatus(license.status, currentUsage)

    // Step 6: Generate warnings
    const warnings = generateWarnings(license, currentUsage)

    return {
      success: true,
      tenant_id: orgId,
      org_id: orgId,
      license: {
        id: license.id,
        license_key: maskLicenseKey(license.license_key),
        tier: license.tier,
        status: license.status,
        expires_at: license.expires_at,
        features: license.features,
      },
      effective_quotas: effectiveQuotas,
      features,
      current_usage: currentUsage,
      compliance_status: complianceStatus,
      warnings,
    }

  } catch (error) {
    console.error('[LicenseStatus] getTenantLicenseStatus error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch license status',
    }
  }
}

/**
 * Get default quotas based on license tier
 */
function getDefaultTierQuotas(tier: string): { quota_limit: number; rate_limit_per_minute: number } {
  const tierQuotas: Record<string, { quota_limit: number; rate_limit_per_minute: number }> = {
    free: { quota_limit: 1000, rate_limit_per_minute: 10 },
    basic: { quota_limit: 10000, rate_limit_per_minute: 60 },
    premium: { quota_limit: 50000, rate_limit_per_minute: 100 },
    enterprise: { quota_limit: 500000, rate_limit_per_minute: 500 },
    master: { quota_limit: -1, rate_limit_per_minute: -1 }, // Unlimited
  }

  return tierQuotas[tier] || tierQuotas.free
}

/**
 * Get current usage for tenant
 */
async function getCurrentUsage(
  supabase: any,
  orgId: string,
  licenseId: string,
  quotaLimit: number
): Promise<Record<string, { used: number; limit: number; percentage: number }>> {
  try {
    // Get current period (monthly by default)
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch usage records for current period
    const { data: usageRecords } = await supabase
      .from('usage_records')
      .select('feature, quantity')
      .eq('org_id', orgId)
      .eq('license_id', licenseId)
      .gte('recorded_at', periodStart.toISOString())
      .lte('recorded_at', periodEnd.toISOString())

    if (!usageRecords || usageRecords.length === 0) {
      return {
        api_calls: { used: 0, limit: quotaLimit, percentage: 0 },
      }
    }

    // Aggregate usage by feature
    const usageByFeature: Record<string, number> = {}
    for (const record of usageRecords) {
      const feature = record.feature || 'api_calls'
      usageByFeature[feature] = (usageByFeature[feature] || 0) + (record.quantity || 0)
    }

    // Format usage with limits and percentages
    const formattedUsage: Record<string, { used: number; limit: number; percentage: number }> = {}

    for (const [feature, used] of Object.entries(usageByFeature)) {
      // Use quota limit for api_calls, proportional for others
      const limit = feature === 'api_calls' ? quotaLimit : Math.ceil(quotaLimit * getFeatureWeight(feature))

      formattedUsage[feature] = {
        used,
        limit: limit === -1 ? used : limit, // Handle unlimited
        percentage: limit === -1 ? 0 : Math.round((used / limit) * 100),
      }
    }

    return formattedUsage
  } catch (error) {
    console.error('[LicenseStatus] getCurrentUsage error:', error)
    return {
      api_calls: { used: 0, limit: quotaLimit, percentage: 0 },
    }
  }
}

/**
 * Get feature weight for quota calculation
 */
function getFeatureWeight(feature: string): number {
  const weights: Record<string, number> = {
    api_calls: 1.0,
    tokens: 0.1, // 10 tokens = 1 API call equivalent
    model_inference: 10.0, // 1 inference = 10 API calls
    agent_execution: 5.0, // 1 agent execution = 5 API calls
    compute_minutes: 2.0, // 1 compute minute = 2 API calls
  }

  return weights[feature] || 1.0
}

/**
 * Determine compliance status based on license and usage
 */
function determineComplianceStatus(
  licenseStatus: string,
  currentUsage?: Record<string, { used: number; limit: number; percentage: number }>
): string {
  if (licenseStatus !== 'active') {
    return 'suspended'
  }

  if (currentUsage) {
    const maxPercentage = Math.max(
      ...Object.values(currentUsage).map(u => u.percentage)
    )

    if (maxPercentage >= 100) {
      return 'suspended'
    }

    if (maxPercentage >= 90) {
      return 'warning'
    }
  }

  return 'compliant'
}

/**
 * Generate warnings for tenant
 */
function generateWarnings(
  license: Record<string, unknown>,
  currentUsage?: Record<string, { used: number; limit: number; percentage: number }>
): string[] {
  const warnings: string[] = []

  // License expiration warning
  if (license.expires_at) {
    const expiresAt = new Date(license.expires_at as string)
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 7) {
      warnings.push(`License expires in ${daysUntilExpiry} days`)
    } else if (daysUntilExpiry <= 30) {
      warnings.push(`License expires in ${daysUntilExpiry} days - Renew soon`)
    }
  }

  // Usage warnings
  if (currentUsage) {
    for (const [feature, usage] of Object.entries(currentUsage)) {
      if (usage.percentage >= 100) {
        warnings.push(`CRITICAL: ${feature} quota exhausted (${usage.percentage}%)`)
      } else if (usage.percentage >= 90) {
        warnings.push(`WARNING: ${feature} quota at ${usage.percentage}%`)
      } else if (usage.percentage >= 80) {
        warnings.push(`NOTICE: ${feature} quota at ${usage.percentage}%`)
      }
    }
  }

  return warnings
}

/**
 * Mask license key for display
 */
function maskLicenseKey(key: string): string {
  if (!key || key.length < 15) return '***'
  return key.slice(0, 10) + '...' + key.slice(-4)
}
