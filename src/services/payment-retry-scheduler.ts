/**
 * Payment Retry Scheduler
 *
 * Manages automated payment retry with exponential backoff and smart failure detection.
 * Orchestrates retry queue, dead-letter handling, and multi-channel notifications.
 *
 * Retry Schedule:
 * - Attempt 1: 1 hour delay (Email + SMS)
 * - Attempt 2: 1 day delay (Email + SMS)
 * - Attempt 3: 3 days delay (Email + SMS + Webhook)
 * - Attempt 4: 7 days delay (Final notice, Email + Webhook)
 *
 * Usage:
 *   const retryScheduler = new PaymentRetryScheduler(supabase)
 *
 *   // Schedule retry on payment failure
 *   await retryScheduler.scheduleRetry({
 *     orgId,
 *     userId,
 *     stripeInvoiceId,
 *     amount,
 *     failureReason: 'card_declined',
 *   })
 *
 *   // Process due retries (cron job)
 *   const dueRetries = await retryScheduler.getDueRetries()
 *   for (const retry of dueRetries) {
 *     await retryScheduler.processRetry(retry)
 *   }
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

export interface RetrySchedule {
  attempt: number
  delayHours: number
  channels: ('email' | 'sms' | 'webhook')[]
  template: string
}

export const RETRY_SCHEDULE: RetrySchedule[] = [
  { attempt: 1, delayHours: 1, channels: ['email', 'sms'], template: 'retry_1' },
  { attempt: 2, delayHours: 24, channels: ['email', 'sms'], template: 'retry_2' },
  { attempt: 3, delayHours: 72, channels: ['email', 'sms', 'webhook'], template: 'retry_3' },
  { attempt: 4, delayHours: 168, channels: ['email', 'webhook'], template: 'final_notice' },
]

export interface RetryQueueItem {
  id: string
  orgId: string
  userId: string | null
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  amount: number
  failureReason: string
  failureType: 'transient' | 'permanent' | 'unknown'
  retryCount: number
  nextRetryAt: string
  createdAt: string
}

export interface RetryResult {
  success: boolean
  retryId: string
  nextRetryAt?: string
  movedToDeadLetter?: boolean
  error?: string
}

export interface PaymentFailedEvent {
  orgId: string
  userId: string | null
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  amount: number
  failureReason?: string
}

export interface StripeError {
  code?: string
  decline_code?: string
  type?: string
}

// Transient failures - safe to retry
const TRANSIENT_FAILURES = [
  'card_declined',
  'insufficient_funds',
  'processing_error',
  'rate_limit',
  'try_again_later',
  'temporary_error',
]

// Permanent failures - do not retry
const PERMANENT_FAILURES = [
  'expired_card',
  'incorrect_cvc',
  'incorrect_number',
  'lost_card',
  'stolen_card',
  'authentication_required',
  'invalid_account',
  'invalid_amount',
  'invalid_cvc',
  'invalid_number',
  'invalid_expiry_year',
  'new_account_incomplete',
  'pickup_card',
]

export class PaymentRetryScheduler {
  private supabase: SupabaseClient
  private readonly MAX_RETRIES = 4

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Detect failure type from Stripe error code
   * Transient: should retry
   * Permanent: should not retry, move to dead-letter
   */
  detectFailureType(error: StripeError): 'transient' | 'permanent' | 'unknown' {
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
   * Schedule payment retry after failure
   * Creates entry in retry queue with exponential backoff
   */
  async scheduleRetry(event: PaymentFailedEvent): Promise<string> {
    const { orgId, userId, stripeInvoiceId, stripeSubscriptionId, amount, failureReason } = event

    try {
      // Detect failure type
      const failureType = this.detectFailureType({ code: failureReason })

      // Don't schedule retry for permanent failures
      if (failureType === 'permanent') {
        analyticsLogger.warn('[PaymentRetryScheduler] Skipping retry for permanent failure', {
          stripeInvoiceId,
          failureReason,
        })
        await this.moveToDeadLetter(stripeInvoiceId, `Permanent failure: ${failureReason}`)
        return stripeInvoiceId
      }

      // Calculate next retry time (1 hour from now for first attempt)
      const nextRetryAt = new Date(Date.now() + RETRY_SCHEDULE[0].delayHours * 60 * 60 * 1000)

      // Insert into retry queue
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
    } catch (error) {
      analyticsLogger.error('[PaymentRetryScheduler] scheduleRetry error', error)
      throw error
    }
  }

  /**
   * Get retries due for processing
   * Fetches pending retries where next_retry_at <= NOW()
   */
  async getDueRetries(limit: number = 50): Promise<RetryQueueItem[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_due_payment_retries', {
        p_limit: limit,
      })

      if (error) {
        analyticsLogger.error('[PaymentRetryScheduler] Error getting due retries', error)
        return []
      }

      return (data || []).map((item: any) => ({
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
      }))
    } catch (error) {
      analyticsLogger.error('[PaymentRetryScheduler] getDueRetries error', error)
      return []
    }
  }

  /**
   * Process a single retry attempt
   * Attempts to charge the payment method again
   */
  async processRetry(item: RetryQueueItem): Promise<RetryResult> {
    const { id, orgId, userId, stripeInvoiceId, stripeSubscriptionId, amount, retryCount } = item

    try {
      analyticsLogger.info('[PaymentRetryScheduler] Processing retry', {
        stripeInvoiceId,
        attempt: retryCount + 1,
      })

      // Update status to processing
      await this.updateRetryStatus(id, 'processing')

      // Attempt to retry payment via Stripe API
      // This would call Stripe's retry Invoice API
      const retryResult = await this.attemptStripeRetry(stripeInvoiceId)

      if (retryResult.success) {
        // Payment succeeded
        analyticsLogger.info('[PaymentRetryScheduler] Retry succeeded', { stripeInvoiceId })
        await this.completeRetry(id)
        return {
          success: true,
          retryId: id,
          movedToDeadLetter: false,
        }
      }

      // Payment failed again
      analyticsLogger.warn('[PaymentRetryScheduler] Retry failed', {
        stripeInvoiceId,
        retryCount,
        maxRetries: this.MAX_RETRIES,
      })

      // Check if max retries reached
      if (retryCount >= this.MAX_RETRIES - 1) {
        await this.moveToDeadLetter(id, `Max retries (${this.MAX_RETRIES}) exceeded`)
        return {
          success: false,
          retryId: id,
          movedToDeadLetter: true,
        }
      }

      // Schedule next retry with exponential backoff
      const scheduleIndex = Math.min(retryCount, RETRY_SCHEDULE.length - 1)
      const schedule = RETRY_SCHEDULE[scheduleIndex]
      const nextRetryAt = new Date(Date.now() + schedule.delayHours * 60 * 60 * 1000)

      await this.scheduleNextRetry(id, retryCount + 1, nextRetryAt)

      return {
        success: false,
        retryId: id,
        nextRetryAt: nextRetryAt.toISOString(),
        movedToDeadLetter: false,
      }
    } catch (error) {
      analyticsLogger.error('[PaymentRetryScheduler] processRetry error', error)

      // Move to dead-letter on unexpected error
      await this.moveToDeadLetter(id, `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)

      return {
        success: false,
        retryId: id,
        movedToDeadLetter: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Attempt to retry payment via Stripe API
   */
  private async attemptStripeRetry(stripeInvoiceId: string): Promise<{ success: boolean }> {
    try {
      // Call Edge Function to retry invoice via Stripe API
      const { data, error } = await this.supabase.functions.invoke('retry-stripe-invoice', {
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
   * Move retry to dead-letter queue after max failures
   */
  async moveToDeadLetter(retryIdOrInvoiceId: string, reason: string): Promise<void> {
    try {
      // Check if this is a UUID (retry ID) or string (invoice ID)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(retryIdOrInvoiceId)

      if (isUuid) {
        // Get invoice ID from retry queue
        const { data: retryData } = await this.supabase
          .from('payment_retry_queue')
          .select('stripe_invoice_id, org_id, user_id, retry_count')
          .eq('id', retryIdOrInvoiceId)
          .single()

        if (retryData) {
          // Insert into dead-letter queue
          await this.supabase
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

          // Update retry queue status
          await this.supabase
            .from('payment_retry_queue')
            .update({ status: 'dead_letter' })
            .eq('id', retryIdOrInvoiceId)
        }
      } else {
        // Direct invoice ID - create dead-letter entry
        await this.supabase
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
   * Update retry status
   */
  private async updateRetryStatus(retryId: string, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<void> {
    try {
      await this.supabase
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
   * Mark retry as completed (payment succeeded)
   */
  private async completeRetry(retryId: string): Promise<void> {
    try {
      await this.supabase
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
  private async scheduleNextRetry(
    retryId: string,
    retryCount: number,
    nextRetryAt: Date
  ): Promise<void> {
    try {
      await this.supabase
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
   * Get retry history for an invoice
   */
  async getRetryHistory(stripeInvoiceId: string): Promise<RetryQueueItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_retry_queue')
        .select('*')
        .eq('stripe_invoice_id', stripeInvoiceId)
        .order('created_at', { ascending: false })

      if (error) {
        analyticsLogger.error('[PaymentRetryScheduler] getRetryHistory error', error)
        return []
      }

      return (data || []).map((item: any) => ({
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
      }))
    } catch (error) {
      analyticsLogger.error('[PaymentRetryScheduler] getRetryHistory error', error)
      return []
    }
  }

  /**
   * Manually trigger retry (for support team)
   */
  async manualRetry(retryId: string): Promise<RetryResult> {
    try {
      // Get retry item
      const { data: item, error } = await this.supabase
        .from('payment_retry_queue')
        .select('*')
        .eq('id', retryId)
        .single()

      if (error || !item) {
        return {
          success: false,
          retryId,
          error: 'Retry not found',
        }
      }

      // Reset retry count to allow immediate retry
      await this.supabase
        .from('payment_retry_queue')
        .update({
          next_retry_at: new Date().toISOString(),
          status: 'pending',
        })
        .eq('id', retryId)

      // Process retry
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
