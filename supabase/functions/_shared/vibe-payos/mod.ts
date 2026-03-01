/**
 * Vibe PayOS SDK — Entry Point (Deno module convention)
 *
 * Shared PayOS primitives for Supabase Edge Functions.
 * Eliminates duplicated HMAC, signature, API calls across 4+ functions.
 *
 * Usage:
 *   import { loadCredentials, createPayment } from '../_shared/vibe-payos/mod.ts'
 *   import { verifyWebhookSignature } from '../_shared/vibe-payos/mod.ts'
 */

// Types
export type {
  PayOSCredentials,
  PayOSCreateRequest,
  PayOSCreateResponse,
  PayOSItem,
  PayOSPaymentStatus,
  PayOSWebhookData,
  PayOSWebhookPayload,
} from './types.ts'

// Crypto (HMAC, signatures, verification)
export {
  hmacSha256,
  secureCompare,
  createPaymentSignature,
  verifyWebhookSignature,
} from './crypto.ts'

// HTTP Client (PayOS API operations)
export {
  loadCredentials,
  createPayment,
  getPaymentStatus,
  cancelPayment,
} from './client.ts'

// Webhook Pipeline (reusable Edge Function handler)
export { handlePayOSWebhook } from './webhook-pipeline.ts'
export type {
  WebhookPipelineConfig,
  WebhookOrderRecord,
  WebhookSubscriptionIntent,
  WebhookCallbacks,
} from './webhook-pipeline.ts'

// Subscription period helper (shared across Edge Functions)
export { computeSubscriptionPeriodEnd } from './subscription-period-helper.ts'

// Edge Function helpers (auth, JSON response, admin client)
export {
  jsonRes,
  requireAuth,
  createAdminClient,
  optionalAuth,
} from './edge-function-helpers.ts'
