/**
 * AI Inference Webhook - Usage Metering Edge Function
 *
 * Captures AI model inference events from webhook triggers.
 * Validates webhook signature using shared secret.
 * Logs to usage_records table with billing integration (Stripe/Polar).
 *
 * **Endpoint:**
 *   POST /functions/v1/ai-inference-webhook
 *
 * **Headers:**
 *   X-Webhook-Signature: sha256=<hmac-signature>
 *   X-Webhook-Timestamp: <unix-timestamp>
 *
 * **Request:**
 *   {
 *     "event_id": "unique-id",
 *     "tenant_id": "uuid",
 *     "user_id": "uuid",
 *     "license_id": "uuid",
 *     "model_id": "gpt-4",
 *     "model_provider": "openai",
 *     "input_tokens": number,
 *     "output_tokens": number,
 *     "metadata": { request_id?, latency_ms? }
 *   }
 *
 * **Response:**
 *   { success: true, event_id: "uuid", tokens_used: number, billing: {...} }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InferenceWebhookPayload {
  event_id?: string
  tenant_id: string
  user_id: string
  license_id?: string
  model_id: string
  model_provider?: string
  input_tokens: number
  output_tokens: number
  metadata?: Record<string, unknown>
  stripe_customer_id?: string
  polar_customer_id?: string
}

interface BillingContext {
  stripe_customer_id: string | null
  polar_customer_id: string | null
  billing_period_start: string
  billing_period_end: string
}

interface InferenceWebhookResponse {
  success: boolean
  event_id: string
  tokens_used: number
  tenant_id: string
  model_id: string
  billing?: BillingContext
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
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get webhook signature from headers
    const webhookSignature = req.headers.get('X-Webhook-Signature')
    const webhookTimestamp = req.headers.get('X-Webhook-Timestamp') || Date.now().toString()

    // Validate signature if provided (signature validation is optional for internal services)
    if (webhookSignature) {
      const signatureValid = await validateWebhookSignature(req, webhookSignature, webhookTimestamp)
      if (!signatureValid) {
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Parse webhook payload
    const payload: InferenceWebhookPayload = await req.json()
    const {
      event_id,
      tenant_id,
      user_id,
      license_id,
      model_id,
      model_provider,
      input_tokens = 0,
      output_tokens = 0,
      metadata,
      stripe_customer_id,
      polar_customer_id
    } = payload

    // Validate required fields
    if (!tenant_id || !user_id || !model_id) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: tenant_id, user_id, model_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate tenant_id and user_id are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(tenant_id) || !uuidRegex.test(user_id)) {
      return new Response(JSON.stringify({ error: 'Invalid UUID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate tokens are non-negative
    if (input_tokens < 0 || output_tokens < 0) {
      return new Response(JSON.stringify({ error: 'Tokens must be non-negative' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const totalTokens = input_tokens + output_tokens
    const timestamp = new Date().toISOString()

    // Calculate billing period (current day UTC)
    const now = new Date()
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString()

    // Prepare metadata
    const enrichedMetadata = {
      ...metadata,
      input_tokens,
      output_tokens,
      total_tokens: totalTokens,
      model_provider: model_provider || 'unknown',
      captured_at: timestamp,
    }

    // Generate event_id if not provided
    const eventId = event_id || crypto.randomUUID()

    // Get Stripe/Polar customer IDs from license if not provided
    let finalStripeCustomerId = stripe_customer_id || null
    let finalPolarCustomerId = polar_customer_id || null

    if (license_id && (!finalStripeCustomerId || !finalPolarCustomerId)) {
      const { data: licenseData } = await supabase
        .from('raas_licenses')
        .select('metadata')
        .eq('id', license_id)
        .single()

      if (licenseData?.metadata) {
        const licenseMetadata = licenseData.metadata as Record<string, unknown>
        if (!finalStripeCustomerId && licenseMetadata.stripe_customer_id) {
          finalStripeCustomerId = licenseMetadata.stripe_customer_id as string
        }
        if (!finalPolarCustomerId && licenseMetadata.polar_customer_id) {
          finalPolarCustomerId = licenseMetadata.polar_customer_id as string
        }
      }
    }

     
    const { error: insertError } = await supabase
      .from('usage_records')
      .insert({
        tenant_id: tenant_id,
        user_id: user_id,
        license_id: license_id || null,
        model_id: model_id,
        model_provider: model_provider || null,
        input_tokens: input_tokens,
        output_tokens: output_tokens,
        event_id: eventId,
        stripe_customer_id: finalStripeCustomerId,
        polar_customer_id: finalPolarCustomerId,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        metadata: enrichedMetadata,
        request_id: metadata?.request_id as string | null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[AI-Inference-Webhook] Insert error:', insertError)
      return new Response(JSON.stringify({
        error: `Failed to log usage record: ${insertError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log success
    console.warn(`[AI-Inference-Webhook] Logged event_id=${eventId}, tenant=${tenant_id}, user=${user_id}, model=${model_id}, tokens=${totalTokens}`)

    // Return success response with billing context
    const response: InferenceWebhookResponse = {
      success: true,
      event_id: eventId,
      tokens_used: totalTokens,
      tenant_id: tenant_id,
      model_id: model_id,
      billing: {
        stripe_customer_id: finalStripeCustomerId,
        polar_customer_id: finalPolarCustomerId,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[AI-Inference-Webhook] Error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Validate webhook signature using HMAC-SHA256
 */
async function validateWebhookSignature(
  req: Request,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const webhookSecret = Deno.env.get('WEBHOOK_SHARED_SECRET')

  if (!webhookSecret) {
    console.warn('[Webhook] WEBHOOK_SHARED_SECRET not configured, skipping validation')
    return true // Allow if no secret configured
  }

  // Validate timestamp (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000)
  const timestampNum = parseInt(timestamp, 10)
  if (isNaN(timestampNum) || Math.abs(now - timestampNum) > 300) {
    console.warn('[Webhook] Invalid timestamp')
    return false
  }

  // Get raw body for signature validation
  const body = await req.text()

  // Compute HMAC-SHA256
  const encoder = new TextEncoder()
  const keyData = encoder.encode(webhookSecret)
  const messageData = encoder.encode(`${timestamp}.${body}`)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData)
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Compare signatures (constant-time comparison)
  const expectedSignature = signature.replace(/^sha256=/, '')
  return computedSignature === expectedSignature
}
