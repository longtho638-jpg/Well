/**
 * Payment Gateway Types - Phase 2 Revenue Infrastructure
 * Part 1: Core payment types and interfaces
 */

// Stripe Integration Types
export interface StripePaymentIntent {
  id: string
  amount: number
  currency: 'vnd' | 'usd'
  status: StripePaymentStatus
  clientSecret: string
  metadata: Record<string, string>
  created: number
}

export type StripePaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'

export interface StripeConfig {
  publishableKey: string
  webhookSecret: string
  apiVersion: '2024-06-20'
}

// VNPay Gateway Types
export interface VNPayPaymentRequest {
  orderId: string
  amount: number
  orderInfo: string
  returnUrl: string
  ipAddr: string
  locale: 'vn' | 'en'
  bankCode?: VNPayBankCode
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
  | 'MOMO'

export interface VNPayPaymentResponse {
  vnp_ResponseCode: string
  vnp_TransactionNo: string
  vnp_Amount: number
  vnp_BankCode: string
  vnp_PayDate: string
  vnp_TransactionStatus: '00' | '01' | '02'
}

export interface VNPayConfig {
  tmnCode: string
  hashSecret: string
  paymentUrl: string
  returnUrl: string
}

// Unified Payment Gateway Interface
export interface PaymentGateway {
  name: 'stripe' | 'vnpay' | 'momo'
  createPayment: (request: PaymentRequest) => Promise<PaymentResponse>
  verifyPayment: (transactionId: string) => Promise<PaymentVerification>
  refund: (transactionId: string, amount?: number) => Promise<RefundResult>
}

export interface PaymentRequest {
  orderId: string
  amount: number
  currency: 'VND' | 'USD'
  userId: string
  description: string
  metadata?: Record<string, unknown>
}

export interface PaymentResponse {
  success: boolean
  transactionId: string
  paymentUrl?: string
  clientSecret?: string
  gateway: 'stripe' | 'vnpay' | 'momo'
}

export interface PaymentVerification {
  isValid: boolean
  transactionId: string
  amount: number
  status: 'succeeded' | 'pending' | 'failed'
  gateway: 'stripe' | 'vnpay' | 'momo'
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  reason?: string
}
