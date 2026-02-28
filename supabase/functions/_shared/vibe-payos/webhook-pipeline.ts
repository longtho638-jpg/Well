/**
 * Vibe PayOS SDK — Reusable Webhook Pipeline for Edge Functions
 *
 * Extracted from payos-webhook/index.ts.
 * Handles: secret verification, signature check, order/subscription routing,
 * state machine, idempotency guard — all provider-agnostic.
 *
 * Business logic (email, commission, etc.) injected via callbacks.
 *
 * Usage:
 *   import { handlePayOSWebhook } from '../_shared/vibe-payos/mod.ts'
 *   serve((req) => handlePayOSWebhook(req, supabase, callbacks))
 */

import type { PayOSWebhookData, PayOSWebhookPayload } from './types.ts'
import { verifyWebhookSignature } from './crypto.ts'

// ─── Types ──────────────────────────────────────────────────────

export interface WebhookPipelineConfig {
  /** Env var name for webhook secret (default: WEBHOOK_SECRET) */
  webhookSecretEnv?: string
  /** Env var name for checksum key (default: PAYOS_CHECKSUM_KEY) */
  checksumKeyEnv?: string
}

export interface WebhookOrderRecord {
  id: string
  status: string
  user_id: string | null
  order_code: number
}

export interface WebhookSubscriptionIntent {
  id: string
  user_id: string
  plan_id: string
  billing_cycle: string
  status: string
  org_id?: string | null
}

/** Callbacks for business logic — injected by the Edge Function */
export interface WebhookCallbacks {
  /** Find order by orderCode */
  findOrder: (orderCode: number) => Promise<WebhookOrderRecord | null>
  /** Find subscription intent by orderCode */
  findSubscriptionIntent: (orderCode: number) => Promise<WebhookSubscriptionIntent | null>
  /** Atomically update order status (returns updated record or null if race) */
  updateOrderStatus: (orderId: string, newStatus: string, paymentData: PayOSWebhookData) => Promise<boolean>
  /** Update subscription intent status */
  updateSubscriptionIntent: (intentId: string, status: string) => Promise<void>
  /** Activate subscription after payment */
  activateSubscription: (intent: WebhookSubscriptionIntent, data: PayOSWebhookData) => Promise<void>
  /** Log audit event */
  logAudit: (userId: string | null, action: string, payload: Record<string, unknown>, severity: string) => Promise<void>
  /** Called after successful order payment (fire-and-forget) */
  onOrderPaid?: (order: WebhookOrderRecord, data: PayOSWebhookData) => Promise<void>
  /** Called after successful subscription payment (fire-and-forget) */
  onSubscriptionPaid?: (intent: WebhookSubscriptionIntent, data: PayOSWebhookData) => Promise<void>
}

// ─── Pipeline ───────────────────────────────────────────────────

/**
 * Full PayOS webhook pipeline — drop-in for any Edge Function.
 * Returns a Response ready to send back to PayOS.
 */
export async function handlePayOSWebhook(
  req: Request,
  callbacks: WebhookCallbacks,
  config: WebhookPipelineConfig = {},
): Promise<Response> {
  const { webhookSecretEnv = 'WEBHOOK_SECRET', checksumKeyEnv = 'PAYOS_CHECKSUM_KEY' } = config

  // GET = PayOS URL verification ping
  if (req.method === 'GET') {
    return jsonResponse({ success: true })
  }

  // Step 1: Verify webhook secret header
  const secret = req.headers.get('x-webhook-secret')
  const expectedSecret = Deno.env.get(webhookSecretEnv)

  if (!expectedSecret) {
    console.error('[vibe-payos] Webhook secret not configured')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  if (secret !== expectedSecret) {
    console.error('[vibe-payos] Invalid webhook secret')
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    // Step 2: Parse payload & verify HMAC signature
    const payload: PayOSWebhookPayload = await req.json()

    if (!payload.signature) {
      await callbacks.logAudit(null, 'PAYOS_WEBHOOK_FAILED', { error: 'Missing signature' }, 'failure')
      return jsonResponse({ error: 'Missing signature' }, 401)
    }

    const checksumKey = Deno.env.get(checksumKeyEnv)
    if (!checksumKey) throw new Error(`${checksumKeyEnv} not configured`)

    const isValid = await verifyWebhookSignature(
      payload.data as unknown as Record<string, unknown>,
      payload.signature,
      checksumKey,
    )

    if (!isValid) {
      await callbacks.logAudit(null, 'PAYOS_WEBHOOK_FAILED', { error: 'Invalid signature' }, 'failure')
      return jsonResponse({ error: 'Invalid signature' }, 401)
    }

    // Step 3: Route to order or subscription handler
    const order = await callbacks.findOrder(payload.data.orderCode)

    if (order) {
      return processOrderWebhook(order, payload.data, callbacks)
    }

    const intent = await callbacks.findSubscriptionIntent(payload.data.orderCode)

    if (intent) {
      return processSubscriptionWebhook(intent, payload.data, callbacks)
    }

    await callbacks.logAudit(null, 'PAYOS_WEBHOOK_FAILED', {
      error: 'Order not found', orderCode: payload.data.orderCode,
    }, 'failure')
    return jsonResponse({ error: 'Order not found' }, 404)

  } catch (error) {
    console.error('[vibe-payos] Webhook processing error:', error)
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
}

// ─── Order Processing ───────────────────────────────────────────

async function processOrderWebhook(
  order: WebhookOrderRecord,
  data: PayOSWebhookData,
  callbacks: WebhookCallbacks,
): Promise<Response> {
  const newStatus = payosCodeToStatus(data.code)

  // Idempotency guard — terminal states
  if (order.status === 'paid' || order.status === 'cancelled') {
    await callbacks.logAudit(order.user_id, 'PAYOS_WEBHOOK_IGNORED', {
      orderId: order.id, currentStatus: order.status, newStatus, reason: 'Order already finalized',
    }, 'info')
    return jsonResponse({ success: true, status: order.status, message: 'Order already finalized' })
  }

  // Atomic update with optimistic concurrency
  const updated = await callbacks.updateOrderStatus(order.id, newStatus, data)

  if (!updated) {
    return jsonResponse({ success: true, status: 'already_finalized', message: 'Concurrent webhook already processed' })
  }

  await callbacks.logAudit(order.user_id, 'PAYOS_WEBHOOK_SUCCESS', {
    orderId: order.id, oldStatus: order.status, newStatus, amount: data.amount,
  }, 'success')

  // Fire side effects (non-blocking)
  if (newStatus === 'paid' && callbacks.onOrderPaid) {
    callbacks.onOrderPaid(order, data).catch((err) =>
      console.error('[vibe-payos] onOrderPaid failed:', err),
    )
  }

  return jsonResponse({ success: true, status: newStatus })
}

// ─── Subscription Processing ────────────────────────────────────

async function processSubscriptionWebhook(
  intent: WebhookSubscriptionIntent,
  data: PayOSWebhookData,
  callbacks: WebhookCallbacks,
): Promise<Response> {
  if (intent.status !== 'pending') {
    return jsonResponse({ success: true, message: 'Subscription already processed' })
  }

  const isPaid = data.code === '00'
  const isCanceled = data.code === '01'
  const newIntentStatus = isPaid ? 'paid' : isCanceled ? 'canceled' : 'pending'

  await callbacks.updateSubscriptionIntent(intent.id, newIntentStatus)

  if (isPaid) {
    await callbacks.activateSubscription(intent, data)

    if (callbacks.onSubscriptionPaid) {
      callbacks.onSubscriptionPaid(intent, data).catch((err) =>
        console.error('[vibe-payos] onSubscriptionPaid failed:', err),
      )
    }
  }

  return jsonResponse({ success: true, subscriptionStatus: newIntentStatus })
}

// ─── Helpers ────────────────────────────────────────────────────

function payosCodeToStatus(code: string): string {
  if (code === '00') return 'paid'
  if (code === '01') return 'cancelled'
  return 'pending'
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
