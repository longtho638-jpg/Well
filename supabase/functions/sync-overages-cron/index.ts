/**
 * Sync Overages Cron Job - Supabase Edge Function
 *
 * Runs daily to sync pending overage transactions to Stripe Usage Records.
 * Handles retry logic with exponential backoff for failed syncs.
 *
 * Scheduled via pg_cron: 0 2 * * * (daily at 2 AM UTC)
 *
 * Response: { success: boolean, syncedCount: number, failedCount: number, errors?: array }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors?: Array<{ transactionId: string; error: string }>
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('[SyncOverages] Starting cron job...')

    // Step 1: Get pending overages ready for sync
    const { data: pendingOverages, error: fetchError } = await supabase
      .from('overage_transactions')
      .select('*')
      .eq('stripe_sync_status', 'pending')
      .not('stripe_subscription_item_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      console.error('[SyncOverages] Failed to fetch pending overages:', fetchError)
      throw fetchError
    }

    if (!pendingOverages || pendingOverages.length === 0) {
      console.log('[SyncOverages] No pending overages to sync')
      return new Response(JSON.stringify({
        success: true,
        syncedCount: 0,
        failedCount: 0,
        message: 'No pending overages',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[SyncOverages] Found ${pendingOverages.length} pending overages`)

    // Step 2: Group by subscription item for batch sync
    const grouped: Record<string, string[]> = {}
    const overageMap: Record<string, any> = {}

    for (const overage of pendingOverages) {
      const key = overage.stripe_subscription_item_id
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(overage.id)
      overageMap[overage.id] = overage
    }

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    // Step 3: Sync each group to Stripe
    for (const [subscriptionItemId, transactionIds] of Object.entries(grouped)) {
      // Aggregate total quantity for this subscription item
      let totalQuantity = 0
      for (const txId of transactionIds) {
        totalQuantity += overageMap[txId].overage_units
      }

      // Report to Stripe
      try {
        const stripeResponse = await fetch('https://api.stripe.com/v1/usage_records', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            subscription_item: subscriptionItemId,
            quantity: String(totalQuantity),
            timestamp: String(Math.floor(Date.now() / 1000)),
            action: 'increment',
          }),
        })

        if (!stripeResponse.ok) {
          const errorData = await stripeResponse.json()
          throw new Error(errorData.error?.message || 'Stripe API error')
        }

        const usageRecord = await stripeResponse.json()

        // Update all transactions in this group as synced
        for (const txId of transactionIds) {
          await supabase
            .from('overage_transactions')
            .update({
              stripe_sync_status: 'synced',
              stripe_usage_record_id: usageRecord.id,
              stripe_synced_at: new Date().toISOString(),
            })
            .eq('id', txId)

          // Log successful sync
          await supabase
            .from('stripe_usage_sync_log')
            .insert({
              overage_transaction_id: txId,
              stripe_subscription_item_id: subscriptionItemId,
              stripe_usage_record_id: usageRecord.id,
              quantity: overageMap[txId].overage_units,
              sync_status: 'success',
              timestamp: Math.floor(Date.now() / 1000),
              action: 'increment',
              idempotency_key: `sync_${txId}_${Date.now()}`,
              stripe_response: usageRecord,
            })
        }

        result.syncedCount += transactionIds.length
        console.log(`[SyncOverages] Synced ${transactionIds.length} transactions for ${subscriptionItemId}`)

      } catch (stripeError) {
        console.error('[SyncOverages] Failed to sync to Stripe:', stripeError)

        // Update all transactions in this group as failed
        for (const txId of transactionIds) {
          const overage = overageMap[txId]
          const retryCount = (overage.metadata?.retry_count || 0) + 1
          const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 3600000) // Exponential backoff

          await supabase
            .from('overage_transactions')
            .update({
              stripe_sync_status: 'failed',
              metadata: {
                ...(overage.metadata || {}),
                retry_count: retryCount,
                last_error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
              },
            })
            .eq('id', txId)

          // Log failed sync with retry schedule
          await supabase
            .from('stripe_usage_sync_log')
            .insert({
              overage_transaction_id: txId,
              stripe_subscription_item_id: subscriptionItemId,
              quantity: overage.overage_units,
              sync_status: 'failed',
              timestamp: Math.floor(Date.now() / 1000),
              action: 'increment',
              error_message: stripeError instanceof Error ? stripeError.message : 'Unknown error',
              retry_count: retryCount,
              next_retry_at: nextRetryAt.toISOString(),
              idempotency_key: `sync_${txId}_${Date.now()}`,
            })
        }

        result.failedCount += transactionIds.length
        result.errors?.push({
          subscriptionItemId,
          error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        })
      }
    }

    console.log(`[SyncOverages] Completed: ${result.syncedCount} synced, ${result.failedCount} failed`)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[SyncOverages] Error:', error)

    return new Response(JSON.stringify({
      success: false,
      syncedCount: 0,
      failedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
