/**
 * Polar Overage Client - Phase 6
 *
 * Client library for reporting overage usage to Polar.sh
 * and syncing overage transactions.
 *
 * Usage:
 *   import { reportOverageToPolar, syncOverageTransaction } from '@/lib/polar-overage-client'
 *
 *   // Report overage after calculation
 *   const result = await reportOverageToPolar(transactionId)
 *
 *   // Manual sync
 *   const syncResult = await syncOverageTransaction(transactionId)
 */

import { supabase } from '@/lib/supabase'

export interface PolarOveragePayload {
  organization_id: string
  subscription_id: string
  billing_period: {
    start: string
    end: string
  }
  usage: Record<string, number>
  calculated_cost: number
  overage_transaction_id: string
  customer_id?: string
  license_id?: string
}

export interface PolarOverageResult {
  success: boolean
  polarTransactionId?: string
  error?: string
}

/**
 * Report overage to Polar.sh via Edge Function
 */
export async function reportOverageToPolar(
  transactionId: string
): Promise<PolarOverageResult> {
  try {
    // Step 1: Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('overage_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      return { success: false, error: 'Transaction not found' }
    }

    // Step 2: Get Polar customer ID from license
    const { data: license } = await supabase
      .from('raas_licenses')
      .select('metadata, user_id')
      .eq('id', transaction.license_id)
      .single()

    const polarCustomerId = license?.metadata?.polar_customer_id

    if (!polarCustomerId) {
      return {
        success: false,
        error: 'No Polar customer ID found. Customer must have active subscription.'
      }
    }

    // Step 3: Build Polar overage payload
    const billingPeriodStart = `${transaction.billing_period}-01T00:00:00Z`
    const billingPeriodEnd = new Date(
      new Date(`${transaction.billing_period}-01`).setMonth(
        new Date(`${transaction.billing_period}-01`).getMonth() + 1
      )
    ).toISOString()

    const payload: PolarOveragePayload = {
      organization_id: transaction.org_id,
      subscription_id: transaction.license_id || '',
      billing_period: {
        start: billingPeriodStart,
        end: billingPeriodEnd,
      },
      usage: {
        [transaction.metric_type]: transaction.overage_units,
      },
      calculated_cost: transaction.total_cost,
      overage_transaction_id: transactionId,
      customer_id: polarCustomerId,
      license_id: transaction.license_id || undefined,
    }

    // Step 4: Call Polar overage webhook
    const { data, error: webhookError } = await supabase.functions.invoke(
      'polar-webhook',
      {
        body: {
          type: 'usage.billing_sync',
          data: payload,
        },
      }
    )

    if (webhookError) {
      console.error('[reportOverageToPolar] Webhook error:', webhookError)
      return { success: false, error: webhookError.message }
    }

    console.log('[reportOverageToPolar] Overage reported to Polar:', transactionId)
    return {
      success: true,
      polarTransactionId: data?.polar_transaction_id,
    }
  } catch (err) {
    console.error('[reportOverageToPolar] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Sync overage transaction to Polar (manual trigger)
 */
export async function syncOverageTransaction(
  transactionId: string
): Promise<PolarOverageResult> {
  try {
    // Check current sync status
    const { data: transaction } = await supabase
      .from('overage_transactions')
      .select('stripe_sync_status, polar_synced_at')
      .eq('id', transactionId)
      .single()

    if (transaction?.stripe_sync_status === 'synced' && transaction.polar_synced_at) {
      console.log('[syncOverageTransaction] Already synced:', transactionId)
      return { success: true }
    }

    // Trigger sync
    return await reportOverageToPolar(transactionId)
  } catch (err) {
    console.error('[syncOverageTransaction] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get Polar customer ID for user/org
 */
export async function getPolarCustomerId(
  userId: string,
  orgId?: string
): Promise<string | null> {
  try {
    // Try to get from org subscription
    if (orgId) {
      const { data: orgSub } = await supabase
        .from('user_subscriptions')
        .select('metadata')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .single()

      if (orgSub?.metadata?.polar_customer_id) {
        return orgSub.metadata.polar_customer_id
      }
    }

    // Fallback to user subscription
    const { data: userSub } = await supabase
      .from('user_subscriptions')
      .select('metadata')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return userSub?.metadata?.polar_customer_id || null
  } catch (err) {
    console.error('[getPolarCustomerId] Error:', err)
    return null
  }
}

/**
 * Batch sync overage transactions for billing period
 */
export async function batchSyncOverages(
  orgId: string,
  billingPeriod: string
): Promise<{ synced: number; failed: number; errors: string[] }> {
  try {
    // Get all pending transactions for period
    const { data: transactions } = await supabase
      .from('overage_transactions')
      .select('id')
      .eq('org_id', orgId)
      .eq('billing_period', billingPeriod)
      .in('stripe_sync_status', ['pending', 'failed'])

    if (!transactions || transactions.length === 0) {
      return { synced: 0, failed: 0, errors: [] }
    }

    let synced = 0
    let failed = 0
    const errors: string[] = []

    for (const tx of transactions) {
      const result = await syncOverageTransaction(tx.id)
      if (result.success) {
        synced++
      } else {
        failed++
        errors.push(`${tx.id}: ${result.error}`)
      }
    }

    return { synced, failed, errors }
  } catch (err) {
    console.error('[batchSyncOverages] Error:', err)
    return { synced: 0, failed: 0, errors: ['Batch sync failed: ' + err] }
  }
}

export const polarOverageClient = {
  reportOverageToPolar,
  syncOverageTransaction,
  getPolarCustomerId,
  batchSyncOverages,
}

export default polarOverageClient
