/**
 * Email Service - Withdrawal and Billing Emails
 *
 * Specialized email functions for withdrawal and billing workflows.
 */

import type { SendEmailResponse } from '../types/email-service-type-definitions'
import { sendEmail } from './email-service-core'

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD' }).format(amount)
}

// Withdrawal emails
export async function sendWithdrawalApprovedEmail(
  userEmail: string,
  userName: string,
  amount: number,
  requestId: string,
  bankName: string,
  accountNumber: string
): Promise<SendEmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: '✅ Yêu cầu rút tiền đã được duyệt - WellNexus',
    templateType: 'withdrawal-approved',
    data: {
      userName,
      amount: formatVND(amount),
      requestId: requestId.slice(0, 8),
      bankName,
      accountNumber,
      estimatedArrival: '1-3 ngày làm việc',
    },
  })
}

export async function sendWithdrawalRejectedEmail(
  userEmail: string,
  userName: string,
  amount: number,
  requestId: string,
  rejectionReason: string,
  currentBalance: number
): Promise<SendEmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: '⚠️ Thông báo về yêu cầu rút tiền - WellNexus',
    templateType: 'withdrawal-rejected',
    data: {
      userName,
      amount: formatVND(amount),
      requestId: requestId.slice(0, 8),
      rejectionReason,
      currentBalance: formatVND(currentBalance),
    },
  })
}

export async function sendWithdrawalPendingEmail(
  userEmail: string,
  userName: string,
  amount: number,
  requestId: string,
  bankName: string,
  accountNumber: string
): Promise<SendEmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: '⏳ Yêu cầu rút tiền đang được xử lý - WellNexus',
    templateType: 'withdrawal-pending',
    data: {
      userName,
      amount: formatVND(amount),
      requestId: requestId.slice(0, 8),
      bankName,
      accountNumber,
      estimatedReviewTime: '24-48 giờ',
    },
  })
}

// Billing/Dunning emails
export async function sendPaymentFailedEmail(
  to: string,
  userName: string,
  amount: number,
  subscriptionPlan: string,
  nextRetryDays: number
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `⚠️ Thanh toán thất bại - ${subscriptionPlan}`,
    templateType: 'payment-failed',
    data: {
      userName,
      subscriptionPlan,
      amount: formatUSD(amount),
      nextRetryDays: nextRetryDays.toString(),
    },
  })
}

export async function sendPaymentRetryEmail(
  to: string,
  userName: string,
  subscriptionPlan: string,
  retryCount: number
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `🔄 Thử thanh toán lần ${retryCount} - ${subscriptionPlan}`,
    templateType: 'payment-retry',
    data: {
      userName,
      subscriptionPlan,
      retryCount: retryCount.toString(),
    },
  })
}

export async function sendSubscriptionRenewalEmail(
  to: string,
  userName: string,
  subscriptionPlan: string,
  renewalDate: string,
  amount: number
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `📅 Subscription sắp gia hạn - ${subscriptionPlan}`,
    templateType: 'subscription-renewal',
    data: {
      userName,
      subscriptionPlan,
      renewalDate,
      amount: formatUSD(amount),
    },
  })
}

export async function sendOverageNotificationEmail(
  to: string,
  userName: string,
  subscriptionPlan: string,
  usageThisPeriod: number,
  planLimit: number,
  overageAmount: number
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `📊 Thông báo usage vượt mức - ${subscriptionPlan}`,
    templateType: 'overage-notification',
    data: {
      userName,
      subscriptionPlan,
      usageThisPeriod: usageThisPeriod.toLocaleString(),
      planLimit: planLimit.toLocaleString(),
      overageAmount: formatUSD(overageAmount),
    },
  })
}
