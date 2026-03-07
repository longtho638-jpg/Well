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

// ============================================================================
// STRIPE USAGE RECORD API TYPES - Usage Metering
// ============================================================================

/**
 * Stripe Price with metered billing configuration
 * Reference: https://docs.stripe.com/api/prices/object
 */
export interface StripeMeteredPrice {
    id: string;  // price_xxx
    object: 'price';
    active: boolean;
    billing_scheme: 'per_unit' | 'tiered';
    created: number;
    currency: string;
    custom_unit_amount?: {
        enabled: boolean;
        maximum?: number;
        minimum?: number;
        preset?: number;
    };
    livemode: boolean;
    lookup_key?: string;
    metadata: Record<string, string>;
    nickname?: string;
    product: string | StripeProduct;
    recurring?: {
        aggregate?: 'sum' | 'max' | 'last_during_period' | 'last_ever';
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count: number;
        usage_type: 'licensed' | 'metered';
    };
    tax_behavior: 'exclusive' | 'inclusive' | 'unspecified';
    tiers_mode?: 'graduated' | 'volume';
    transform_quantity?: {
        divide_by: number;
        round: 'down' | 'up';
    };
    type: 'one_time' | 'recurring';
    unit_amount?: number;
    unit_amount_decimal?: string;
}

/**
 * Stripe Usage Record - reports usage to Stripe for metered billing
 * Reference: https://docs.stripe.com/api/usage_records
 */
export interface StripeUsageRecord {
    id: string;  // mbur_xxx
    object: 'usage_record';
    deleted?: boolean;
    idempotency_key?: string;  // For retry support
    livemode: boolean;
    quantity: number;
    subscription_item: string;  // si_xxx
    timestamp: number;  // Unix timestamp
}

/**
 * Usage Record Create Request
 */
export interface StripeUsageRecordCreate {
    subscription_item: string;  // si_xxx - required
    quantity: number;
    timestamp?: number;  // Unix timestamp, defaults to now
    action?: 'set' | 'increment' | 'clear';  // Default: 'set'
    idempotency_key?: string;  // For retry support
}

/**
 * Stripe Usage Record Summary
 * Reference: https://docs.stripe.com/api/usage_record_summaries
 */
export interface StripeUsageRecordSummary {
    id: string;  // sub_xxx
    object: 'usage_record_summary';
    invoice: string | null;  // in_xxx or null
    invoice_item: string | null;  // ii_xxx or null
    livemode: boolean;
    period: {
        start: number;  // Unix timestamp
        end: number;  // Unix timestamp
    };
    subscription_item: string;  // si_xxx
    total_usage: number;
}

/**
 * Stripe Product for metered billing
 */
export interface StripeProduct {
    id: string;  // prod_xxx
    object: 'product';
    active: boolean;
    created: number;
    default_price?: string;
    description?: string;
    images?: string[];
    livemode: boolean;
    metadata: Record<string, string>;
    name: string;
    package_dimensions?: {
        height: number;
        length: number;
        width: number;
        weight: number;
    };
    shippable: boolean;
    statement_descriptor?: string;
    tax_code?: string;
    unit_label?: string;
    updated: number;
    url?: string;
}

/**
 * Usage Event for Stripe reporting
 */
export interface UsageEventForStripe {
    event_id: string;
    customer_id: string;
    license_id?: string;
    user_id?: string;
    feature: string;  // api_call, tokens, compute_ms, etc.
    quantity: number;
    timestamp: number;  // Unix timestamp
    metadata?: {
        stripe_event_type?: string;
        stripe_event_id?: string;
        agent_type?: string;
        model?: string;
        provider?: string;
        [key: string]: unknown;
    };
}

/**
 * Reconciliation Result - Compare Supabase vs Stripe usage
 */
export interface UsageReconciliationResult {
    period: {
        start: string;
        end: string;
    };
    supabase_total: number;
    stripe_total: number;
    difference: number;
    difference_percent: number;
    status: 'matched' | 'discrepancy';
    discrepancies: Array<{
        date: string;
        supabase_usage: number;
        stripe_usage: number;
        difference: number;
    }>;
    recommendations: string[];
}

/**
 * Stripe Usage Report Request
 */
export interface StripeUsageReportRequest {
    subscription_item_id: string;  // si_xxx
    usage_records: StripeUsageRecordCreate[];
    dry_run?: boolean;  // If true, don't actually send to Stripe
}

/**
 * Stripe Usage Report Response
 */
export interface StripeUsageReportResponse {
    success: boolean;
    records_created: number;
    records_failed: number;
    failed_records?: Array<{
        record: StripeUsageRecordCreate;
        error: string;
    }>;
    stripe_response?: any;
}
