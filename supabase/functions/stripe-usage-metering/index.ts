/**
 * Stripe Webhook Usage Metering Endpoint
 *
 * Receives Stripe events and records usage into usage_events table.
 * Validates SERVICE_ROLE_KEY authorization header.
 * Ensures idempotency via event_id (prefixed with 'stripe_').
 *
 * POST /functions/v1/stripe-usage-metering
 * Headers:
 *   Authorization: Bearer SERVICE_ROLE_KEY
 *   Content-Type: application/json
 *
 * Body (Stripe Event):
 * {
 *   id: "evt_xxx",
 *   type: "customer.subscription.created",
 *   customer: "cus_xxx",
 *   data: { object: { ... } }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   event_id: "stripe_evt_xxx",
 *   is_duplicate: false,
 *   message: "Usage recorded successfully"
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders } from '../_shared/cors.ts'

interface StripeEvent {
  id: string
  type: string
  customer?: string
  data: {
    object: Record<string, unknown>
  }
}

interface UsageMeteringResponse {
  success: boolean
  event_id: string
  is_duplicate: boolean
  message?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate SERVICE_ROLE_KEY authorization
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.substring(7)
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Parse Stripe event payload
    const body: StripeEvent = await req.json()
    const { id: stripeEventId, type, customer, data } = body

    if (!stripeEventId || !type) {
      return new Response(JSON.stringify({ error: 'Missing event id or type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique event_id with stripe_ prefix
    const eventId = `stripe_${stripeEventId}`

    // Extract customer_id from event
    const customerId = customer || (data.object.customer as string) || 'unknown'

    // Map Stripe event type to feature
    const feature = mapEventToFeature(type)

    // Default quantity is 1 per event
    const quantity = 1

    // Log incoming request
    console.warn('[StripeUsageMetering] Received event:', {
      eventId,
      type,
      customerId,
      feature,
    })

    // Step 1: Check idempotency and insert using database function
    const { data: idempotencyResult, error: idempotencyError } = await supabase
      .rpc('check_usage_event_idempotency_v2', {
        p_event_id: eventId,
        p_customer_id: customerId,
        p_feature: feature,
        p_quantity: quantity,
        p_license_id: null,
        p_user_id: null,
        p_raw_payload: data.object,
        p_metadata: {
          stripe_event_type: type,
          stripe_event_id: stripeEventId,
          customer_id: customerId,
        },
      })

    if (idempotencyError) {
      console.error('[StripeUsageMetering] Idempotency check error:', idempotencyError)
      return new Response(JSON.stringify({
        error: `Idempotency check failed: ${idempotencyError.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isDuplicate = idempotencyResult?.[0]?.is_duplicate ?? false
    const message = idempotencyResult?.[0]?.message

    if (isDuplicate) {
      console.warn('[StripeUsageMetering] Duplicate event:', eventId)
      return new Response(JSON.stringify({
        success: true,
        event_id: eventId,
        is_duplicate: true,
        message: 'Event already processed (idempotent)',
      } as UsageMeteringResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.warn('[StripeUsageMetering] Success:', { eventId, customerId, feature })

    return new Response(JSON.stringify({
      success: true,
      event_id: eventId,
      is_duplicate: false,
      message: message || 'Usage recorded successfully',
    } as UsageMeteringResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[StripeUsageMetering] Error:', error)
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
 * Map Stripe event type to usage feature
 */
function mapEventToFeature(eventType: string): string {
  // Map specific event types to features
  const featureMap: Record<string, string> = {
    'customer.subscription.created': 'api_call',
    'customer.subscription.updated': 'api_call',
    'customer.subscription.deleted': 'api_call',
    'checkout.session.completed': 'api_call',
    'invoice.payment_succeeded': 'api_call',
    'invoice.payment_failed': 'api_call',
    'payment_intent.succeeded': 'api_call',
    'payment_intent.payment_failed': 'api_call',
  }

  return featureMap[eventType] || 'api_call'
}
