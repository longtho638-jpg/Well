/**
 * Polar.sh Webhook Handler — Supabase Edge Function
 *
 * Handles Polar subscription events and syncs to license state:
 * - subscription.activated → provision license
 * - subscription.canceled → schedule revoke (grace period)
 * - subscription.expired → revoke license
 *
 * Security: HMAC-SHA256 signature verification with timestamp validation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, jsonRes, hmacSha256, secureCompare } from './_shared/vibe-payos/mod.ts'
import { provisionLicenseOnPayment } from './_shared/raas-license-provision.ts'
import { revokeLicenseOnCancel } from './_shared/raas-license-provision.ts'

const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET') ?? ''
const maxAgeSeconds = 300 // 5 minutes tolerance for replay attacks

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

      default:
        console.warn('[PolarWebhook] Unhandled event type: {0}', event.type)
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
