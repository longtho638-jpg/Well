/**
 * Vibe PayOS SDK — Cryptographic primitives for HMAC-SHA256 + timing-safe compare
 *
 * Used by all PayOS Edge Functions for signature creation & verification.
 * Uses Web Crypto API (available in Deno & Cloudflare Workers).
 */

/** Compute HMAC-SHA256 hex digest */
export async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time string comparison to prevent timing attacks */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Create PayOS payment signature.
 * PayOS requires fields sorted alphabetically: amount, cancelUrl, description, orderCode, returnUrl
 */
export async function createPaymentSignature(
  amount: number,
  cancelUrl: string,
  description: string,
  orderCode: number,
  returnUrl: string,
  checksumKey: string,
): Promise<string> {
  const message = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`
  return hmacSha256(checksumKey, message)
}

/**
 * Verify PayOS webhook signature.
 * Sorts all data keys alphabetically, joins as key=value&, compares HMAC.
 */
export async function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string,
): Promise<boolean> {
  const sortedKeys = Object.keys(data).sort()
  const message = sortedKeys.map((key) => `${key}=${data[key]}`).join('&')
  const computed = await hmacSha256(checksumKey, message)
  return secureCompare(signature, computed)
}
