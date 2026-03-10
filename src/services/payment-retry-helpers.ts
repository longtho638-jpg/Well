/**
 * Payment Retry Scheduler - Helper Functions
 *
 * Database operations and utility functions for payment retry scheduling.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { RetryQueueItem, StripeError } from './payment-retry-types'
import { TRANSIENT_FAILURES, PERMANENT_FAILURES } from './payment-retry-types'

/**
 * Detect failure type from Stripe error code
 */
export function detectFailureType(error: StripeError): 'transient' | 'permanent' | 'unknown' {
  const errorCode = error.code || error.decline_code || error.type || ''
  const normalizedCode = errorCode.toLowerCase()

  if (TRANSIENT_FAILURES.some(code => normalizedCode.includes(code))) {
    return 'transient'
  }

  if (PERMANENT_FAILURES.some(code => normalizedCode.includes(code))) {
    return 'permanent'
  }

  return 'unknown'
}

/**
 * Get due retries from database
 */
export async function getDueRetries(supabase: SupabaseClient, limit: number = 50): Promise<RetryQueueItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_due_payment_retries', {
      p_limit: limit,
    })

    if (error) {
      analyticsLogger.error('[PaymentRetryScheduler] Error getting due retries', error)
      return []
    }

    return (data || []).map((item: any) => mapToRetryQueueItem(item))
  } catch (error) {
    analyticsLogger.error('[PaymentRetryScheduler] getDueRetries error', error)
    return []
  }
}

/**
 * Update retry status
 */
export async function updateRetryStatus(
  supabase: SupabaseClient,
  retryId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  try {
    await supabase
      .from('payment_retry_queue')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', retryId)
  } catch (error) {
    analyticsLogger.error('[PaymentRetryScheduler] updateRetryStatus error', error)
  }
}

/**
 * Mark retry as completed
 */
export async function completeRetry(supabase: SupabaseClient, retryId: string): Promise<void> {
  try {
    await supabase
      .from('payment_retry_queue')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', retryId)
  } catch (error) {
    analyticsLogger.error('[PaymentRetryScheduler] completeRetry error', error)
  }
}

/**
 * Schedule next retry attempt
 */
export async function scheduleNextRetry(
  supabase: SupabaseClient,
  retryId: string,
  retryCount: number,
  nextRetryAt: Date
): Promise<void> {
  try {
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
    analyticsLogger.error('[PaymentRetryScheduler] scheduleNextRetry error', error)
  }
}

/**
 * Move retry to dead-letter queue
 */
export async function moveToDeadLetter(
  supabase: SupabaseClient,
  retryIdOrInvoiceId: string,
  reason: string
): Promise<void> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(retryIdOrInvoiceId)

    if (isUuid) {
      const { data: retryData } = await supabase
        .from('payment_retry_queue')
        .select('stripe_invoice_id, org_id, user_id, retry_count')
        .eq('id', retryIdOrInvoiceId)
        .single()

      if (retryData) {
        await supabase
          .from('payment_retry_dead_letter')
          .insert({
            retry_queue_id: retryIdOrInvoiceId,
            org_id: retryData.org_id,
            user_id: retryData.user_id,
            stripe_invoice_id: retryData.stripe_invoice_id,
            final_retry_count: retryData.retry_count,
            failure_reason: reason,
            requires_manual_review: true,
          })

        await supabase
          .from('payment_retry_queue')
          .update({ status: 'dead_letter' })
          .eq('id', retryIdOrInvoiceId)
      }
    } else {
      await supabase
        .from('payment_retry_dead_letter')
        .insert({
          stripe_invoice_id: retryIdOrInvoiceId,
          failure_reason: reason,
          requires_manual_review: true,
        })
    }

    analyticsLogger.warn('[PaymentRetryScheduler] Moved to dead-letter', {
      retryIdOrInvoiceId,
      reason,
    })
  } catch (error) {
    analyticsLogger.error('[PaymentRetryScheduler] moveToDeadLetter error', error)
  }
}

/**
 * Get retry history for an invoice
 */
export async function getRetryHistory(
  supabase: SupabaseClient,
  stripeInvoiceId: string
): Promise<RetryQueueItem[]> {
  try {
    const { data, error } = await supabase
      .from('payment_retry_queue')
      .select('*')
      .eq('stripe_invoice_id', stripeInvoiceId)
      .order('created_at', { ascending: false })

    if (error) {
      analyticsLogger.error('[PaymentRetryScheduler] getRetryHistory error', error)
      return []
    }

    return (data || []).map((item: any) => mapToRetryQueueItem(item))
  } catch (error) {
    analyticsLogger.error('[PaymentRetryScheduler] getRetryHistory error', error)
    return []
  }
}

/**
 * Attempt Stripe retry via Edge Function
 */
export async function attemptStripeRetry(
  supabase: SupabaseClient,
  stripeInvoiceId: string
): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('retry-stripe-invoice', {
      body: {
        invoice_id: stripeInvoiceId,
      },
    })

    if (error) {
      analyticsLogger.error('[PaymentRetryScheduler] Stripe retry failed', error)
      return { success: false }
    }

    return { success: data?.success || false }
  } catch (error) {
    analyticsLogger.error('[PaymentRetryScheduler] attemptStripeRetry error', error)
    return { success: false }
  }
}

/**
 * Map database record to RetryQueueItem
 */
function mapToRetryQueueItem(item: any): RetryQueueItem {
  return {
    id: item.id,
    orgId: item.org_id,
    userId: item.user_id,
    stripeInvoiceId: item.stripe_invoice_id,
    stripeSubscriptionId: item.stripe_subscription_id,
    amount: parseFloat(item.amount),
    failureReason: item.failure_reason,
    failureType: item.failure_type,
    retryCount: item.retry_count,
    nextRetryAt: item.next_retry_at,
    createdAt: item.created_at,
  }
}
