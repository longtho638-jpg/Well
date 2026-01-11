/**
 * Payment Gateway Types - Phase 2 Revenue Infrastructure
 * Type-safe interfaces for payment integrations
 */

// ============================================================================
// STRIPE INTEGRATION TYPES
// ============================================================================

export interface StripePaymentIntent {
    id: string;
    amount: number;
    currency: 'vnd' | 'usd';
    status: StripePaymentStatus;
    clientSecret: string;
    metadata: Record<string, string>;
    created: number;
}

export type StripePaymentStatus =
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';

export interface StripeConfig {
    publishableKey: string;
    webhookSecret: string;
    apiVersion: '2024-06-20';
}

// ============================================================================
// VNPAY GATEWAY TYPES
// ============================================================================

export interface VNPayPaymentRequest {
    orderId: string;
    amount: number;
    orderInfo: string;
    returnUrl: string;
    ipAddr: string;
    locale: 'vn' | 'en';
    bankCode?: VNPayBankCode;
}

export type VNPayBankCode =
    | 'VNPAYQR'
    | 'VNBANK'
    | 'INTCARD'
    | 'NCB'
    | 'AGRIBANK'
    | 'SCB'
    | 'SACOMBANK'
    | 'VIETCOMBANK'
    | 'VIETINBANK'
    | 'MOMO';

export interface VNPayPaymentResponse {
    vnp_ResponseCode: string;
    vnp_TransactionNo: string;
    vnp_Amount: number;
    vnp_BankCode: string;
    vnp_PayDate: string;
    vnp_TransactionStatus: '00' | '01' | '02';
}

export interface VNPayConfig {
    tmnCode: string;
    hashSecret: string;
    paymentUrl: string;
    returnUrl: string;
}

// ============================================================================
// UNIFIED PAYMENT GATEWAY INTERFACE
// ============================================================================

export interface PaymentGateway {
    name: 'stripe' | 'vnpay' | 'momo';
    createPayment: (request: PaymentRequest) => Promise<PaymentResponse>;
    verifyPayment: (transactionId: string) => Promise<PaymentVerification>;
    refund: (transactionId: string, amount?: number) => Promise<RefundResult>;
}

export interface PaymentRequest {
    orderId: string;
    amount: number;
    currency: 'VND' | 'USD';
    userId: string;
    description: string;
    metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
    success: boolean;
    transactionId: string;
    paymentUrl?: string;
    clientSecret?: string;
    error?: string;
}

export interface PaymentVerification {
    valid: boolean;
    transactionId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paidAt?: string;
}

export interface RefundResult {
    success: boolean;
    refundId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
}

// ============================================================================
// WITHDRAWAL PROCESSING TYPES
// ============================================================================

export interface WithdrawalRequest {
    userId: string;
    amount: number;
    currency: 'SHOP' | 'VND';
    bankAccount: BankAccountInfo;
    notes?: string;
}

export interface BankAccountInfo {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    branch?: string;
}

export interface WithdrawalResult {
    success: boolean;
    withdrawalId: string;
    amount: number;
    taxDeducted: number;
    netAmount: number;
    estimatedArrival: string;
    status: WithdrawalStatus;
}

export type WithdrawalStatus =
    | 'pending_approval'
    | 'processing'
    | 'completed'
    | 'rejected'
    | 'cancelled';

// ============================================================================
// GMV TRACKING TYPES
// ============================================================================

export interface GMVMetrics {
    dailyGMV: number;
    weeklyGMV: number;
    monthlyGMV: number;
    yearlyGMV: number;
    ordersCount: number;
    avgOrderValue: number;
    conversionRate: number;
}

export interface RevenueTarget {
    targetAmount: number;
    currentAmount: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    progressPercent: number;
    projectedCompletion: string;
}
