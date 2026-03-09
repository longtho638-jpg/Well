/**
 * Edge Function: Process Payment Retry
 *
 * Processes failed payment retries from the dunning queue.
 * Called by cron job every hour to retry failed payments with exponential backoff.
 *
 * **Endpoint:**
 *   POST /functions/v1/process-payment-retry
 *
 * **Request:**
 *   {
 *     "limit": 50,  // Max retries to process per run
 *     "dry_run": false
 *   }
 *
 * **Response:**
 *   {
 *     "success": true,
 *     "processed": 10,
 *     "succeeded": 6,
 *     "failed": 4,
 *     "dead_letter": 2
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

interface RetryRequest {
  limit?: number
  dry_run?: boolean
}

interface RetryResult {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  dead_letter: number
  errors?: string[]
}

interface RetryQueueItem {
  id: string
  org_id: string
  user_id: string | null
  stripe_invoice_id: string
  stripe_subscription_id: string | null
  amount: number
  failure_reason: string
  failure_type: 'transient' | 'permanent' | 'unknown'
  retry_count: number
  next_retry_at: string
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

    // Parse request
    const payload: RetryRequest = await req.json()
    const { limit = 50, dry_run = false } = payload

    console.log('[process-payment-retry] Starting retry processing', {
      limit,
      dry_run,
    })

    // Get due retries from queue
    const { data: dueRetries, error: fetchError } = await supabase.rpc('get_due_payment_retries', {
      p_limit: limit,
    })

    if (fetchError) {
      throw new Error(`Failed to fetch retries: ${fetchError.message}`)
    }

    if (!dueRetries || dueRetries.length === 0) {
      console.log('[process-payment-retry] No retries to process')
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        dead_letter: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result: RetryResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      dead_letter: 0,
      errors: [],
    }

    // Process each retry
    for (const item of dueRetries) {
      const retryResult = await processRetryItem(supabase, item, dry_run)

      result.processed++
      if (retryResult === 'success') {
        result.succeeded++
      } else if (retryResult === 'dead_letter') {
        result.dead_letter++
        result.failed++
      } else {
        result.failed++
      }
    }

    console.log('[process-payment-retry] Processing complete', result)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[process-payment-retry] Error:', error)
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
 * Process a single retry item
 */
async function processRetryItem(
  supabase: any,
  item: RetryQueueItem,
  dryRun: boolean
): Promise<'success' | 'retry' | 'dead_letter'> {
  const { id, stripe_invoice_id, retry_count, failure_type, amount } = item

  console.log('[process-payment-retry] Processing retry', {
    invoiceId: stripe_invoice_id,
    retryCount: retry_count,
    failureType: failure_type,
  })

  // Skip permanent failures - move directly to dead letter
  if (failure_type === 'permanent') {
    console.warn('[process-payment-retry] Skipping permanent failure', {
      invoiceId: stripe_invoice_id,
    })
    await moveToDeadLetter(supabase, id, 'Permanent failure')
    return 'dead_letter'
  }

  // Dry run - don't actually charge
  if (dryRun) {
    console.log('[process-payment-retry] Dry run - skipping actual charge', {
      invoiceId: stripe_invoice_id,
    })
    return 'retry'
  }

  try {
    // Attempt to charge the invoice via Stripe API
    const chargeResult = await retryStripeInvoice(stripe_invoice_id)

    if (chargeResult.success) {
      console.log('[process-payment-retry] Retry succeeded', {
        invoiceId: stripe_invoice_id,
        amount,
      })

      // Update retry queue
      await supabase
        .from('payment_retry_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)

      // Log successful payment
      await logPaymentEvent(supabase, {
        invoice_id: stripe_invoice_id,
        event_type: 'payment_retry_success',
        amount,
      })

      return 'success'
    }

    // Payment failed again
    console.warn('[process-payment-retry] Retry failed', {
      invoiceId: stripe_invoice_id,
      error: chargeResult.error,
    })

    // Check if max retries reached
    if (retry_count >= 4) {
      console.warn('[process-payment-retry] Max retries exceeded', {
        invoiceId: stripe_invoice_id,
      })
      await moveToDeadLetter(supabase, id, `Max retries exceeded: ${chargeResult.error}`)
      return 'dead_letter'
    }

    // Schedule next retry with exponential backoff
    const nextRetryDelay = getNextRetryDelay(retry_count)
    await scheduleNextRetry(supabase, id, retry_count + 1, nextRetryDelay)

    return 'retry'

  } catch (error) {
    console.error('[process-payment-retry] Unexpected error', {
      invoiceId: stripe_invoice_id,
      error,
    })

    // Move to dead letter on unexpected error
    await moveToDeadLetter(supabase, id, `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return 'dead_letter'
  }
}

/**
 * Retry Stripe invoice charge
 */
async function retryStripeInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true }
    }

    const errorData = await response.json()
    const errorCode = errorData.error?.code || 'unknown_error'

    // Don't retry permanent failures
    const permanentFailures = ['card_declined', 'incorrect_cvc', 'expired_card', 'lost_card', 'stolen_card']
    if (permanentFailures.includes(errorCode)) {
      return { success: false, error: `Permanent failure: ${errorCode}` }
    }

    return { success: false, error: errorCode }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Move retry to dead letter queue
 */
async function moveToDeadLetter(supabase: any, retryId: string, reason: string): Promise<void> {
  try {
    // Get retry item details
    const { data: retryData } = await supabase
      .from('payment_retry_queue')
      .select('stripe_invoice_id, org_id, user_id, retry_count')
      .eq('id', retryId)
      .single()

    if (retryData) {
      // Insert into dead letter queue
      await supabase
        .from('payment_retry_dead_letter')
        .insert({
          retry_queue_id: retryId,
          org_id: retryData.org_id,
          user_id: retryData.user_id,
          stripe_invoice_id: retryData.stripe_invoice_id,
          final_retry_count: retryData.retry_count,
          failure_reason: reason,
          requires_manual_review: true,
        })

      // Update retry queue status
      await supabase
        .from('payment_retry_queue')
        .update({ status: 'dead_letter' })
        .eq('id', retryId)
    }
  } catch (error) {
    console.error('[process-payment-retry] moveToDeadLetter error', error)
  }
}

/**
 * Schedule next retry
 */
async function scheduleNextRetry(
  supabase: any,
  retryId: string,
  retryCount: number,
  delayHours: number
): Promise<void> {
  try {
    const nextRetryAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

    await supabase
      .from('payment_retry_queue')
      .update({
        retry_count: retryCount,
        next_retry_at: nextRetryAt.toISOString(),
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', retryId)
  } catch (error) {
    console.error('[process-payment-retry] scheduleNextRetry error', error)
  }
}

/**
 * Get next retry delay based on retry count (exponential backoff)
 */
function getNextRetryDelay(retryCount: number): number {
  // Retry schedule: 1h, 1d, 3d, 7d
  const delays = [1, 24, 72, 168]
  return delays[Math.min(retryCount, delays.length - 1)]
}

/**
 * Log payment event for audit trail
 */
async function logPaymentEvent(
  supabase: any,
  params: {
    invoice_id: string
    event_type: string
    amount: number
  }
): Promise<void> {
  try {
    await supabase
      .from('payment_retry_audit_log')
      .insert({
        stripe_invoice_id: params.invoice_id,
        event_type: params.event_type,
        amount: params.amount,
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('[process-payment-retry] logPaymentEvent error', error)
  }
}
