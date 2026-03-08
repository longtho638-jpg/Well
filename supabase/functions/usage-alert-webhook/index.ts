/**
 * Usage Alert Webhook - Phase 6 Real-time Alerts
 *
 * Emits webhook events to AgencyOS dashboard when distributor's usage exceeds threshold.
 * JWT-authenticated delivery with audit logging.
 *
 * **Endpoint:**
 *   POST /functions/v1/usage-alert-webhook
 *
 * **Request:**
 *   {
 *     "user_id": "uuid",
 *     "license_id": "uuid",
 *     "metric_type": "api_calls" | "tokens" | "compute_minutes" | "model_inferences" | "agent_executions",
 *     "threshold_percentage": 80 | 90 | 100,
 *     "current_usage": number,
 *     "quota_limit": number,
 *     "webhook_url": "https://agencyos.network/api/webhooks/usage-alerts"
 *   }
 *
 * **Response:**
 *   { success: true, event_id: "uuid", webhook_status: "sent" | "failed" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UsageAlertPayload {
  user_id: string
  license_id: string
  metric_type: 'api_calls' | 'tokens' | 'compute_minutes' | 'model_inferences' | 'agent_executions'
  threshold_percentage: 80 | 90 | 100
  current_usage: number
  quota_limit: number
  webhook_url: string
  customer_id?: string
}

interface AlertWebhookResponse {
  success: boolean
  event_id: string
  webhook_status: 'sent' | 'failed' | 'pending'
  error?: string
}

/**
 * JWT Payload for alert delivery
 */
interface AlertJWTPayload {
  iss: string          // 'raas.agencyos.network'
  aud: string          // 'agencyos.network'
  sub: string          // user_id
  event_type: string   // 'usage.threshold_exceeded'
  event_id: string     // unique event ID
  metric_type: string
  threshold_percentage: number
  current_usage: number
  quota_limit: number
  license_id: string
  iat: number
  exp: number
}

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
    const payload: UsageAlertPayload = await req.json()
    const {
      user_id,
      license_id,
      metric_type,
      threshold_percentage,
      current_usage,
      quota_limit,
      webhook_url,
      customer_id,
    } = payload

    // Validate required fields
    if (!user_id || !license_id || !metric_type || !threshold_percentage) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: user_id, license_id, metric_type, threshold_percentage'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate threshold percentage
    if (![80, 90, 100].includes(threshold_percentage)) {
      return new Response(JSON.stringify({
        error: 'Invalid threshold_percentage: must be 80, 90, or 100'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique event ID and idempotency key
    const eventId = crypto.randomUUID()
    const idempotencyKey = `${user_id}_${metric_type}_${threshold_percentage}_${new Date().toISOString().split('T')[0]}`

    // Check idempotency (prevent duplicate alerts within cooldown period)
    const { data: existingAlert } = await supabase
      .rpc('check_alert_idempotency', {
        p_user_id: user_id,
        p_metric_type: metric_type,
        p_threshold_percentage: threshold_percentage,
      })

    if (existingAlert === false) {
      console.warn('[UsageAlert] Duplicate alert suppressed:', { user_id, metric_type, threshold_percentage })
      return new Response(JSON.stringify({
        success: true,
        event_id: eventId,
        webhook_status: 'pending',
        message: 'Alert already sent within cooldown period',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sign JWT for webhook delivery
    const jwtPayload: AlertJWTPayload = {
      iss: 'raas.agencyos.network',
      aud: 'agencyos.network',
      sub: user_id,
      event_type: threshold_percentage === 100 ? 'usage.quota_exhausted' : 'usage.threshold_exceeded',
      event_id: eventId,
      metric_type,
      threshold_percentage,
      current_usage,
      quota_limit,
      license_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    }

    const jwtToken = await signJWT(jwtPayload)

    // Prepare webhook payload for AgencyOS
    const webhookPayload = {
      event_id: eventId,
      event_type: jwtPayload.event_type,
      timestamp: new Date().toISOString(),
      data: {
        user_id,
        license_id,
        customer_id,
        metric_type,
        threshold_percentage,
        current_usage,
        quota_limit,
        usage_percentage: Math.round((current_usage / quota_limit) * 100),
      },
    }

    // Insert alert event into database (pending status)
    const { data: alertRecord, error: insertError } = await supabase
      .from('alert_webhook_events')
      .insert({
        event_id: eventId,
        event_type: jwtPayload.event_type,
        user_id,
        license_id,
        customer_id: customer_id || null,
        metric_type,
        current_usage,
        quota_limit,
        threshold_percentage,
        webhook_url,
        webhook_status: 'pending',
        jwt_token: jwtToken,
        jwt_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        idempotency_key: idempotencyKey,
        metadata: {
          webhook_payload: webhookPayload,
          retry_count: 0,
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error('[UsageAlert] Failed to insert alert record:', insertError)
      return new Response(JSON.stringify({
        error: `Failed to create alert record: ${insertError.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send webhook to AgencyOS dashboard
    const webhookStatus = await sendWebhook(webhook_url, webhookPayload, jwtToken)

    // 🚨 CRITICAL: Call license-compliance-enforcer when usage >= 90%
    let complianceCheckResult: { success: boolean; license_valid: boolean; enforcement_action: string } | null = null
    if (threshold_percentage >= 90) {
      complianceCheckResult = await callLicenseComplianceEnforcer(
        supabase,
        user_id,
        license_id,
        metric_type,
        threshold_percentage,
        current_usage,
        quota_limit
      )
      console.log('[UsageAlert] License compliance check triggered:', complianceCheckResult)
    }

    // Send email notification
    let emailSent = false
    try {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', user_id)
        .single()

      if (userData?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userData.email,
            subject: getAlertSubject(threshold_percentage, metric_type),
            templateType: 'usage-alert',
            data: {
              metricName: getMetricName(metric_type),
              threshold: threshold_percentage,
              percentageUsed: Math.round((current_usage / quota_limit) * 100),
              currentUsage: current_usage,
              quotaLimit: quota_limit,
              actionUrl: '/dashboard/usage',
            },
          },
        })
        emailSent = true
        console.log('[UsageAlert] Email notification sent')
      }
    } catch (emailError) {
      console.error('[UsageAlert] Failed to send email:', emailError)
    }

    // Send SMS notification
    let smsSent = false
    try {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('id', user_id)
        .single()

      if (userData?.phone) {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: userData.phone,
            template: 'usage-alert',
            locale: 'vi',
            orgId: null,
            userId: user_id,
            templateData: {
              metric_name: getMetricName(metric_type),
              percentage: Math.round((current_usage / quota_limit) * 100).toString(),
              threshold: threshold_percentage.toString(),
              action_url: '/dashboard/usage',
            },
          },
        })
        smsSent = true
        console.log('[UsageAlert] SMS notification sent')
      }
    } catch (smsError) {
      console.error('[UsageAlert] Failed to send SMS:', smsError)
    }

    // Update alert record with delivery status
    const updateMetadata: Record<string, unknown> = {
      webhook_payload: webhookPayload,
      retry_count: 0,
    }
    if (complianceCheckResult) {
      updateMetadata.compliance_check = complianceCheckResult
    }

    const { error: updateError } = await supabase
      .from('alert_webhook_events')
      .update({
        webhook_status: webhookStatus.success ? 'sent' : 'failed',
        webhook_attempts: 1,
        last_attempt_at: new Date().toISOString(),
        response_status: webhookStatus.status,
        response_body: webhookStatus.response,
        error_message: webhookStatus.error,
        processed_at: new Date().toISOString(),
        metadata: updateMetadata,
      })
      .eq('id', alertRecord.id)

    if (updateError) {
      console.error('[UsageAlert] Failed to update alert status:', updateError)
    }

    // Return response
    const response: AlertWebhookResponse = {
      success: webhookStatus.success,
      event_id: eventId,
      webhook_status: webhookStatus.success ? 'sent' : 'failed',
      error: webhookStatus.error,
    }

    return new Response(JSON.stringify(response), {
      status: webhookStatus.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[UsageAlert] Error:', error)
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
 * Sign JWT payload using HMAC-SHA256
 */
async function signJWT(payload: AlertJWTPayload): Promise<string> {
  const secret = Deno.env.get('RAAS_JWT_SECRET')
  if (!secret) {
    throw new Error('RAAS_JWT_SECRET environment variable is required')
  }
  const encoder = new TextEncoder()

  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  // Create signature
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(`${encodedHeader}.${encodedPayload}`)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const encodedSignature = base64UrlEncode(signature)

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

/**
 * Base64URL encode for JWT
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Send webhook with retry logic
 */
async function sendWebhook(
  url: string,
  payload: unknown,
  jwtToken: string,
  maxRetries = 3
): Promise<{
  success: boolean
  status?: number
  response?: JSON
  error?: string
}> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`,
    'X-Webhook-Source': 'raas.agencyos.network',
    'X-Webhook-Event': 'usage.threshold_exceeded',
  }

  let lastError: Error | undefined
  let lastStatus: number | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      lastStatus = response.status

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}))
        console.log('[UsageAlert] Webhook delivered successfully:', { url, status: response.status })
        return {
          success: true,
          status: response.status,
          response: responseData,
        }
      }

      // Non-success response
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)

      // Don't retry on client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        break
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.warn(`[UsageAlert] Webhook attempt ${attempt}/${maxRetries} failed:`, lastError.message)
    }

    // Exponential backoff before retry (only if not last attempt)
    if (attempt < maxRetries) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, backoffMs))
    }
  }

  console.error('[UsageAlert] Webhook delivery failed after retries:', {
    url,
    attempts: maxRetries,
    lastError: lastError?.message,
    lastStatus,
  })

  return {
    success: false,
    status: lastStatus,
    error: lastError?.message || 'Webhook delivery failed',
  }
}

/**
 * 🚨 Call license-compliance-enforcer edge function
 * Triggered when usage >= 90% threshold
 */
async function callLicenseComplianceEnforcer(
  supabase: any,
  userId: string,
  licenseId: string,
  metricType: string,
  thresholdPercentage: number,
  currentUsage: number,
  quotaLimit: number
): Promise<{ success: boolean; license_valid: boolean; enforcement_action: string } | null> {
  try {
    // Get org_id from license
    const { data: licenseData } = await supabase
      .from('raas_licenses')
      .select('org_id')
      .eq('id', licenseId)
      .single()

    const orgId = licenseData?.org_id

    if (!orgId) {
      console.warn('[UsageAlert] Cannot call compliance - org_id not found')
      return null
    }

    // Get user's API key for RaaS Gateway auth
    const { data: apiKeyData } = await supabase
      .from('raas_api_keys')
      .select('key_prefix, hashed_key')
      .eq('customer_id', orgId)
      .eq('revoked', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const apiKey = apiKeyData?.hashed_key

    // Call license-compliance-enforcer edge function
    const { data: complianceData, error: complianceError } = await supabase.functions.invoke(
      'license-compliance-enforcer',
      {
        body: {
          user_id: userId,
          org_id: orgId,
          license_id: licenseId,
          check_type: 'usage_threshold' as const,
          trigger_reason: thresholdPercentage === 100 ? 'usage_100_percent' : 'usage_90_percent',
          current_usage: currentUsage,
          quota_limit: quotaLimit,
          usage_percentage: thresholdPercentage,
          api_key: apiKey,
        },
      }
    )

    if (complianceError) {
      console.error('[UsageAlert] Compliance check failed:', complianceError)
      return {
        success: false,
        license_valid: false,
        enforcement_action: 'none',
      }
    }

    return {
      success: complianceData.success,
      license_valid: complianceData.license_valid,
      enforcement_action: complianceData.enforcement_action,
    }
  } catch (error) {
    console.error('[UsageAlert] callLicenseComplianceEnforcer error:', error)
    return null
  }
}

/**
 * Get alert email subject
 */
function getAlertSubject(threshold: number, metricType: string): string {
  const metricName = getMetricName(metricType)
  if (threshold >= 125) {
    return `🚨 CRITICAL: Usage exceeded ${metricName} limit`
  } else if (threshold >= 100) {
    return `🔴 OVER LIMIT: ${metricName} quota exceeded`
  } else if (threshold >= 90) {
    return `⚠️ WARNING: ${metricName} at ${threshold}% of limit`
  }
  return `ℹ️ Usage Alert: ${metricName}`
}

/**
 * Get human-readable metric name
 */
function getMetricName(metricType: string): string {
  const metricNames: Record<string, string> = {
    'api_calls': 'API Calls',
    'ai_calls': 'AI Calls',
    'tokens': 'Tokens',
    'compute_minutes': 'Compute Minutes',
    'storage_gb': 'Storage (GB)',
    'emails': 'Emails',
    'model_inferences': 'Model Inferences',
    'agent_executions': 'Agent Executions',
  }
  return metricNames[metricType] || metricType
}
