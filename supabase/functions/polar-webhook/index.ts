/**
 * Polar.sh Webhook Handler — Supabase Edge Function
 *
 * Handles Polar subscription events and syncs to license state:
 * - subscription.activated → provision license
 * - subscription.canceled → schedule revoke (grace period)
 * - subscription.expired → revoke license
 *
 * Analytics Tracking:
 * - All events stored in polar_webhook_events for analytics
 * - Customer cohorts updated on purchase/subscription events
 * - Revenue attribution tracked per license
 *
 * Security: HMAC-SHA256 signature verification with timestamp validation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, jsonRes, hmacSha256, secureCompare } from './_shared/vibe-payos/mod.ts'
import { provisionLicenseOnPayment } from './_shared/raas-license-provision.ts'
import { revokeLicenseOnCancel } from './_shared/raas-license-provision.ts'

const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET') ?? ''
const maxAgeSeconds = 300 // 5 minutes tolerance for replay attacks

/**
 * Map product/plan name to tier
 */
function mapPlanToTier(planName: string | undefined): string {
  if (!planName) return 'free'
  const name = planName.toLowerCase()
  if (name.includes('master')) return 'master'
  if (name.includes('enterprise')) return 'enterprise'
  if (name.includes('premium')) return 'premium'
  if (name.includes('basic') || name.includes('starter')) return 'basic'
  return 'free'
}

/**
 * Store webhook event for analytics
 */
async function storeWebhookEvent(
  supabase: any,
  eventType: string,
  eventId: string,
  eventData: Record<string, unknown>
) {
  try {
    const customerId = eventData.user_id as string || eventData.customer_id as string
    const subscriptionId = eventData.subscription_id as string
    const amount = (eventData.amount as number) || 0
    const currency = (eventData.currency as string) || 'USD'
    const productName = (eventData.plan_name as string) || (eventData.product_name as string) || ''
    const tier = mapPlanToTier(eventData.plan_name || eventData.tier as string)

    await supabase.from('polar_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      customer_id: customerId,
      subscription_id: subscriptionId,
      amount_cents: amount,
      currency: currency,
      product_name: productName,
      tier: tier,
      payload: eventData,
      processed: true,
      processed_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[analytics] Failed to store webhook event:', err)
  }
}

serve(async (req: Request) => {
  const supabase = createAdminClient()

  const body = await req.text()
  const signature = req.headers.get('X-Polar-Signature') ?? ''
  const timestamp = req.headers.get('X-Polar-Timestamp') ?? ''

  // Verify timestamp (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000)
  const timestampNum = parseInt(timestamp, 10)
  if (isNaN(timestampNum) || Math.abs(now - timestampNum) > maxAgeSeconds) {
    console.error('[PolarWebhook] Invalid or expired timestamp')
    return jsonRes({ error: 'Invalid timestamp' }, 400)
  }

  // Verify HMAC signature
  const signedPayload = `${timestamp}.${body}`
  const computedSignature = await hmacSha256(webhookSecret, signedPayload)

  if (!signature || !secureCompare(signature, computedSignature)) {
    console.error('[PolarWebhook] Signature verification failed')
    return jsonRes({ error: 'Invalid signature' }, 400)
  }

  // Parse event
  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch (err) {
    console.error('[PolarWebhook] Invalid JSON:', err)
    return jsonRes({ error: 'Invalid JSON' }, 400)
  }

  // Audit log helper
  const logAudit = async (userId: string, action: string, payload: Record<string, unknown>, severity: 'success' | 'failure') => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        payload: { ...payload, severity },
        user_agent: 'Polar-Webhook-Service',
        ip_address: '0.0.0.0',
      })
    } catch (err) {
      console.error('[audit] Write failed:', err)
    }
  }

  // Handle events
  try {
    // Store event for analytics (all event types)
    await storeWebhookEvent(supabase, event.type, event.data.id as string || crypto.randomUUID(), event.data)

    switch (event.type) {
      case 'subscription.activated': {
        const { user_id, plan_id, billing_cycle, org_id } = event.data
        const subscriptionId = event.data.subscription_id as string

        if (!user_id || !plan_id) {
          console.error('[PolarWebhook] Missing metadata', { user_id, plan_id })
          return jsonRes({ error: 'Invalid subscription data' }, 400)
        }

        // Provision license
        const provisionResult = await provisionLicenseOnPayment(
          {
            userId: user_id as string,
            planId: plan_id as string,
            billingCycle: (billing_cycle as 'monthly' | 'yearly') ?? 'monthly',
            paymentAmount: 0, // Will be updated on payment
            paymentId: subscriptionId,
            orgId: org_id as string | undefined,
          },
          supabase
        )

        if (provisionResult.success) {
          await logAudit(user_id as string, 'LICENSE_PROVISIONED', {
            licenseNonce: provisionResult.license?.nonce,
            tier: provisionResult.license?.tier,
            source: 'polar',
          }, 'success')
        } else {
          await logAudit(user_id as string, 'LICENSE_PROVISION_FAILED', {
            error: provisionResult.error,
          }, 'failure')
        }

        break
      }

      case 'subscription.canceled': {
        const { user_id } = event.data

        if (!user_id) break

        // Mark for grace period (don't revoke immediately)
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'pending_revocation',
            canceled_at: new Date().toISOString(),
          })
          .eq('polar_subscription_id', event.data.subscription_id)

        if (error) {
          await logAudit(user_id as string, 'SUBSCRIPTION_CANCEL_UPDATE_FAILED', {
            error: error.message,
          }, 'failure')
        } else {
          await logAudit(user_id as string, 'SUBSCRIPTION_CANCELED', {
            source: 'polar',
          }, 'success')
        }

        break
      }

      case 'subscription.expired': {
        const { user_id } = event.data

        if (!user_id) break

        // Revoke license immediately on expiry
        const revokeResult = await revokeLicenseOnCancel(user_id as string, supabase)

        await logAudit(user_id as string, 'LICENSE_EXPIRED', {
          reason: 'subscription_expired',
          revokedCount: revokeResult.revokedCount,
          source: 'polar',
        }, revokeResult.success ? 'success' : 'failure')

        break
      }

      case 'payment.succeeded': {
        const { user_id, subscription_id, amount, currency } = event.data

        if (!user_id || !subscription_id) break

        // Update subscription with payment info (monthly default)
        const billingCycle: 'monthly' | 'yearly' = 'monthly'
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            last_payment_at: new Date().toISOString(),
            next_payment_at: calculateNextPaymentDate(billingCycle),
          })
          .eq('polar_subscription_id', subscription_id)

        if (error) {
          await logAudit(user_id as string, 'PAYMENT_UPDATE_FAILED', {
            error: error.message,
          }, 'failure')
        } else {
          await logAudit(user_id as string, 'PAYMENT_SUCCEEDED', {
            amount,
            currency,
            source: 'polar',
          }, 'success')
        }

        break
      }

      case 'payment.failed': {
        const { user_id, subscription_id } = event.data

        if (!user_id || !subscription_id) break

        // Mark subscription as past_due
        await supabase
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('polar_subscription_id', subscription_id)

        await logAudit(user_id as string, 'PAYMENT_FAILED', {
          source: 'polar',
        }, 'failure')

        break
      }

      // Phase 6: Overage billing events
      case 'usage.billing_sync': {
        const { overage_transaction_id, polar_transaction_id, amount, customer_id, org_id } = event.data

        if (!overage_transaction_id) {
          console.error('[PolarWebhook] Missing overage_transaction_id')
          break
        }

        // Update overage transaction with Polar transaction ID
        const { error } = await supabase
          .from('overage_transactions')
          .update({
            polar_transaction_id: polar_transaction_id,
            stripe_sync_status: 'synced', // Reuse field for Polar sync status
            polar_synced_at: new Date().toISOString(),
          })
          .eq('id', overage_transaction_id)

        if (error) {
          console.error('[PolarWebhook] Failed to update overage transaction:', error)
          await logAudit(customer_id as string || 'unknown', 'OVERAGE_SYNC_FAILED', {
            overage_transaction_id,
            error: error.message,
          }, 'failure')
        } else {
          console.log('[PolarWebhook] Overage transaction synced:', overage_transaction_id)
          await logAudit(customer_id as string || 'unknown', 'OVERAGE_SYNCED', {
            overage_transaction_id,
            polar_transaction_id,
            amount,
          }, 'success')
        }

        break
      }

      case 'usage.overage_detected': {
        const { customer_id, org_id, metric_type, current_usage, quota_limit, percentage } = event.data

        if (!customer_id || !metric_type) {
          console.error('[PolarWebhook] Missing customer_id or metric_type')
          break
        }

        // Log overage detection for analytics
        await supabase.from('alert_events').insert({
          event_type: 'overage_detected',
          customer_id,
          org_id,
          metric_type,
          payload: event.data,
        })

        console.log('[PolarWebhook] Overage detected:', { customer_id, metric_type, percentage })

        break
      }

      // Phase 6: Quota exhaustion alert
      case 'usage.quota_exhausted': {
        const { customer_id, org_id, metric_type, current_usage, quota_limit, percentage } = event.data

        if (!org_id || !metric_type) {
          console.error('[PolarWebhook] Missing org_id or metric_type for quota_exhausted')
          break
        }

        // Update billing state in KV abstraction (billing_state table)
        try {
          await supabase.from('billing_state').upsert({
            org_id: org_id,
            metric_type: metric_type,
            current_usage: current_usage || 0,
            quota_limit: quota_limit || 0,
            percentage_used: Math.round(percentage) || 100,
            is_exhausted: true,
            last_sync: new Date().toISOString(),
          }, {
            onConflict: 'org_id,metric_type',
          })
        } catch (err) {
          console.error('[PolarWebhook] Failed to update billing_state:', err)
        }

        // Log critical alert
        await supabase.from('alert_events').insert({
          event_type: 'quota_exhausted',
          customer_id: customer_id || 'unknown',
          org_id,
          metric_type,
          severity: 'critical',
          payload: event.data,
        })

        console.log('[PolarWebhook] Quota exhausted:', { org_id, metric_type, percentage })
        break
      }

      // Phase 6: Threshold warning (80%, 90%)
      case 'usage.threshold_warning': {
        const { customer_id, org_id, metric_type, percentage, threshold } = event.data

        if (!org_id || !metric_type) {
          console.error('[PolarWebhook] Missing org_id or metric_type for threshold_warning')
          break
        }

        // Log warning alert
        await supabase.from('alert_events').insert({
          event_type: 'threshold_warning',
          customer_id: customer_id || 'unknown',
          org_id,
          metric_type,
          severity: percentage >= 90 ? 'critical' : 'warning',
          payload: event.data,
        })

        console.log('[PolarWebhook] Threshold warning:', { org_id, metric_type, threshold, percentage })
        break
      }

      default:
        console.warn('[PolarWebhook] Unhandled event type:', event.type)
    }

    return jsonRes({ received: true, eventType: event.type }, 200)

  } catch (err) {
    console.error('[PolarWebhook] Processing error:', err)
    return jsonRes({ error: 'Processing failed' }, 500)
  }
})

// Helper: Calculate next payment date
function calculateNextPaymentDate(billingCycle: 'monthly' | 'yearly'): string {
  const now = new Date()
  if (billingCycle === 'monthly') {
    now.setMonth(now.getMonth() + 1)
  } else {
    now.setFullYear(now.getFullYear() + 1)
  }
  return now.toISOString()
}
