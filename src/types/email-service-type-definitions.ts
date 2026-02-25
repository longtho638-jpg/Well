/**
 * Email Service Type Definitions
 * Defines interfaces for email templates and email service methods
 */

export type EmailTemplateType =
  | 'welcome'
  | 'order-confirmation'
  | 'commission-earned'
  | 'rank-upgrade'
  | 'withdrawal-approved'
  | 'withdrawal-rejected'
  | 'withdrawal-pending';

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  sponsorName?: string;
}

export interface OrderConfirmationEmailData {
  userName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  shippingAddress?: string;
  trackingNumber?: string;
}

export interface CommissionEarnedEmailData {
  userName: string;
  commissionAmount: string;
  commissionType: 'direct' | 'sponsor';
  orderId?: string;
  fromUserName?: string;
  currentBalance: string;
  commissionRate: string;
}

export interface RankUpgradeEmailData {
  userName: string;
  oldRank: string;
  newRank: string;
  newRankId: number;
  achievementDate: string;
  newCommissionRate: string;
  newBenefits: string[];
  lifetimeSales?: string;
  teamVolume?: string;
}

export interface WithdrawalEmailData {
  userName: string;
  amount: string;
  requestId: string;
  bankName?: string;
  accountNumber?: string;
  estimatedArrival?: string;
  estimatedReviewTime?: string;
  rejectionReason?: string;
  currentBalance?: string;
}

export type EmailData =
  | WelcomeEmailData
  | OrderConfirmationEmailData
  | CommissionEarnedEmailData
  | RankUpgradeEmailData
  | WithdrawalEmailData;

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  templateType?: EmailTemplateType;
  data?: EmailData;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}
