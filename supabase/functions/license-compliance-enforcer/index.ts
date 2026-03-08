/**
 * License Compliance Enforcer - Phase 6.8
 *
 * Proactive license compliance enforcement that:
 * 1. Triggers on usage threshold breaches (>90% quota)
 * 2. Validates license status via RaaS Gateway API
 * 3. Uses mk_ API key authentication
 * 4. Auto-suspends agency access if license invalid/expired
 * 5. Logs all compliance checks for auditability
 *
 * **Endpoint:**
 *   POST /functions/v1/license-compliance-enforcer
 *
 * **Request:**
 *   {
 *     "user_id": "uuid",
 *     "org_id": "uuid",
 *     "license_id": "uuid",
 *     "check_type": "usage_threshold" | "periodic" | "manual",
 *     "trigger_reason": "usage_90_percent" | "usage_100_percent",
 *     "current_usage": number,
 *     "quota_limit": number
 *   }
 *
 * **Response:**
 *   {
 *     "success": true,
 *     "event_id": "uuid",
 *     "license_valid": true,
 *     "enforcement_action": "none" | "warning" | "suspend",
 *     "org_status": "compliant" | "suspended"
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ComplianceCheckRequest {
  user_id: string
  org_id: string
  license_id: string
  check_type: 'usage_threshold' | 'periodic' | 'manual' | 'api_call'
  trigger_reason?: string
  current_usage?: number
  quota_limit?: number
  usage_percentage?: number
  api_key?: string // Optional mk_ API key for RaaS Gateway auth
}

interface RaasGatewayResponse {
  valid: boolean
  license_status: 'active' | 'expired' | 'revoked' | 'invalid'
  license_tier: 'basic' | 'premium' | 'enterprise' | 'master'
  features: Record<string, boolean>
  expires_at?: string
  error?: string
}

interface ComplianceEnforcerResponse {
  success: boolean
  event_id: string
  license_valid: boolean
  enforcement_action: 'none' | 'warning' | 'suspend' | 'revoke'
  org_status: 'compliant' | 'warning' | 'suspended' | 'revoked'
  error?: string
}

// RaaS Gateway configuration
const RAAS_GATEWAY_BASE_URL = Deno.env.get('RAAS_GATEWAY_URL') || 'https://raas.agencyos.network/api'
const RAAS_API_KEY = Deno.env.get('RAAS_API_KEY') // mk_live_xxx or mk_test_xxx

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Parse request payload
    const payload: ComplianceCheckRequest = await req.json()
    const {
      user_id,
      org_id,
      license_id,
      check_type,
      trigger_reason,
      current_usage,
      quota_limit,
      usage_percentage,
      api_key,
    } = payload

    // Validate required fields
    if (!user_id || !org_id || !license_id) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: user_id, org_id, license_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate event ID and idempotency key
    const eventId = crypto.randomUUID()
    const idempotencyKey = `compliance_${user_id}_${check_type}_${new Date().toISOString().split('T')[0]}`

    // Check idempotency (prevent duplicate checks within 1 hour)
    const { data: canProceed } = await supabase
      .rpc('check_compliance_idempotency', {
        p_user_id: user_id,
        p_check_type: check_type,
        p_hours_lookback: 1,
      })

    if (canProceed === false) {
      console.warn('[ComplianceEnforcer] Duplicate check suppressed:', { user_id, check_type })
      return new Response(JSON.stringify({
        success: true,
        event_id: eventId,
        license_valid: true,
        enforcement_action: 'none',
        org_status: 'compliant',
        message: 'Compliance check already performed within cooldown period',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get license details from database
    const { data: licenseData, error: licenseError } = await supabase
      .from('raas_licenses')
      .select('license_key, tier, status, metadata')
      .eq('id', license_id)
      .single()

    if (licenseError || !licenseData) {
      console.error('[ComplianceEnforcer] License not found:', license_id)
      await logComplianceEvent(supabase, {
        event_id: eventId,
        license_id,
        user_id,
        org_id,
        check_type,
        trigger_reason,
        current_usage,
        quota_limit,
        usage_percentage,
        license_status: 'not_found',
        enforcement_action: 'suspend',
        enforcement_status: 'failed',
        error_message: 'License not found in database',
        idempotency_key: idempotencyKey,
      })
      return new Response(JSON.stringify({
        success: false,
        event_id: eventId,
        license_valid: false,
        enforcement_action: 'suspend',
        org_status: 'suspended',
        error: 'License not found',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate license via RaaS Gateway
    const gatewayResponse = await validateLicenseViaGateway(
      licenseData.license_key,
      api_key || RAAS_API_KEY
    )

    const licenseValid = gatewayResponse.valid && gatewayResponse.license_status === 'active'
    const licenseStatus = gatewayResponse.license_status

    // Determine enforcement action
    let enforcementAction: 'none' | 'warning' | 'suspend' | 'revoke' = 'none'
    let orgStatus: 'compliant' | 'warning' | 'suspended' | 'revoked' = 'compliant'

    if (!licenseValid) {
      // License invalid/expired/revoked - SUSPEND
      enforcementAction = 'suspend'
      orgStatus = 'suspended'

      // Suspend organization
      await suspendOrganization(supabase, org_id, `License ${licenseStatus} - Auto-suspended by compliance enforcer`, user_id)
    } else if (usage_percentage && usage_percentage >= 100) {
      // Usage at 100% - WARNING (don't suspend yet, but flag)
      enforcementAction = 'warning'
      orgStatus = 'warning'
    } else if (usage_percentage && usage_percentage >= 90) {
      // Usage at 90% - WARNING
      enforcementAction = 'warning'
      orgStatus = 'warning'
    }

    // Log compliance event
    await logComplianceEvent(supabase, {
      event_id: eventId,
      license_id,
      user_id,
      org_id,
      check_type,
      trigger_reason,
      current_usage,
      quota_limit,
      usage_percentage,
      license_status: licenseStatus,
      license_tier: gatewayResponse.license_tier,
      raas_gateway_response: gatewayResponse,
      enforcement_action: enforcementAction,
      enforcement_status: 'executed',
      previous_org_status: orgStatus === 'suspended' ? 'compliant' : orgStatus,
      new_org_status: orgStatus,
      api_key_prefix: (api_key || RAAS_API_KEY)?.startsWith('mk_live_') ? 'mk_live' :
                       (api_key || RAAS_API_KEY)?.startsWith('mk_test_') ? 'mk_test' : 'mk_prod',
      idempotency_key: idempotencyKey,
    })

    // Return response
    const response: ComplianceEnforcerResponse = {
      success: true,
      event_id: eventId,
      license_valid: licenseValid,
      enforcement_action: enforcementAction,
      org_status: orgStatus,
    }

    if (!licenseValid) {
      response.error = `License ${licenseStatus} - Organization suspended`
    }

    return new Response(JSON.stringify(response), {
      status: licenseValid ? 200 : 200, // 200 even on suspension (request succeeded)
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[ComplianceEnforcer] Error:', error)
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
 * Validate license via RaaS Gateway API
 */
async function validateLicenseViaGateway(
  licenseKey: string,
  apiKey?: string
): Promise<RaasGatewayResponse> {
  if (!apiKey) {
    console.warn('[ComplianceEnforcer] RAAS_API_KEY not configured, skipping gateway validation')
    return {
      valid: true,
      license_status: 'active',
      license_tier: 'premium',
      features: {},
    }
  }

  try {
    const response = await fetch(`${RAAS_GATEWAY_BASE_URL}/licenses/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'User-Agent': 'WellNexus-Compliance-Enforcer/1.0',
      },
      body: JSON.stringify({ license_key: licenseKey }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        valid: false,
        license_status: 'invalid',
        license_tier: 'basic',
        features: {},
        error: errorData.error || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      valid: data.valid ?? true,
      license_status: data.status || 'active',
      license_tier: data.tier || 'premium',
      features: data.features || {},
      expires_at: data.expires_at,
    }
  } catch (error) {
    console.error('[ComplianceEnforcer] Gateway validation failed:', error)
    return {
      valid: false,
      license_status: 'invalid',
      license_tier: 'basic',
      features: {},
      error: error instanceof Error ? error.message : 'Gateway connection failed',
    }
  }
}

/**
 * Suspend organization in database
 */
async function suspendOrganization(
  supabase: any,
  orgId: string,
  reason: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('suspend_organization', {
      p_org_id: orgId,
      p_reason: reason,
      p_user_id: userId,
    })

    if (error) {
      console.error('[ComplianceEnforcer] Suspension failed:', error)
    } else {
      console.warn('[ComplianceEnforcer] Organization suspended:', orgId)
    }
  } catch (error) {
    console.error('[ComplianceEnforcer] Suspension error:', error)
  }
}

/**
 * Log compliance event to database
 */
async function logComplianceEvent(
  supabase: any,
  event: {
    event_id: string
    license_id: string
    user_id: string
    org_id: string
    check_type: string
    trigger_reason?: string
    current_usage?: number
    quota_limit?: number
    usage_percentage?: number
    license_status?: string
    license_tier?: string
    raas_gateway_response?: any
    enforcement_action: string
    enforcement_status: string
    previous_org_status?: string
    new_org_status?: string
    api_key_prefix?: string
    error_message?: string
    idempotency_key: string
  }
): Promise<void> {
  try {
    const { error } = await supabase.from('license_compliance_logs').insert({
      event_id: event.event_id,
      license_id: event.license_id,
      user_id: event.user_id,
      org_id: event.org_id,
      check_type: event.check_type,
      trigger_reason: event.trigger_reason,
      current_usage: event.current_usage,
      quota_limit: event.quota_limit,
      usage_percentage: event.usage_percentage,
      license_status: event.license_status,
      license_tier: event.license_tier,
      raas_gateway_response: event.raas_gateway_response,
      enforcement_action: event.enforcement_action,
      enforcement_status: event.enforcement_status,
      previous_org_status: event.previous_org_status,
      new_org_status: event.new_org_status,
      api_key_prefix: event.api_key_prefix,
      error_message: event.error_message,
      idempotency_key: event.idempotency_key,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'compliance_enforcer',
      },
    })

    if (error) {
      console.error('[ComplianceEnforcer] Log failed:', error)
    }
  } catch (error) {
    console.error('[ComplianceEnforcer] Log error:', error)
  }
}
