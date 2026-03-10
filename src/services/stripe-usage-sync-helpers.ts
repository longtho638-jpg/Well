/**
 * Stripe Usage Sync - Helper Functions
 *
 * Helper functions for Stripe overage usage sync.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type { PendingOverage, SyncLogOptions, TransactionSyncOptions } from './stripe-usage-sync-types'

export async function getPendingOveragesForSync(
  orgId?: string,
  billingPeriod?: string
): Promise<PendingOverage[]> {
  try {
    let query = supabase
      .from('overage_transactions')
      .select('*')
      .eq('stripe_sync_status', 'pending')
      .not('stripe_subscription_item_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(100)

    if (orgId) query = query.eq('org_id', orgId)
    if (billingPeriod) query = query.eq('billing_period', billingPeriod)

    const { data, error } = await query

    if (error) {
      analyticsLogger.error('[StripeUsageSync] Error getting pending overages:', error)
      return []
    }

    return data || []
  } catch (err) {
    analyticsLogger.error('[StripeUsageSync] Error:', err)
    return []
  }
}

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

export async function reportOverageToStripe(
  subscriptionItemId: string,
  quantity: number,
  overageTransactionId: string
): Promise<{ success: boolean; usageRecordId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-usage-record', {
      body: {
        subscription_item_id: subscriptionItemId,
        usage_records: [{
          subscription_item: subscriptionItemId,
          quantity,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        }],
        is_overage: true,
        overage_transaction_id: overageTransactionId,
      },
    })

    if (error) return { success: false, error: error.message }
    if (data.success && data.records_created > 0) {
      return { success: true, usageRecordId: data.stripe_response?.id }
    }

    return { success: false, error: 'No records created' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function logStripeUsageSync(
  overageTransactionId: string,
  subscriptionItemId: string,
  quantity: number,
  status: 'pending' | 'success' | 'failed',
  options?: SyncLogOptions
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
      analyticsLogger.error('[StripeUsageSync] Error logging sync:', error)
      return null
    }

    return data.id
  } catch (err) {
    analyticsLogger.error('[StripeUsageSync] Error:', err)
    return null
  }
}

export async function updateOverageTransactionSyncStatus(
  transactionId: string,
  status: 'synced' | 'failed',
  options?: TransactionSyncOptions
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = { stripe_sync_status: status }

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
      analyticsLogger.error('[StripeUsageSync] Error updating transaction:', error)
      return false
    }

    return true
  } catch (err) {
    analyticsLogger.error('[StripeUsageSync] Error:', err)
    return false
  }
}

export async function getFailedSyncesForRetry(): Promise<Array<{
  overage_transaction_id: string
  stripe_subscription_item_id: string
  quantity: number
  retry_count: number
}>> {
  try {
    const { data, error } = await supabase
      .from('stripe_usage_sync_log')
      .select(`overage_transaction_id, stripe_subscription_item_id, quantity, retry_count, next_retry_at`)
      .eq('sync_status', 'failed')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 5)
      .order('next_retry_at', { ascending: true })
      .limit(50)

    if (error) {
      analyticsLogger.error('[StripeUsageSync] Error getting failed syncs:', error)
      return []
    }

    return data || []
  } catch (err) {
    analyticsLogger.error('[StripeUsageSync] Error:', err)
    return []
  }
}
