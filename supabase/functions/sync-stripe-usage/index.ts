/**
 * Sync Stripe Usage - Edge Function
 *
 * Syncs overage transactions to Stripe Usage Records.
 * Called by cron job at period boundaries or manually triggered.
 *
 * POST /functions/v1/sync-stripe-usage
 * Headers:
 *   Authorization: Bearer SERVICE_ROLE_KEY
 *
 * Body (optional):
 * {
 *   org_id?: string,
 *   billing_period?: string,
 *   retry_failed?: boolean
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   synced_count: number,
 *   failed_count: number,
 *   errors?: Array<{ transaction_id: string, error: string }>
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SyncStripeUsageRequest {
  org_id?: string
  billing_period?: string
  retry_failed?: boolean
}

interface SyncStripeUsageResponse {
  success: boolean
  synced_count: number
  failed_count: number
  errors?: Array<{
    transaction_id: string
    error: string
  }>
}

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey)

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

    // Validate authorization
    const authHeader = req.headers.get('Authorization')
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

    // Parse request body
    const body: SyncStripeUsageRequest = await req.json().catch(() => ({}))
    const { org_id, billing_period, retry_failed = false } = body

    console.warn('[SyncStripeUsage] Starting sync...', {
      org_id,
      billing_period,
      retry_failed,
    })

    const result: SyncStripeUsageResponse = {
      success: true,
      synced_count: 0,
      failed_count: 0,
      errors: [],
    }

    // Get pending overage transactions
    let query = supabase
      .from('overage_transactions')
      .select('*')
      .eq('stripe_sync_status', 'pending')
      .not('stripe_subscription_item_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(100)

    if (org_id) {
      query = query.eq('org_id', org_id)
    }

    if (billing_period) {
      query = query.eq('billing_period', billing_period)
    }

    const { data: pendingOverages, error: queryError } = await query

    if (queryError) {
      console.error('[SyncStripeUsage] Error getting pending overages:', queryError)
      throw queryError
    }

    if (!pendingOverages || pendingOverages.length === 0) {
      console.warn('[SyncStripeUsage] No pending overages to sync')
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group by subscription item
    const grouped: Record<string, { totalQuantity: number; transactionIds: string[] }> = {}

    for (const tx of pendingOverages) {
      const key = tx.stripe_subscription_item_id || ''
      if (!key) continue

      if (!grouped[key]) {
        grouped[key] = { totalQuantity: 0, transactionIds: [] }
      }

      grouped[key].totalQuantity += Number(tx.overage_units)
      grouped[key].transactionIds.push(tx.id)
    }

    // Process each subscription item
    for (const [subscriptionItemId, group] of Object.entries(grouped)) {
      for (const transactionId of group.transactionIds) {
        const transaction = pendingOverages.find(t => t.id === transactionId)
        if (!transaction) continue

        // Log sync attempt
        const { data: logData } = await supabase
          .from('stripe_usage_sync_log')
          .insert({
            overage_transaction_id: transactionId,
            stripe_subscription_item_id: subscriptionItemId,
            quantity: Number(transaction.overage_units),
            sync_status: 'pending',
            idempotency_key: `sync_${transactionId}_${Date.now()}`,
          })
          .select('id')
          .single()

        // Call stripe-usage-record Edge Function
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          'stripe-usage-record',
          {
            body: {
              subscription_item_id: subscriptionItemId,
              usage_records: [
                {
                  subscription_item: subscriptionItemId,
                  quantity: Number(transaction.overage_units),
                  timestamp: Math.floor(Date.now() / 1000),
                  action: 'increment',
                },
              ],
              is_overage: true,
              overage_transaction_id: transactionId,
            },
          }
        )

        if (stripeError || !stripeData?.success) {
          console.error('[SyncStripeUsage] Failed to sync transaction:', transactionId, stripeError)

          // Update transaction as failed
          await supabase
            .from('overage_transactions')
            .update({
              stripe_sync_status: 'failed',
            })
            .eq('id', transactionId)

          // Update sync log
          if (logData?.id) {
            await supabase
              .from('stripe_usage_sync_log')
              .update({
                sync_status: 'failed',
                error_message: stripeError?.message || 'Unknown error',
                retry_count: 0,
                next_retry_at: new Date(Date.now() + 3600000).toISOString(), // Retry in 1 hour
              })
              .eq('id', logData.id)
          }

          result.failed_count++
          result.errors?.push({
            transaction_id: transactionId,
            error: stripeError?.message || 'Unknown error',
          })
          continue
        }

        // Success - update transaction
        await supabase
          .from('overage_transactions')
          .update({
            stripe_sync_status: 'synced',
            stripe_synced_at: new Date().toISOString(),
            stripe_usage_record_id: stripeData.stripe_response?.id || null,
          })
          .eq('id', transactionId)

        // Update sync log
        if (logData?.id) {
          await supabase
            .from('stripe_usage_sync_log')
            .update({
              sync_status: 'success',
              stripe_usage_record_id: stripeData.stripe_response?.id || null,
              stripe_response: stripeData,
            })
            .eq('id', logData.id)
        }

        result.synced_count++
        console.warn('[SyncStripeUsage] Synced transaction:', transactionId)
      }
    }

    // Handle retry_failed flag
    if (retry_failed) {
      console.warn('[SyncStripeUsage] Processing failed sync retries...')

      const { data: failedSynces } = await supabase
        .from('stripe_usage_sync_log')
        .select(`
          overage_transaction_id,
          stripe_subscription_item_id,
          quantity,
          retry_count
        `)
        .eq('sync_status', 'failed')
        .lte('next_retry_at', new Date().toISOString())
        .lt('retry_count', 5)
        .order('next_retry_at', { ascending: true })
        .limit(50)

      if (failedSynces && failedSynces.length > 0) {
        for (const sync of failedSynces) {
          const { data: retryData, error: retryError } = await supabase.functions.invoke(
            'stripe-usage-record',
            {
              body: {
                subscription_item_id: sync.stripe_subscription_item_id,
                usage_records: [
                  {
                    subscription_item: sync.stripe_subscription_item_id,
                    quantity: sync.quantity,
                    timestamp: Math.floor(Date.now() / 1000),
                    action: 'increment',
                  },
                ],
                is_overage: true,
                overage_transaction_id: sync.overage_transaction_id,
              },
            }
          )

          if (retryError || !retryData?.success) {
            // Update retry count
            const newRetryCount = sync.retry_count + 1
            const nextRetryAt = new Date(Date.now() + Math.pow(2, newRetryCount) * 3600000)

            await supabase
              .from('stripe_usage_sync_log')
              .update({
                retry_count: newRetryCount,
                next_retry_at: nextRetryAt.toISOString(),
                error_message: retryError?.message || 'Retry failed',
              })
              .eq('overage_transaction_id', sync.overage_transaction_id)

            result.failed_count++
          } else {
            // Success - update transaction
            await supabase
              .from('overage_transactions')
              .update({
                stripe_sync_status: 'synced',
                stripe_synced_at: new Date().toISOString(),
              })
              .eq('id', sync.overage_transaction_id)

            await supabase
              .from('stripe_usage_sync_log')
              .update({
                sync_status: 'success',
                stripe_usage_record_id: retryData.stripe_response?.id || null,
              })
              .eq('overage_transaction_id', sync.overage_transaction_id)

            result.synced_count++
          }
        }
      }
    }

    console.warn('[SyncStripeUsage] Sync complete:', {
      synced: result.synced_count,
      failed: result.failed_count,
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[SyncStripeUsage] Error:', error)

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
