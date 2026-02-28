/**
 * Vibe PayOS SDK — HTTP Client for PayOS Merchant API
 *
 * Thin wrapper over PayOS REST API v2.
 * Handles auth headers, error parsing, response normalization.
 */

import type {
  PayOSCredentials,
  PayOSCreateRequest,
  PayOSCreateResponse,
  PayOSItem,
  PayOSPaymentStatus,
} from './types.ts'
import { createPaymentSignature } from './crypto.ts'

const PAYOS_API_BASE = 'https://api-merchant.payos.vn/v2/payment-requests'

/** Load PayOS credentials from Deno.env, throws if missing */
export function loadCredentials(): PayOSCredentials {
  const clientId = Deno.env.get('PAYOS_CLIENT_ID')
  const apiKey = Deno.env.get('PAYOS_API_KEY')
  const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error('PayOS credentials not configured (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)')
  }

  return { clientId, apiKey, checksumKey }
}

/** Build common PayOS auth headers */
function authHeaders(creds: PayOSCredentials): Record<string, string> {
  return {
    'x-client-id': creds.clientId,
    'x-api-key': creds.apiKey,
    'Content-Type': 'application/json',
  }
}

/** Create a PayOS payment request */
export async function createPayment(
  request: PayOSCreateRequest,
  creds: PayOSCredentials,
): Promise<PayOSCreateResponse> {
  const signature = await createPaymentSignature(
    request.amount,
    request.cancelUrl,
    request.description,
    request.orderCode,
    request.returnUrl,
    creds.checksumKey,
  )

  const response = await fetch(PAYOS_API_BASE, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({
      orderCode: request.orderCode,
      amount: request.amount,
      description: request.description,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
      signature,
      items: request.items,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`PayOS create payment failed: ${errText}`)
  }

  const json = await response.json()
  return {
    checkoutUrl: json.data?.checkoutUrl ?? '',
    orderCode: request.orderCode,
  }
}

/** Get payment status from PayOS */
export async function getPaymentStatus(
  orderCode: number,
  creds: PayOSCredentials,
): Promise<PayOSPaymentStatus> {
  const response = await fetch(`${PAYOS_API_BASE}/${orderCode}`, {
    method: 'GET',
    headers: authHeaders(creds),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`PayOS get payment failed: ${errText}`)
  }

  const json = await response.json()
  return json.data ?? {}
}

/** Cancel a PayOS payment */
export async function cancelPayment(
  orderCode: number,
  reason: string,
  creds: PayOSCredentials,
): Promise<PayOSPaymentStatus> {
  const response = await fetch(`${PAYOS_API_BASE}/${orderCode}/cancel`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ cancellationReason: reason }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`PayOS cancel payment failed: ${errText}`)
  }

  const json = await response.json()
  return json.data ?? {}
}
