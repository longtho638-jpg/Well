/**
 * Tenant Quota Override - Phase 6.2 Multi-tenant License Enforcement
 *
 * Manages quota override requests for tenants with approval workflow.
 * Supports: apply override, get override status, revoke override.
 *
 * **Endpoints:**
 *   POST /functions/v1/tenant-quota-override   - Apply for quota override
 *   GET  /functions/v1/tenant-quota-override   - Get override status/details
 *   DELETE /functions/v1/tenant-quota-override - Revoke/cancel override
 *
 * **POST Request:**
 *   {
 *     "org_id": "uuid",
 *     "override_type": "quota_increase" | "rate_limit_increase" | "feature_enable" | "temporary_boost",
 *     "previous_value": { "quota_limit": 10000 },
 *     "new_value": { "quota_limit": 50000 },
 *     "is_temporary": boolean,
 *     "expires_at": "ISO date string",
 *     "reason": "Justification for override"
 *   }
 *
 * **POST Response:**
 *   {
 *     "success": true,
 *     "override_id": "OVR-20260308-001",
 *     "approval_status": "pending" | "auto_approved" | "requires_approval",
 *     "risk_level": "low" | "medium" | "high",
 *     "message": "Override request created"
 *   }
 *
 * **GET Request:**
 *   { "override_id": "OVR-20260308-001" }
 *
 * **GET Response:**
 *   {
 *     "success": true,
 *     "override": { override details },
 *     "approval_status": "pending" | "approved" | "rejected",
 *     "executed": boolean
 *   }
 *
 * **DELETE Request:**
 *   { "override_id": "OVR-20260308-001", "reason": "Cancellation reason" }
 *
 * **DELETE Response:**
 *   {
 *     "success": true,
 *     "message": "Override revoked",
 *     "reverted": boolean
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
  createQuotaOverride,
  logAuditEvent,
  validateInput,
} from '../_shared/tenant-utils.ts'

interface QuotaOverrideRequest {
  org_id?: string
  override_type?: string
  previous_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  is_temporary?: boolean
  expires_at?: string
  reason?: string
  override_id?: string
}

interface QuotaOverrideResponse {
  success: boolean
  override_id?: string
  approval_status?: string
  risk_level?: string
  override?: Record<string, unknown>
  executed?: boolean
  message?: string
  error?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST, GET, DELETE
  if (!['POST', 'GET', 'DELETE'].includes(req.method)) {
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
      try {
        const payload = await validateJWT(token)
        userId = payload.sub
        userOrgId = payload.org_id || payload.tenant_id || null
      } catch (error) {
        // JWT validation failed - continue without user context
        // For admin operations, JWT is required
        console.warn('[QuotaOverride] JWT validation failed:', error)
      }
    }

    // Handle POST - Apply for override
    if (req.method === 'POST') {
      return await handlePOST(req, supabase, userId, userOrgId)
    }

    // Handle GET - Get override status
    if (req.method === 'GET') {
      return await handleGET(req, supabase, userId, userOrgId)
    }

    // Handle DELETE - Revoke override
    if (req.method === 'DELETE') {
      return await handleDELETE(req, supabase, userId, userOrgId)
    }

  } catch (error) {
    console.error('[QuotaOverride] Error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Handle POST - Apply for quota override
 */
async function handlePOST(
  req: Request,
  supabase: any,
  userId: string | null,
  userOrgId: string | null
): Promise<Response> {
  try {
    const payload: QuotaOverrideRequest = await req.json()
    const {
      org_id,
      override_type,
      previous_value,
      new_value,
      is_temporary,
      expires_at,
      reason,
    } = payload

    // Validate required fields
    const validation = validateInput({
      org_id: { value: org_id || userOrgId, required: true },
      override_type: { value: override_type, required: true, type: 'string' },
      previous_value: { value: previous_value, required: true, type: 'object' },
      new_value: { value: new_value, required: true, type: 'object' },
    })

    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const effectiveOrgId = org_id || userOrgId

    // Validate override_type
    const validOverrideTypes = [
      'quota_increase', 'quota_decrease',
      'rate_limit_increase', 'rate_limit_decrease',
      'feature_enable', 'feature_disable',
      'overage_enable', 'overage_disable',
      'temporary_boost', 'emergency_override',
    ]

    if (override_type && !validOverrideTypes.includes(override_type)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid override_type: must be one of ${validOverrideTypes.join(', ')}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine risk level based on override type and magnitude
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    let approvalStatus: 'pending' | 'auto_approved' | 'requires_approval' = 'pending'

    // Low-risk overrides can be auto-approved
    if (['quota_increase', 'rate_limit_increase', 'temporary_boost'].includes(override_type!)) {
      const increaseRatio = calculateIncreaseRatio(previous_value!, new_value!)

      if (increaseRatio < 1.5) {
        // < 50% increase = low risk, auto-approve
        riskLevel = 'low'
        approvalStatus = 'auto_approved'
      } else if (increaseRatio < 3.0) {
        // < 3x increase = medium risk
        riskLevel = 'medium'
        approvalStatus = 'requires_approval'
      } else {
        // >= 3x increase = high risk
        riskLevel = 'high'
        approvalStatus = 'requires_approval'
      }
    }

    // Temporary boosts under 24h are low risk
    if (is_temporary && expires_at) {
      const expiresAt = new Date(expires_at)
      const now = new Date()
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilExpiry <= 24) {
        riskLevel = 'low'
        approvalStatus = 'auto_approved'
      }
    }

    // Create override request
    const overrideRequest = {
      org_id: effectiveOrgId!,
      override_type: override_type!,
      previous_value: previous_value!,
      new_value: new_value!,
      approval_status: approvalStatus,
      is_temporary: is_temporary || false,
      risk_level: riskLevel,
      expires_at,
      reason: reason || '',
      requested_by: userId || 'system',
    }

    const result = await createQuotaOverride(supabase, overrideRequest)

    if (result.error) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'QUOTA_OVERRIDE_REQUEST',
      resource: 'quota_override_audit',
      resource_id: result.override_id,
      metadata: {
        org_id: effectiveOrgId,
        override_type,
        risk_level: riskLevel,
        approval_status: approvalStatus,
      },
    })

    // Auto-approve low-risk overrides
    if (approvalStatus === 'auto_approved') {
      const { error: updateError } = await supabase
        .from('quota_override_audit')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'auto_approval_system',
        })
        .eq('override_id', result.override_id)

      if (!updateError) {
        // Execute the override
        await executeOverride(supabase, result.override_id, new_value!)
      }
    }

    // Return response
    return new Response(JSON.stringify({
      success: true,
      override_id: result.override_id,
      approval_status,
      risk_level,
      message: approvalStatus === 'auto_approved'
        ? 'Override auto-approved and applied'
        : 'Override request pending approval',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[QuotaOverride:POST] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create override request',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle GET - Get override status/details
 */
async function handleGET(
  req: Request,
  supabase: any,
  userId: string | null,
  userOrgId: string | null
): Promise<Response> {
  try {
    const url = new URL(req.url)
    const overrideId = url.searchParams.get('override_id')

    if (!overrideId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'override_id query parameter is required',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch override details
    const { data: override, error } = await supabase
      .from('quota_override_audit')
      .select('*')
      .eq('override_id', overrideId)
      .single()

    if (error || !override) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Override not found',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if override is executed
    const executed = override.approval_status === 'approved'

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'QUOTA_OVERRIDE_GET',
      resource: 'quota_override_audit',
      resource_id: overrideId,
      metadata: { org_id: override.org_id },
    })

    return new Response(JSON.stringify({
      success: true,
      override,
      approval_status: override.approval_status,
      executed,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[QuotaOverride:GET] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get override',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle DELETE - Revoke/cancel override
 */
async function handleDELETE(
  req: Request,
  supabase: any,
  userId: string | null,
  userOrgId: string | null
): Promise<Response> {
  try {
    const payload: QuotaOverrideRequest = await req.json()
    const { override_id, reason } = payload

    if (!override_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'override_id is required',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch current override status
    const { data: override, error: fetchError } = await supabase
      .from('quota_override_audit')
      .select('*')
      .eq('override_id', override_id)
      .single()

    if (fetchError || !override) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Override not found',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if override can be revoked
    if (override.approval_status === 'rejected') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot revoke a rejected override',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let reverted = false

    // If override was approved and executed, revert it
    if (override.approval_status === 'approved' && override.is_temporary) {
      await revertOverride(supabase, override_id)
      reverted = true
    }

    // Update override status to rejected
    const { error: updateError } = await supabase
      .from('quota_override_audit')
      .update({
        approval_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: userId || 'system',
        reason: reason || 'Revoked by user',
      })
      .eq('override_id', override_id)

    if (updateError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to revoke override',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'QUOTA_OVERRIDE_REVOKED',
      resource: 'quota_override_audit',
      resource_id: override_id,
      metadata: {
        org_id: override.org_id,
        reverted,
        reason,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Override revoked successfully',
      reverted,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[QuotaOverride:DELETE] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke override',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Calculate increase ratio between previous and new values
 */
function calculateIncreaseRatio(
  previousValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): number {
  const prevQuota = (previousValue.quota_limit as number) || 0
  const newQuota = (newValue.quota_limit as number) || 0

  if (prevQuota === 0) return newQuota > 0 ? Infinity : 1
  return newQuota / prevQuota
}

/**
 * Execute override - apply changes to policy
 */
async function executeOverride(
  supabase: any,
  overrideId: string,
  newValue: Record<string, unknown>
): Promise<void> {
  try {
    // Get override details
    const { data: override } = await supabase
      .from('quota_override_audit')
      .select('org_id, policy_id')
      .eq('override_id', overrideId)
      .single()

    if (!override?.policy_id) {
      console.warn('[QuotaOverride] Cannot execute - policy_id not found')
      return
    }

    // Update policy with new values
    const updateData: Record<string, unknown> = {}

    if (newValue.quota_limit !== undefined) {
      updateData.quota_limit = newValue.quota_limit
    }

    if (newValue.rate_limit_per_minute !== undefined) {
      updateData.rate_limit_per_minute = newValue.rate_limit_per_minute
    }

    if (newValue.allow_overage !== undefined) {
      updateData.allow_overage = newValue.allow_overage
    }

    const { error } = await supabase
      .from('tenant_license_policies')
      .update(updateData)
      .eq('id', override.policy_id)

    if (error) {
      console.error('[QuotaOverride] Policy update failed:', error)
    } else {
      console.log('[QuotaOverride] Override executed successfully')
    }
  } catch (error) {
    console.error('[QuotaOverride] executeOverride error:', error)
  }
}

/**
 * Revert override - restore previous values
 */
async function revertOverride(
  supabase: any,
  overrideId: string
): Promise<void> {
  try {
    // Get override details
    const { data: override } = await supabase
      .from('quota_override_audit')
      .select('org_id, policy_id, previous_value')
      .eq('override_id', overrideId)
      .single()

    if (!override?.policy_id || !override.previous_value) {
      console.warn('[QuotaOverride] Cannot revert - missing data')
      return
    }

    // Restore previous values
    const updateData: Record<string, unknown> = {}

    const prevValue = override.previous_value as Record<string, unknown>

    if (prevValue.quota_limit !== undefined) {
      updateData.quota_limit = prevValue.quota_limit
    }

    if (prevValue.rate_limit_per_minute !== undefined) {
      updateData.rate_limit_per_minute = prevValue.rate_limit_per_minute
    }

    if (prevValue.allow_overage !== undefined) {
      updateData.allow_overage = prevValue.allow_overage
    }

    const { error } = await supabase
      .from('tenant_license_policies')
      .update(updateData)
      .eq('id', override.policy_id)

    if (error) {
      console.error('[QuotaOverride] Policy revert failed:', error)
    } else {
      console.log('[QuotaOverride] Override reverted successfully')
    }
  } catch (error) {
    console.error('[QuotaOverride] revertOverride error:', error)
  }
}
