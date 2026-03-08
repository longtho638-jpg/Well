/**
 * Tenant Utils - Shared utilities for tenant operations
 *
 * Provides JWT validation, tenant lookup, and common quota/feature operations
 * for multi-tenant license enforcement edge functions.
 */

// deno-lint-ignore-file no-explicit-any

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * JWT Payload interface for tenant authentication
 */
export interface TenantJWTPayload {
  iss: string          // 'raas.agencyos.network'
  aud: string          // 'agencyos.network'
  sub: string          // user_id
  org_id?: string      // Organization ID
  tenant_id?: string   // Tenant ID (alias for org_id)
  license_id?: string  // License ID
  iat: number
  exp: number
}

/**
 * Tenant policy with quota limits
 */
export interface TenantPolicy {
  id: string
  license_id: string
  org_id: string
  policy_name: string
  quota_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'
  quota_limit: number
  rate_limit_per_minute: number
  allowed_features: Record<string, boolean>
  allow_overage: boolean
  overage_rate_per_unit: number
  status: 'active' | 'suspended' | 'expired' | 'draft'
}

/**
 * Feature flag value
 */
export interface FeatureFlagValue {
  enabled: boolean
  value?: boolean | number | string | Record<string, unknown>
  rollout_percentage?: number
  variant?: string
}

/**
 * Quota override request
 */
export interface QuotaOverrideRequest {
  org_id: string
  override_type: 'quota_increase' | 'quota_decrease' | 'rate_limit_increase' | 'rate_limit_decrease' |
                 'feature_enable' | 'feature_disable' | 'overage_enable' | 'overage_disable' |
                 'temporary_boost' | 'emergency_override'
  previous_value: Record<string, unknown>
  new_value: Record<string, unknown>
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved'
  is_temporary: boolean
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  expires_at?: string
  reason?: string
  requested_by: string
}

/**
 * Get Supabase client from environment
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

/**
 * Validate JWT token and extract payload
 *
 * @param token - JWT token from Authorization header
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export async function validateJWT(token: string): Promise<TenantJWTPayload> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))

    // Verify algorithm
    if (header.alg !== 'HS256') {
      throw new Error('Unsupported JWT algorithm')
    }

    // Verify expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT token has expired')
    }

    // Verify issuer
    if (payload.iss !== 'raas.agencyos.network') {
      throw new Error('Invalid JWT issuer')
    }

    return payload as TenantJWTPayload
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid JWT')) {
      throw error
    }
    throw new Error(`JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Get tenant policy from database
 */
export async function getTenantPolicy(
  supabase: SupabaseClient,
  orgId: string
): Promise<TenantPolicy | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_license_policies')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .single()

    if (error || !data) {
      return null
    }

    return data as TenantPolicy
  } catch (error) {
    console.error('[TenantUtils] getTenantPolicy error:', error)
    return null
  }
}

/**
 * Check feature access for tenant
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  orgId: string,
  featureName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_feature_access', {
      p_org_id: orgId,
      p_feature_name: featureName,
    })

    if (error || !data) {
      return false
    }

    return data as boolean
  } catch (error) {
    console.error('[TenantUtils] checkFeatureAccess error:', error)
    return false
  }
}

/**
 * Get feature flag value for tenant
 */
export async function getFeatureFlag(
  supabase: SupabaseClient,
  orgId: string,
  flagKey: string,
  userId?: string
): Promise<FeatureFlagValue> {
  try {
    const { data, error } = await supabase.rpc('is_feature_enabled', {
      p_org_id: orgId,
      p_flag_key: flagKey,
      p_user_id: userId || null,
    })

    if (error || !data) {
      return { enabled: false }
    }

    return {
      enabled: data as boolean,
    }
  } catch (error) {
    console.error('[TenantUtils] getFeatureFlag error:', error)
    return { enabled: false }
  }
}

/**
 * Create quota override request
 */
export async function createQuotaOverride(
  supabase: SupabaseClient,
  request: QuotaOverrideRequest
): Promise<{ override_id: string; error?: string }> {
  try {
    // Generate override ID
    const { data: idData, error: idError } = await supabase.rpc('generate_override_id')

    if (idError || !idData) {
      return { override_id: '', error: 'Failed to generate override ID' }
    }

    const overrideId = idData as string

    // Insert override request
    const { error: insertError } = await supabase.from('quota_override_audit').insert({
      override_id: overrideId,
      org_id: request.org_id,
      override_type: request.override_type,
      previous_value: request.previous_value,
      new_value: request.new_value,
      approval_status: request.approval_status,
      is_temporary: request.is_temporary,
      risk_level: request.risk_level,
      expires_at: request.expires_at,
      reason: request.reason,
      requested_by: request.requested_by,
    })

    if (insertError) {
      return { override_id: '', error: insertError.message }
    }

    return { override_id: overrideId }
  } catch (error) {
    console.error('[TenantUtils] createQuotaOverride error:', error)
    return { override_id: '', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    user_id: string | null
    event_type: string
    resource: string
    resource_id?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: event.user_id,
      event_type: event.event_type,
      resource: event.resource,
      resource_id: event.resource_id,
      metadata: event.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[TenantUtils] logAuditEvent error:', error)
  }
}

/**
 * Validate input fields
 */
export function validateInput(
  fields: Record<string, { value: unknown; required?: boolean; type?: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [name, field] of Object.entries(fields)) {
    if (field.required && (field.value === undefined || field.value === null)) {
      errors.push(`${name} is required`)
      continue
    }

    if (field.value !== undefined && field.type) {
      const actualType = typeof field.value
      if (field.type === 'array' && !Array.isArray(field.value)) {
        errors.push(`${name} must be an array`)
      } else if (field.type !== 'array' && actualType !== field.type) {
        errors.push(`${name} must be of type ${field.type}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
