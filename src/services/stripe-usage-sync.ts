/**
 * Stripe Usage Sync Service - Phase 7
 *
 * Syncs overage transactions to Stripe Usage Records at period boundaries.
 * Handles retry logic with exponential backoff for failed syncs.
 */

import { supabase } from '@/lib/supabase'
import type { StripeUsageSyncRequest, StripeUsageSyncResult } from '@/types/overage'

/**
 * Get pending overage transactions ready for Stripe sync
 */
export async function getPendingOveragesForSync(
  orgId?: string,
  billingPeriod?: string
): Promise<Array<{
  id: string
  org_id: string
  metric_type: string
  billing_period: string
  overage_units: number
  rate_per_unit: number
  total_cost: number
  stripe_subscription_item_id: string | null
}>> {
  try {
    let query = supabase
      .from('overage_transactions')
      .select('*')
      .eq('stripe_sync_status', 'pending')
      .not('stripe_subscription_item_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(100)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    if (billingPeriod) {
      query = query.eq('billing_period', billingPeriod)
    }

    const { data, error } = await query

    if (error) {
      console.error('[StripeUsageSync] Error getting pending overages:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[StripeUsageSync] Error:', err)
    return []
  }
}

/**
 * Group overage transactions by subscription item for batch sync
 */
export function groupBySubscriptionItem(
  transactions: Array<{
    id: string
    metric_type: string
    overage_units: number
    stripe_subscription_item_id: string | null
  }>
): Record<string, { totalQuantity: number; transactionIds: string[] }> {
  const grouped: Record<string, { totalQuantity: number; transactionIds: string[] }> = {}

  for (const tx of transactions) {
    const key = tx.stripe_subscription_item_id || ''
    if (!key) continue

    if (!grouped[key]) {
      grouped[key] = { totalQuantity: 0, transactionIds: [] }
    }

    grouped[key].totalQuantity += tx.overage_units
    grouped[key].transactionIds.push(tx.id)
  }

  return grouped
}

/**
 * Report overage usage to Stripe via Edge Function
 */
export async function reportOverageToStripe(
  subscriptionItemId: string,
  quantity: number,
  overageTransactionId: string
): Promise<{ success: boolean; usageRecordId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-usage-record', {
      body: {
        subscription_item_id: subscriptionItemId,
        usage_records: [
          {
            subscription_item: subscriptionItemId,
            quantity,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'increment',
          },
        ],
        is_overage: true,
        overage_transaction_id: overageTransactionId,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.success && data.records_created > 0) {
      return {
        success: true,
        usageRecordId: data.stripe_response?.id,
      }
    }

    return { success: false, error: 'No records created' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Log stripe usage sync attempt
 */
export async function logStripeUsageSync(
  overageTransactionId: string,
  subscriptionItemId: string,
  quantity: number,
  status: 'pending' | 'success' | 'failed',
  options?: {
    usageRecordId?: string
    errorMessage?: string
    retryCount?: number
    nextRetryAt?: Date
    stripeResponse?: Record<string, unknown>
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('stripe_usage_sync_log')
      .insert({
        overage_transaction_id: overageTransactionId,
        stripe_subscription_item_id: subscriptionItemId,
        quantity,
        sync_status: status,
        stripe_usage_record_id: options?.usageRecordId || null,
        error_message: options?.errorMessage || null,
        retry_count: options?.retryCount || 0,
        next_retry_at: options?.nextRetryAt?.toISOString() || null,
        stripe_response: options?.stripeResponse || null,
        idempotency_key: `sync_${overageTransactionId}_${Date.now()}`,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[StripeUsageSync] Error logging sync:', error)
      return null
    }

    return data.id
  } catch (err) {
    console.error('[StripeUsageSync] Error:', err)
    return null
  }
}

/**
 * Update overage transaction after sync
 */
export async function updateOverageTransactionSyncStatus(
  transactionId: string,
  status: 'synced' | 'failed',
  options?: {
    stripeUsageRecordId?: string
    stripeSyncedAt?: Date
    errorMessage?: string
  }
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      stripe_sync_status: status,
    }

    if (options?.stripeUsageRecordId) {
      updateData.stripe_usage_record_id = options.stripeUsageRecordId
    }

    if (options?.stripeSyncedAt) {
      updateData.stripe_synced_at = options.stripeSyncedAt.toISOString()
    }

    const { error } = await supabase
      .from('overage_transactions')
      .update(updateData)
      .eq('id', transactionId)

    if (error) {
      console.error('[StripeUsageSync] Error updating transaction:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[StripeUsageSync] Error:', err)
    return false
  }
}

/**
 * Sync all pending overages to Stripe
 */
export async function syncPendingOverages(): Promise<StripeUsageSyncResult> {
  const pendingOverages = await getPendingOveragesForSync()

  if (pendingOverages.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 }
  }

  const grouped = groupBySubscriptionItem(pendingOverages)

  const results: StripeUsageSyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  }

  for (const [subscriptionItemId, group] of Object.entries(grouped)) {
    for (const transactionId of group.transactionIds) {
      const transaction = pendingOverages.find(t => t.id === transactionId)
      if (!transaction) continue

      // Log sync attempt
      await logStripeUsageSync(
        transactionId,
        subscriptionItemId,
        transaction.overage_units,
        'pending'
      )

      // Report to Stripe
      const stripeResult = await reportOverageToStripe(
        subscriptionItemId,
        transaction.overage_units,
        transactionId
      )

      if (stripeResult.success && stripeResult.usageRecordId) {
        // Update transaction as synced
        await updateOverageTransactionSyncStatus(transactionId, 'synced', {
          stripeUsageRecordId: stripeResult.usageRecordId,
          stripeSyncedAt: new Date(),
        })

        results.syncedCount++
      } else {
        // Update transaction as failed
        await updateOverageTransactionSyncStatus(transactionId, 'failed', {
          errorMessage: stripeResult.error,
        })

        // Schedule retry with exponential backoff
        const retryCount = 0 // Would fetch from sync_log in real impl
        const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 3600000)

        await logStripeUsageSync(
          transactionId,
          subscriptionItemId,
          transaction.overage_units,
          'failed',
          {
            errorMessage: stripeResult.error,
            retryCount,
            nextRetryAt,
          }
        )

        results.failedCount++
        results.errors?.push({
          transactionId,
          error: stripeResult.error || 'Unknown error',
        })
      }
    }
  }

  return results
}

/**
 * Get failed syncs that need retry
 */
export async function getFailedSyncesForRetry(): Promise<Array<{
  overage_transaction_id: string
  stripe_subscription_item_id: string
  quantity: number
  retry_count: number
}>> {
  try {
    const { data, error } = await supabase
      .from('stripe_usage_sync_log')
      .select(`
        overage_transaction_id,
        stripe_subscription_item_id,
        quantity,
        retry_count,
        next_retry_at
      `)
      .eq('sync_status', 'failed')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 5) // Max 5 retries
      .order('next_retry_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[StripeUsageSync] Error getting failed syncs:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[StripeUsageSync] Error:', err)
    return []
  }
}

/**
 * Retry failed syncs
 */
export async function retryFailedSynces(): Promise<StripeUsageSyncResult> {
  const failedSynces = await getFailedSyncesForRetry()

  if (failedSynces.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 }
  }

  const results: StripeUsageSyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  }

  for (const sync of failedSynces) {
    const stripeResult = await reportOverageToStripe(
      sync.stripe_subscription_item_id,
      sync.quantity,
      sync.overage_transaction_id
    )

    if (stripeResult.success) {
      await updateOverageTransactionSyncStatus(
        sync.overage_transaction_id,
        'synced',
        { stripeSyncedAt: new Date() }
      )
      results.syncedCount++
    } else {
      // Update retry count
      const newRetryCount = sync.retry_count + 1
      const nextRetryAt = new Date(Date.now() + Math.pow(2, newRetryCount) * 3600000)

      await supabase
        .from('stripe_usage_sync_log')
        .update({
          retry_count: newRetryCount,
          next_retry_at: nextRetryAt.toISOString(),
          error_message: stripeResult.error,
        })
        .eq('overage_transaction_id', sync.overage_transaction_id)

      results.failedCount++
      results.errors?.push({
        transactionId: sync.overage_transaction_id,
        error: stripeResult.error || 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Stripe Usage Sync Service
 */
export const stripeUsageSync = {
  getPendingOveragesForSync,
  groupBySubscriptionItem,
  reportOverageToStripe,
  logStripeUsageSync,
  updateOverageTransactionSyncStatus,
  syncPendingOverages,
  getFailedSyncesForRetry,
  retryFailedSynces,
}
