/**
 * Email Service — Canonical Unified Module
 * Client-side trigger for sending transactional emails via Supabase Edge Function.
 * Provides type-safe methods for all email types.
 */

import { supabase } from '../lib/supabase';
import type {
  SendEmailRequest,
  SendEmailResponse,
  WelcomeEmailData,
  OrderConfirmationEmailData,
  CommissionEarnedEmailData,
  RankUpgradeEmailData,
} from '../types/email-service-type-definitions';

// ─── Core ────────────────────────────────────────────────────────

/**
 * Send email via Supabase Edge Function
 */
export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: request,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }

    return data as SendEmailResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Welcome / Order / Commission / Rank ─────────────────────────

export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `🎉 Chào mừng đến với WellNexus - ${data.userName}!`,
    templateType: 'welcome',
    data,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderConfirmationEmailData
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `✅ Đơn hàng #${data.orderId} đã được xác nhận!`,
    templateType: 'order-confirmation',
    data,
  });
}

export async function sendCommissionEarnedEmail(
  to: string,
  data: CommissionEarnedEmailData
): Promise<SendEmailResponse> {
  const emoji = data.commissionType === 'direct' ? '💰' : '🎁';
  const type = data.commissionType === 'direct' ? 'Hoa hồng bán hàng' : 'Thưởng F1';

  return sendEmail({
    to,
    subject: `${emoji} ${type}: ${data.commissionAmount}`,
    templateType: 'commission-earned',
    data,
  });
}

export async function sendRankUpgradeEmail(
  to: string,
  data: RankUpgradeEmailData
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `🎉 Chúc mừng! Bạn đã thăng hạng lên ${data.newRank}!`,
    templateType: 'rank-upgrade',
    data,
  });
}

// ─── Withdrawal Emails ───────────────────────────────────────────

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

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
  });
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
  });
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
  });
}

// ─── Billing / Dunning Emails ────────────────────────────────────

export async function sendPaymentFailedEmail(
  to: string,
  userName: string,
  amount: number,
  subscriptionPlan: string,
  nextRetryDays: number
): Promise<SendEmailResponse> {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);

  return sendEmail({
    to,
    subject: `⚠️ Thanh toán thất bại - ${subscriptionPlan}`,
    templateType: 'payment-failed',
    data: {
      userName,
      subscriptionPlan,
      amount: formattedAmount,
      nextRetryDays: nextRetryDays.toString(),
    },
  });
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
  });
}

export async function sendSubscriptionRenewalEmail(
  to: string,
  userName: string,
  subscriptionPlan: string,
  renewalDate: string,
  amount: number
): Promise<SendEmailResponse> {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);

  return sendEmail({
    to,
    subject: `📅 Subscription sắp gia hạn - ${subscriptionPlan}`,
    templateType: 'subscription-renewal',
    data: {
      userName,
      subscriptionPlan,
      renewalDate,
      amount: formattedAmount,
    },
  });
}

export async function sendOverageNotificationEmail(
  to: string,
  userName: string,
  subscriptionPlan: string,
  usageThisPeriod: number,
  planLimit: number,
  overageAmount: number
): Promise<SendEmailResponse> {
  const formattedOverage = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD'
  }).format(overageAmount);

  return sendEmail({
    to,
    subject: `📊 Thông báo usage vượt mức - ${subscriptionPlan}`,
    templateType: 'overage-notification',
    data: {
      userName,
      subscriptionPlan,
      usageThisPeriod: usageThisPeriod.toLocaleString(),
      planLimit: planLimit.toLocaleString(),
      overageAmount: formattedOverage,
    },
  });
}

// ─── Unified Export ──────────────────────────────────────────────

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
  // Billing emails
  sendPaymentFailed: sendPaymentFailedEmail,
  sendPaymentFailedEmail,
  sendPaymentRetry: sendPaymentRetryEmail,
  sendPaymentRetryEmail,
  sendSubscriptionRenewal: sendSubscriptionRenewalEmail,
  sendSubscriptionRenewalEmail,
  sendOverageNotification: sendOverageNotificationEmail,
  sendOverageNotificationEmail,
};

export default emailService;
