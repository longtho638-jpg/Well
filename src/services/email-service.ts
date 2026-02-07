/**
 * Email Service
 * Wrapper for sending transactional emails via Supabase Edge Functions
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  templateType: string;
  data: any;
}

/**
 * Send email via Supabase Edge Function
 */
async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      uiLogger.error('Email sending failed', error);
      return false;
    }

    uiLogger.info('Email sent successfully', { emailId: data?.id });
    return true;
  } catch (error) {
    uiLogger.error('Email service error', error);
    return false;
  }
}

export const emailService = {
  /**
   * Send withdrawal approved email
   */
  async sendWithdrawalApprovedEmail(
    userEmail: string,
    userName: string,
    amount: number,
    requestId: string,
    bankName: string,
    accountNumber: string
  ): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

    return sendEmail({
      to: userEmail,
      subject: '✅ Yêu cầu rút tiền đã được duyệt - WellNexus',
      templateType: 'withdrawal-approved',
      data: {
        userName,
        amount: formattedAmount,
        requestId: requestId.slice(0, 8), // Short ID for display
        bankName,
        accountNumber,
        estimatedArrival: '1-3 ngày làm việc',
      },
    });
  },

  /**
   * Send withdrawal rejected email
   */
  async sendWithdrawalRejectedEmail(
    userEmail: string,
    userName: string,
    amount: number,
    requestId: string,
    rejectionReason: string,
    currentBalance: number
  ): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

    const formattedBalance = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(currentBalance);

    return sendEmail({
      to: userEmail,
      subject: '⚠️ Thông báo về yêu cầu rút tiền - WellNexus',
      templateType: 'withdrawal-rejected',
      data: {
        userName,
        amount: formattedAmount,
        requestId: requestId.slice(0, 8),
        rejectionReason,
        currentBalance: formattedBalance,
      },
    });
  },

  /**
   * Send withdrawal pending email
   */
  async sendWithdrawalPendingEmail(
    userEmail: string,
    userName: string,
    amount: number,
    requestId: string,
    bankName: string,
    accountNumber: string
  ): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

    return sendEmail({
      to: userEmail,
      subject: '⏳ Yêu cầu rút tiền đang được xử lý - WellNexus',
      templateType: 'withdrawal-pending',
      data: {
        userName,
        amount: formattedAmount,
        requestId: requestId.slice(0, 8),
        bankName,
        accountNumber,
        estimatedReviewTime: '24-48 giờ',
      },
    });
  },
};

export default emailService;
