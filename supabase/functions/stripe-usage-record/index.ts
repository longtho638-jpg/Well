/**
 * Stripe Usage Record API - Report Usage to Stripe
 *
 * Reports usage records to Stripe Usage Record API for metered billing.
 * Supports idempotent retries via idempotency_key.
 * Logs all submissions to stripe_usage_audit_log for auditability.
 *
 * POST /functions/v1/stripe-usage-record
 * Headers:
 *   Authorization: Bearer SERVICE_ROLE_KEY
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   subscription_item_id: "si_xxx",
 *   usage_records: [
 *     {
 *       subscription_item: "si_xxx",
 *       quantity: 1000,
 *       timestamp: 1234567890,
 *       action: "increment",
 *       idempotency_key: "unique-key-for-retry"
 *     }
 *   ],
 *   dry_run?: true  // Don't actually send to Stripe
 * }
 *
 * Response:
 * {
 *   success: true,
 *   records_created: 10,
 *   records_failed: 0,
 *   failed_records?: [...]
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface StripeUsageRecordCreate {
  subscription_item: string
  quantity: number
  timestamp?: number
  action?: 'set' | 'increment' | 'clear'
  idempotency_key?: string
}

interface UsageReportRequest {
  subscription_item_id: string
  usage_records: StripeUsageRecordCreate[]
  dry_run?: boolean
  price_id?: string  // Stripe Price ID from env vars
  feature?: string   // Feature name for mapping
}

interface DetailedUsageReportResponse {
  success: boolean
  records_created: number
  records_failed: number
  audit_log_ids: string[]
  failed_records?: Array<{
    record: StripeUsageRecordCreate
    error: string
    audit_log_id?: string
  }>
  stripe_response?: any
}

// Stripe Price ID mapping from environment variables
const STRIPE_PRICE_IDS: Record<string, string> = {
  'api_call': Deno.env.get('STRIPE_PRICE_ID_API_CALLS') || '',
  'tokens': Deno.env.get('STRIPE_PRICE_ID_TOKENS') || '',
  'model_inference': Deno.env.get('STRIPE_PRICE_ID_INFERENCES') || '',
  'agent_execution': Deno.env.get('STRIPE_PRICE_ID_AGENTS') || '',
  'compute_ms': Deno.env.get('STRIPE_PRICE_ID_COMPUTE') || '',
}

// Helper: Generate unique idempotency key with UUID component
function generateIdempotencyKey(record: StripeUsageRecordCreate): string {
  if (record.idempotency_key && record.idempotency_key.length > 8) {
    return record.idempotency_key  // Use provided key if sufficiently long
  }

  // Generate unique key: usage_{subscription_item}_{timestamp}_{random}
  const randomPart = Math.random().toString(36).substring(2, 10)
  const timestamp = record.timestamp || Math.floor(Date.now() / 1000)
  return `usage_${record.subscription_item}_${timestamp}_${record.quantity}_${randomPart}`
}

// Helper: Create usage record with exponential backoff retry
async function createUsageRecordWithRetry(
  subscriptionItem: string,
  quantity: number,
  timestamp: number,
  action: string,
  idempotencyKey: string,
  stripeApiKey: string,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string }> {
  const stripeBaseUrl = Deno.env.get('STRIPE_BASE_URL') || 'https://api.stripe.com/v1'

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `${stripeBaseUrl}/subscription_items/${subscriptionItem}/usage_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeApiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': idempotencyKey,
          },
          body: new URLSearchParams({
            quantity: String(quantity),
            timestamp: String(timestamp),
            action: action || 'set',
          }),
        }
      )

      if (response.ok) {
        return { success: true, data: await response.json() }
      }

      const errorData = await response.text()

      // Retry only on 5xx server errors or rate limiting (429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000  // Exponential backoff with jitter
          console.warn(`[StripeUsageRecord] Retry ${attempt}/${maxRetries} after ${delayMs}ms`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue
        }
      }

      // Don't retry on 4xx client errors
      return { success: false, error: `Stripe API error (${response.status}): ${errorData}` }

    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
      // Network error - retry with backoff
      const delayMs = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return { success: false, error: 'Max retries exceeded' }
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

    // Initialize Supabase client for audit logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Parse request body
    const body: UsageReportRequest = await req.json()
    const { subscription_item_id, usage_records, dry_run = false, price_id, feature } = body

    if (!subscription_item_id) {
      return new Response(JSON.stringify({ error: 'Missing subscription_item_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!usage_records || !Array.isArray(usage_records) || usage_records.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or empty usage_records' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine price ID: from request > from feature mapping > from env default
    const effectivePriceId = price_id ||
      (feature ? STRIPE_PRICE_IDS[feature] : '') ||
      Deno.env.get('STRIPE_PRICE_ID_DEFAULT') ||
      ''

    if (!effectivePriceId) {
      console.error('[StripeUsageRecord] No Price ID configured for feature:', feature)
      return new Response(JSON.stringify({
        error: 'No Price ID configured. Set STRIPE_PRICE_ID_DEFAULT or provide price_id in request'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.warn('[StripeUsageRecord] Request:', {
      subscription_item_id,
      records_count: usage_records.length,
      dry_run,
      feature,
      price_id: effectivePriceId,
    })

    // Dry run - don't actually call Stripe API
    if (dry_run) {
      console.warn('[StripeUsageRecord] Dry run - skipping Stripe API call')
      return new Response(JSON.stringify({
        success: true,
        records_created: usage_records.length,
        records_failed: 0,
        audit_log_ids: [],
        stripe_response: { dry_run: true, records: usage_records },
      } as DetailedUsageReportResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call Stripe Usage Record API
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeApiKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Process each usage record with audit logging
    const results: DetailedUsageReportResponse = {
      success: true,
      records_created: 0,
      records_failed: 0,
      audit_log_ids: [],
      failed_records: [],
    }

    for (const record of usage_records) {
      let auditLogId: string | null = null

      try {
        // Step 1: Generate idempotency key
        const idempotencyKey = generateIdempotencyKey(record)

        // Step 2: Log to audit table BEFORE calling Stripe
        const { data: auditData, error: auditError } = await supabase
          .rpc('log_stripe_usage_submission', {
            p_event_id: idempotencyKey,
            p_subscription_item_id: record.subscription_item,
            p_price_id: effectivePriceId,
            p_quantity: record.quantity,
            p_action: record.action || 'set',
            p_timestamp: record.timestamp || Math.floor(Date.now() / 1000),
            p_idempotency_key: idempotencyKey,
            p_metadata: {
              feature: feature || null,
              requested_at: new Date().toISOString(),
            },
          })

        if (auditError) {
          console.error('[StripeUsageRecord] Audit log error:', auditError)
          // Continue anyway - don't fail usage reporting due to audit log failure
        } else {
          auditLogId = auditData
          results.audit_log_ids.push(auditLogId)
        }

        // Step 3: Call Stripe API with retry logic
        const stripeResult = await createUsageRecordWithRetry(
          record.subscription_item,
          record.quantity,
          record.timestamp || Math.floor(Date.now() / 1000),
          record.action || 'set',
          idempotencyKey,
          stripeApiKey,
          3  // maxRetries
        )

        if (!stripeResult.success) {
          throw new Error(stripeResult.error)
        }

        const usageRecord = stripeResult.data
        console.warn('[StripeUsageRecord] Created:', usageRecord.id)

        // Step 4: Update audit log with success
        if (auditLogId) {
          await supabase.rpc('update_stripe_submission_result', {
            p_audit_id: auditLogId,
            p_status: 'success',
            p_stripe_response: usageRecord,
            p_stripe_usage_record_id: usageRecord.id,
          })
        }

        results.records_created++

      } catch (error) {
        console.error('[StripeUsageRecord] Failed to create record:', error)
        results.records_failed++

        const errorResult = {
          record,
          error: error instanceof Error ? error.message : 'Unknown error',
          audit_log_id: auditLogId || undefined,
        }
        results.failed_records?.push(errorResult)
        results.success = false

        // Step 3b: Update audit log with failure
        if (auditLogId) {
          await supabase.rpc('update_stripe_submission_result', {
            p_audit_id: auditLogId,
            p_status: 'failed',
            p_stripe_response: null,
            p_stripe_usage_record_id: null,
            p_error_message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    console.warn('[StripeUsageRecord] Results:', {
      created: results.records_created,
      failed: results.records_failed,
      audit_logged: results.audit_log_ids.length,
    })

    const statusCode = results.success ? 200 : 207  // 207 = Partial Success
    return new Response(JSON.stringify(results), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[StripeUsageRecord] Error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
