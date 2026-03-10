/**
 * Payment Retry Scheduler - Type Definitions
 *
 * Type definitions for payment retry scheduling with exponential backoff.
 */

// ============================================================
// Core Interfaces
// ============================================================

export interface RetrySchedule {
  attempt: number
  delayHours: number
  channels: ('email' | 'sms' | 'webhook')[]
  template: string
}

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

// ============================================================
// Constants
// ============================================================

export const RETRY_SCHEDULE: RetrySchedule[] = [
  { attempt: 1, delayHours: 1, channels: ['email', 'sms'], template: 'retry_1' },
  { attempt: 2, delayHours: 24, channels: ['email', 'sms'], template: 'retry_2' },
  { attempt: 3, delayHours: 72, channels: ['email', 'sms', 'webhook'], template: 'retry_3' },
  { attempt: 4, delayHours: 168, channels: ['email', 'webhook'], template: 'final_notice' },
]

// Transient failures - safe to retry
export const TRANSIENT_FAILURES = [
  'card_declined',
  'insufficient_funds',
  'processing_error',
  'rate_limit',
  'try_again_later',
  'temporary_error',
]

// Permanent failures - do not retry
export const PERMANENT_FAILURES = [
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
