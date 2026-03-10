/**
 * Email Service - Core Module
 *
 * Core email sending function and basic email types.
 */

import { supabase } from '../lib/supabase'
import type {
  SendEmailRequest,
  SendEmailResponse,
  WelcomeEmailData,
  OrderConfirmationEmailData,
  CommissionEarnedEmailData,
  RankUpgradeEmailData,
} from '../types/email-service-type-definitions'

/**
 * Send email via Supabase Edge Function
 */
export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: request,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      }
    }

    return data as SendEmailResponse
  } catch (_err) {
    return {
      success: false,
      error: 'Unknown error',
    }
  }
}

// Basic email functions
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject: `🎉 Chào mừng đến với WellNexus - ${data.userName}!`,
    templateType: 'welcome',
    data,
  })
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
  })
}

export async function sendCommissionEarnedEmail(
  to: string,
  data: CommissionEarnedEmailData
): Promise<SendEmailResponse> {
  const emoji = data.commissionType === 'direct' ? '💰' : '🎁'
  const type = data.commissionType === 'direct' ? 'Hoa hồng bán hàng' : 'Thưởng F1'

  return sendEmail({
    to,
    subject: `${emoji} ${type}: ${data.commissionAmount}`,
    templateType: 'commission-earned',
    data,
  })
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
  })
}
