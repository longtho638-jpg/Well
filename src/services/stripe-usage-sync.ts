/**
 * Stripe Usage Sync Service - Phase 7
 *
 * Syncs overage transactions to Stripe Usage Records at period boundaries.
 */

import {
  getPendingOveragesForSync,
  groupBySubscriptionItem,
  reportOverageToStripe,
  logStripeUsageSync,
  updateOverageTransactionSyncStatus,
  getFailedSyncesForRetry,
} from './stripe-usage-sync-helpers'

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

      await logStripeUsageSync(transactionId, subscriptionItemId, transaction.overage_units, 'pending')

      const stripeResult = await reportOverageToStripe(
        subscriptionItemId,
        transaction.overage_units,
        transactionId
      )

      if (stripeResult.success && stripeResult.usageRecordId) {
        await updateOverageTransactionSyncStatus(transactionId, 'synced', {
          stripeUsageRecordId: stripeResult.usageRecordId,
          stripeSyncedAt: new Date(),
        })
        results.syncedCount++
      } else {
        await updateOverageTransactionSyncStatus(transactionId, 'failed', {
          errorMessage: stripeResult.error,
        })

        const retryCount = 0
        const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 3600000)

        await logStripeUsageSync(
          transactionId,
          subscriptionItemId,
          transaction.overage_units,
          'failed',
          { errorMessage: stripeResult.error, retryCount, nextRetryAt }
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
      await updateOverageTransactionSyncStatus(sync.overage_transaction_id, 'synced', {
        stripeSyncedAt: new Date(),
      })
      results.syncedCount++
    } else {
      const newRetryCount = sync.retry_count + 1
      const nextRetryAt = new Date(Date.now() + Math.pow(2, newRetryCount) * 3600000)

      await import('@/lib/supabase').then(({ supabase }) =>
        supabase
          .from('stripe_usage_sync_log')
          .update({
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt.toISOString(),
            error_message: stripeResult.error,
          })
          .eq('overage_transaction_id', sync.overage_transaction_id)
      )

      results.failedCount++
      results.errors?.push({
        transactionId: sync.overage_transaction_id,
        error: stripeResult.error || 'Unknown error',
      })
    }
  }

  return results
}

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

export default stripeUsageSync
