/**
 * Webhook Signature Verification Utility
 *
 * Supports HMAC-SHA256 signature verification for:
 * - Polar.sh: X-Polar-Signature (sha256=<hex>)
 * - Stripe: stripe-signature (v1=<hex>)
 * - PayOS: Custom HMAC-SHA256 (raw hex)
 *
 * Features: Timestamp validation (5-min tolerance), constant-time comparison
 */

/** Webhook provider types */
export type WebhookProvider = 'polar' | 'stripe' | 'payos';

/** Signature verification result */
export interface SignatureVerificationResult {
  isValid: boolean;
  reason?: 'invalid_signature' | 'expired_timestamp' | 'missing_signature' | 'malformed_signature';
  timestamp?: number;
}

/** Compute HMAC-SHA256 signature */
async function computeHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison to prevent timing attacks */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/** Parse Polar.sh signature: sha256=<hex> */
function parsePolarSignature(signature: string): { hex: string; timestamp?: number } | null {
  const match = signature.match(/^sha256=([a-f0-9]+)$/i);
  return match ? { hex: match[1].toLowerCase() } : null;
}

/** Parse Stripe signature: v1=<hex> */
function parseStripeSignature(signature: string): { hex: string; timestamp?: number } | null {
  const match = signature.match(/^v1=([a-f0-9]+)$/i);
  return match ? { hex: match[1].toLowerCase() } : null;
}

/** Parse PayOS signature: raw hex */
function parsePayosSignature(signature: string): { hex: string; timestamp?: number } | null {
  if (!/^[a-f0-9]+$/i.test(signature)) return null;
  return { hex: signature.toLowerCase() };
}

/**
 * Verify webhook signature
 * @param payload - Raw webhook payload (string or object)
 * @param signature - Signature from header
 * @param secret - Webhook secret key
 * @param provider - Payment provider
 * @example
 * verifyWebhookSignature(rawBody, req.headers['x-polar-signature'], secret, 'polar')
 */
export async function verifyWebhookSignature(
  payload: string | unknown,
  signature: string | null | undefined,
  secret: string,
  provider: WebhookProvider,
): Promise<SignatureVerificationResult> {
  if (!signature) return { isValid: false, reason: 'missing_signature' };

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  let parsed: { hex: string; timestamp?: number } | null;
  switch (provider) {
    case 'polar': parsed = parsePolarSignature(signature); break;
    case 'stripe': parsed = parseStripeSignature(signature); break;
    case 'payos': parsed = parsePayosSignature(signature); break;
    default: return { isValid: false, reason: 'malformed_signature' };
  }

  if (!parsed) return { isValid: false, reason: 'malformed_signature' };

  const expectedHex = await computeHmacSha256(secret, payloadString);
  if (!secureCompare(parsed.hex, expectedHex)) return { isValid: false, reason: 'invalid_signature' };

  return { isValid: true, timestamp: parsed.timestamp };
}

/**
 * Verify signature with timestamp validation (replay attack prevention)
 * @param payload - Raw webhook payload
 * @param signature - Signature from header
 * @param secret - Webhook secret key
 * @param provider - Payment provider
 * @param toleranceSeconds - Timestamp tolerance (default: 300s / 5 min)
 */
export async function verifyWebhookSignatureWithTimestamp(
  payload: string | unknown,
  signature: string | null | undefined,
  secret: string,
  provider: WebhookProvider,
  toleranceSeconds: number = 300,
  currentTimestamp: number = Date.now(),
): Promise<SignatureVerificationResult> {
  const result = await verifyWebhookSignature(payload, signature, secret, provider);
  if (!result.isValid || !result.timestamp) return result;

  const timestampMs = result.timestamp < 1e12 ? result.timestamp * 1000 : result.timestamp;
  const age = currentTimestamp - timestampMs;

  if (Math.abs(age) > toleranceSeconds * 1000) {
    return { isValid: false, reason: 'expired_timestamp', timestamp: result.timestamp };
  }
  return result;
}

export default verifyWebhookSignature;
