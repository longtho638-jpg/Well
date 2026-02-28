/**
 * Vibe PayOS SDK — Types for Supabase Edge Functions (Deno runtime)
 *
 * Shared types between payos-create-payment, payos-webhook,
 * payos-get-payment, payos-cancel-payment, payos-create-subscription.
 */

// ─── PayOS Credentials ──────────────────────────────────────────

export interface PayOSCredentials {
  clientId: string
  apiKey: string
  checksumKey: string
}

// ─── Payment Request/Response ───────────────────────────────────

export interface PayOSCreateRequest {
  orderCode: number
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  items: PayOSItem[]
}

export interface PayOSItem {
  name: string
  quantity: number
  price: number
}

export interface PayOSCreateResponse {
  checkoutUrl: string
  orderCode: number
}

// ─── Payment Status ─────────────────────────────────────────────

export interface PayOSPaymentStatus {
  orderCode: number
  amount: number
  amountPaid: number
  amountRemaining: number
  status: string
  createdAt: string
  transactions: Record<string, unknown>[]
  cancellationReason?: string
  canceledAt?: string
}

// ─── Webhook ────────────────────────────────────────────────────

export interface PayOSWebhookData {
  orderCode: number
  amount: number
  description: string
  accountNumber: string
  reference: string
  transactionDateTime: string
  currency: string
  paymentLinkId: string
  code: string
  desc: string
  counterAccountBankId?: string
  counterAccountBankName?: string
  counterAccountName?: string
  counterAccountNumber?: string
  virtualAccountName?: string
  virtualAccountNumber?: string
}

export interface PayOSWebhookPayload {
  data: PayOSWebhookData
  signature: string
}
