/**
 * Dunning Service Types
 *
 * Shared type definitions for dunning payment recovery system.
 */

export interface DunningEvent {
  id: string
  orgId: string
  userId: string | null
  subscriptionId: string | null
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  amountOwed: number
  currency: string
  attemptCount: number
  dunningStage: 'initial' | 'reminder' | 'final' | 'cancel_notice'
  daysSinceFailure: number
  emailSent: boolean
  emailTemplate: string | null
  emailSentAt: string | null
  emailOpened: boolean
  emailClicked: boolean
  paymentUrl: string | null
  paymentLinkExpiresAt: string | null
  resolved: boolean
  resolvedAt: string | null
  resolutionMethod: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface DunningConfig {
  id: string
  orgId: string
  enabled: boolean
  maxRetryDays: number
  retryIntervalDays: number
  gracePeriodDays: number
  autoSendEmails: boolean
  emailSequence: Array<{
    stage: string
    day: number
    template: string
  }>
  autoSuspend: boolean
  suspendAfterDays: number
  createdAt: string
  updatedAt: string
}

export interface PaymentFailedEvent {
  orgId: string
  userId: string | null
  subscriptionId: string | null
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  amount: number
  currency?: string
  paymentUrl?: string | null
}

export interface DunningEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export interface DunningResolutionResult {
  success: boolean
  dunningId: string
  subscriptionStatus?: string
  error?: string
}

export interface FailedWebhookRecord {
  id: string
  webhookId: string
  eventType: string
  payload: Record<string, unknown>
  errorMessage: string
  retryCount: number
}

export type DunningStage = 'initial' | 'reminder' | 'final' | 'cancel_notice'

export type ResolutionMethod = 'payment_success' | 'manual_override' | 'subscription_canceled'
