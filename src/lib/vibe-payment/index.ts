/**
 * Vibe Payment SDK — Entry Point
 *
 * Provider-agnostic payment SDK for RaaS projects.
 * Currently supports PayOS; extensible to VNPay, MoMo, Stripe.
 *
 * Usage:
 *   import { createPaymentProvider } from '@/lib/vibe-payment';
 *   const provider = createPaymentProvider('payos', supabase);
 *   const result = await provider.createPayment({ ... });
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaymentProviderName, VibePaymentProvider } from './types';
import { PayOSAdapter } from './payos-adapter';

export function createPaymentProvider(
  name: PaymentProviderName,
  supabase: SupabaseClient,
): VibePaymentProvider {
  switch (name) {
    case 'payos':
      return new PayOSAdapter(supabase);
    default:
      throw new Error(`Payment provider "${name}" is not yet supported. Available: payos`);
  }
}

// Re-export all types and adapters
export type {
  PaymentProviderName,
  VibePaymentProvider,
  VibePaymentRequest,
  VibePaymentResponse,
  VibePaymentStatus,
  VibePaymentStatusCode,
  VibePaymentItem,
  VibeWebhookEvent,
  VibeWebhookConfig,
  VibeSubscriptionIntent,
  WebhookEventType,
  WebhookProcessingResult,
  WebhookIdempotencyGuard,
} from './types';

export { PayOSAdapter } from './payos-adapter';
export {
  computeHmacSha256,
  secureCompare,
  payosCodeToStatus,
  payosCodeToEventType,
} from './payos-adapter';

// Autonomous webhook handler
export { processWebhookEvent, isValidTransition } from './autonomous-webhook-handler';
export type { WebhookHandlerDeps, OrderRecord, SubscriptionIntentRecord } from './autonomous-webhook-handler';

// Billing webhook orchestrator (payment→subscription→tenant pipeline)
export {
  orchestrateBillingWebhook,
  createBillingWebhookConfig,
} from './billing-webhook-orchestrator';
export type {
  BillingOrchestrationDeps,
  BillingOrchestrationResult,
} from './billing-webhook-orchestrator';
