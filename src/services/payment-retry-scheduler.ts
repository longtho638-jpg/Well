/**
 * Payment Retry Scheduler - Automated retry with exponential backoff
 * Retry: 1h → 1d → 3d → 7d (max 4 attempts)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { RetryQueueItem, RetryResult, PaymentFailedEvent } from './payment-retry-types'
import { RETRY_SCHEDULE } from './payment-retry-types'
import {
  detectFailureType,
  getDueRetries,
  updateRetryStatus,
  completeRetry,
  scheduleNextRetry,
  moveToDeadLetter,
  getRetryHistory,
  attemptStripeRetry,
} from './payment-retry-helpers'

export class PaymentRetryScheduler {
  private supabase: SupabaseClient
  private readonly MAX_RETRIES = 4

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async scheduleRetry(event: PaymentFailedEvent): Promise<string> {
    const { orgId, userId, stripeInvoiceId, stripeSubscriptionId, amount, failureReason } = event

    const failureType = detectFailureType({ code: failureReason })

    if (failureType === 'permanent') {
      analyticsLogger.warn('[PaymentRetryScheduler] Skipping retry for permanent failure', {
        stripeInvoiceId,
        failureReason,
      })
      await moveToDeadLetter(this.supabase, stripeInvoiceId, `Permanent failure: ${failureReason}`)
      return stripeInvoiceId
    }

    const nextRetryAt = new Date(Date.now() + RETRY_SCHEDULE[0].delayHours * 60 * 60 * 1000)

    const { data, error } = await this.supabase.rpc('create_payment_retry', {
      p_org_id: orgId,
      p_user_id: userId,
      p_stripe_invoice_id: stripeInvoiceId,
      p_stripe_subscription_id: stripeSubscriptionId,
      p_amount: amount,
      p_failure_reason: failureReason,
      p_failure_type: failureType,
      p_next_retry_at: nextRetryAt.toISOString(),
    })

    if (error) {
      analyticsLogger.error('[PaymentRetryScheduler] Error scheduling retry', error)
      throw error
    }

    analyticsLogger.info('[PaymentRetryScheduler] Scheduled retry', {
      stripeInvoiceId,
      retryCount: 0,
      nextRetryAt,
      failureType,
    })

    return data
  }

  async getDueRetries(limit: number = 50): Promise<RetryQueueItem[]> {
    return getDueRetries(this.supabase, limit)
  }

  async processRetry(item: RetryQueueItem): Promise<RetryResult> {
    const { id, stripeInvoiceId, retryCount } = item

    try {
      analyticsLogger.info('[PaymentRetryScheduler] Processing retry', {
        stripeInvoiceId,
        attempt: retryCount + 1,
      })

      await updateRetryStatus(this.supabase, id, 'processing')

      const retryResult = await attemptStripeRetry(this.supabase, stripeInvoiceId)

      if (retryResult.success) {
        analyticsLogger.info('[PaymentRetryScheduler] Retry succeeded', { stripeInvoiceId })
        await completeRetry(this.supabase, id)
        return { success: true, retryId: id, movedToDeadLetter: false }
      }

      analyticsLogger.warn('[PaymentRetryScheduler] Retry failed', {
        stripeInvoiceId,
        retryCount,
        maxRetries: this.MAX_RETRIES,
      })

      if (retryCount >= this.MAX_RETRIES - 1) {
        await moveToDeadLetter(this.supabase, id, `Max retries (${this.MAX_RETRIES}) exceeded`)
        return { success: false, retryId: id, movedToDeadLetter: true }
      }

      const scheduleIndex = Math.min(retryCount, RETRY_SCHEDULE.length - 1)
      const schedule = RETRY_SCHEDULE[scheduleIndex]
      const nextRetryAt = new Date(Date.now() + schedule.delayHours * 60 * 60 * 1000)

      await scheduleNextRetry(this.supabase, id, retryCount + 1, nextRetryAt)

      return {
        success: false,
        retryId: id,
        nextRetryAt: nextRetryAt.toISOString(),
        movedToDeadLetter: false,
      }
    } catch (error) {
      analyticsLogger.error('[PaymentRetryScheduler] processRetry error', error)

      await moveToDeadLetter(
        this.supabase,
        id,
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`
      )

      return {
        success: false,
        retryId: id,
        movedToDeadLetter: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async moveToDeadLetter(retryIdOrInvoiceId: string, reason: string): Promise<void> {
    await moveToDeadLetter(this.supabase, retryIdOrInvoiceId, reason)
  }

  async getRetryHistory(stripeInvoiceId: string): Promise<RetryQueueItem[]> {
    return getRetryHistory(this.supabase, stripeInvoiceId)
  }

  async manualRetry(retryId: string): Promise<RetryResult> {
    try {
      const { data: item, error } = await this.supabase
        .from('payment_retry_queue')
        .select('*')
        .eq('id', retryId)
        .single()

      if (error || !item) {
        return { success: false, retryId, error: 'Retry not found' }
      }

      await this.supabase
        .from('payment_retry_queue')
        .update({
          next_retry_at: new Date().toISOString(),
          status: 'pending',
        })
        .eq('id', retryId)

      return await this.processRetry({
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
      })
    } catch (error) {
      analyticsLogger.error('[PaymentRetryScheduler] manualRetry error', error)
      return {
        success: false,
        retryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export default PaymentRetryScheduler
