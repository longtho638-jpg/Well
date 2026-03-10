/**
 * Email Service — Canonical Unified Module
 * Client-side trigger for sending transactional emails via Supabase Edge Function.
 * Provides type-safe methods for all email types.
 */

// Import all functions
import {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendCommissionEarnedEmail,
  sendRankUpgradeEmail,
} from './email-service-core'
import {
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
  sendWithdrawalPendingEmail,
  sendPaymentFailedEmail,
  sendPaymentRetryEmail,
  sendSubscriptionRenewalEmail,
  sendOverageNotificationEmail,
} from './email-service-billing'

// Re-export types
export type {
  SendEmailRequest,
  SendEmailResponse,
  WelcomeEmailData,
  OrderConfirmationEmailData,
  CommissionEarnedEmailData,
  RankUpgradeEmailData,
} from '../types/email-service-type-definitions'

// Unified Export
export const emailService = {
  send: sendEmail,
  sendWelcome: sendWelcomeEmail,
  sendWelcomeEmail,
  sendOrderConfirmation: sendOrderConfirmationEmail,
  sendOrderConfirmationEmail,
  sendCommissionEarned: sendCommissionEarnedEmail,
  sendCommissionEarnedEmail,
  sendRankUpgrade: sendRankUpgradeEmail,
  sendRankUpgradeEmail,
  sendWithdrawalApproved: sendWithdrawalApprovedEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejected: sendWithdrawalRejectedEmail,
  sendWithdrawalRejectedEmail,
  sendWithdrawalPending: sendWithdrawalPendingEmail,
  sendWithdrawalPendingEmail,
  sendPaymentFailed: sendPaymentFailedEmail,
  sendPaymentFailedEmail,
  sendPaymentRetry: sendPaymentRetryEmail,
  sendPaymentRetryEmail,
  sendSubscriptionRenewal: sendSubscriptionRenewalEmail,
  sendSubscriptionRenewalEmail,
  sendOverageNotification: sendOverageNotificationEmail,
  sendOverageNotificationEmail,
}

export default emailService
