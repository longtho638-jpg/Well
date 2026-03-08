/**
 * Stripe Webhook Handler — Supabase Edge Function
 *
 * Handles Stripe subscription events and syncs to license state:
 * - customer.subscription.created → provision license
 * - customer.subscription.updated → update license tier
 * - customer.subscription.deleted → revoke license
 * - checkout.session.completed → activate license
 * - invoice.payment_failed → trigger dunning
 * - invoice.payment_succeeded → clear dunning status
 *
 * Security: Stripe signature verification using Stripe SDK
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createAdminClient, jsonRes } from './_shared/vibe-payos/edge-function-helpers.ts'
import { provisionLicenseOnPayment } from './_shared/raas-license-provision.ts'
import { revokeLicenseOnCancel } from './_shared/raas-license-provision.ts'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://wellnexus.vn'

interface Callbacks {
  logAudit: (userId: string, action: string, payload: Record<string, unknown>, severity: 'success' | 'failure') => Promise<void>
}

/**
 * Send dunning email notification via Resend
 */
async function sendDunningEmail(
  to: string,
  name: string,
  subscriptionId: string,
  supabase: any,
  daysUntilRetry: number = 3
) {
  if (!RESEND_API_KEY) {
    console.warn('[StripeWebhook] RESEND_API_KEY not configured, skipping email')
    return
  }

  // Get subscription details
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(name)')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  const planName = subscription?.subscription_plans?.name || 'Subscription'

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Payment Failed</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #f59e0b; margin-bottom: 16px;">⚠️ Thanh toán thất bại</h2>
          <p style="color: #374151; line-height: 1.6;">
            Chào ${name || 'Bạn'},
          </p>
          <p style="color: #374151; line-height: 1.6;">
            Hệ thống không thể xử lý thanh toán cho subscription <strong>${planName}</strong>.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Chúng tôi sẽ tự động thử lại sau <strong>${daysUntilRetry} ngày</strong>.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${APP_URL}/dashboard/subscription"
               style="display: inline-block; padding: 12px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Cập nhật phương thức thanh toán
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            WellNexus Billing System
          </p>
        </div>
      </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WellNexus <noreply@wellnexus.vn>',
        to,
        subject: '⚠️ Thanh toán thất bại - Vui lòng cập nhật phương thức thanh toán',
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[StripeWebhook] Email error:', errorData)
    } else {
      console.log('[StripeWebhook] Dunning email sent')
    }
  } catch (err) {
    console.error('[StripeWebhook] Send email error:', err)
  }
}

// Helper: Map Stripe plan ID to tier
function getTierFromPlan(planId: string): 'basic' | 'premium' | 'enterprise' | 'master' {
  const plan = planId.toLowerCase()
  if (plan.includes('basic')) return 'basic'
  if (plan.includes('premium')) return 'premium'
  if (plan.includes('enterprise')) return 'enterprise'
  if (plan.includes('master')) return 'master'
  return 'basic'
}

serve(async (req: Request) => {
  const supabase = createAdminClient()

  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // Verify Stripe signature
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[StripeWebhook] Signature verification failed:', err)
    return jsonRes({ error: 'Invalid signature' }, 400)
  }

  const callbacks: Callbacks = {
    logAudit: async (userId, action, payload, severity) => {
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action,
          payload: { ...payload, severity },
          user_agent: 'Stripe-Webhook-Service',
          ip_address: '0.0.0.0',
        })
      } catch (err) {
        console.error('[audit] Write failed:', err)
      }
    },
  }

  // Handle events
  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id
        const planId = subscription.metadata.plan_id
        const billingCycle = (subscription.metadata.billing_cycle as 'monthly' | 'yearly') ?? 'monthly'

        if (!userId || !planId) {
          console.error('[StripeWebhook] Missing metadata', { userId, planId })
          return jsonRes({ error: 'Invalid subscription metadata' }, 400)
        }

        // Provision license
        const provisionResult = await provisionLicenseOnPayment(
          {
            userId,
            planId,
            billingCycle,
            paymentAmount: 0,
            paymentId: subscription.id,
            orgId: subscription.metadata.org_id,
          },
          supabase
        )

        if (provisionResult.success) {
          await callbacks.logAudit(userId, 'LICENSE_PROVISIONED', {
            licenseNonce: provisionResult.license?.nonce,
            tier: provisionResult.license?.tier,
            source: 'stripe',
          }, 'success')
        } else {
          await callbacks.logAudit(userId, 'LICENSE_PROVISION_FAILED', {
            error: provisionResult.error,
          }, 'failure')
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id
        const planId = subscription.metadata.plan_id

        if (!userId || !planId) break

        // Update license tier based on new plan
        const { error } = await supabase
          .from('raas_licenses')
          .update({
            tier: getTierFromPlan(planId),
            metadata: {
              ...(subscription.metadata as Record<string, unknown>),
              updated_at: new Date().toISOString(),
            },
          })
          .eq('(metadata->>user_id)', userId)
          .eq('(metadata->>source)', 'stripe')

        if (error) {
          await callbacks.logAudit(userId, 'LICENSE_UPDATE_FAILED', {
            error: error.message,
          }, 'failure')
        } else {
          await callbacks.logAudit(userId, 'LICENSE_UPDATED', {
            planId,
            source: 'stripe',
          }, 'success')
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id

        if (!userId) break

        // Revoke license
        const revokeResult = await revokeLicenseOnCancel(userId, supabase)

        await callbacks.logAudit(userId, 'LICENSE_REVOKED', {
          reason: 'subscription_deleted',
          revokedCount: revokeResult.revokedCount,
          source: 'stripe',
        }, revokeResult.success ? 'success' : 'failure')

        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const subscriptionId = session.subscription as string | undefined

        if (!userId) break

        if (subscriptionId) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('id, plan_id, billing_cycle')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (subscription) {
            await callbacks.logAudit(userId, 'CHECKOUT_COMPLETED', {
              subscriptionId,
              planId: subscription.plan_id,
            }, 'success')
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const userId = invoice.metadata?.user_id

        if (!userId) break

        // Clear dunning status
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            metadata: {
              last_payment_success: new Date().toISOString(),
              dunning_retry_count: 0,
            },
          })
          .eq('(metadata->>user_id)', userId)

        await callbacks.logAudit(userId, 'PAYMENT_SUCCEEDED', {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          source: 'stripe',
        }, 'success')

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const userId = invoice.metadata?.user_id
        const subscriptionId = invoice.subscription as string

        if (!userId) break

        // Mark subscription as past_due
        await supabase
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)

        // Get user email and send dunning notification
        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single()

        if (userData?.email) {
          await sendDunningEmail(userData.email, userData.full_name, subscriptionId, supabase)
        }

        await callbacks.logAudit(userId, 'PAYMENT_FAILED', {
          invoiceId: invoice.id,
          source: 'stripe',
        }, 'failure')

        break
      }

      default:
        console.warn('[StripeWebhook] Unhandled event type:', event.type)
    }

    return jsonRes({ received: true, eventId: event.id }, 200)

  } catch (err) {
    console.error('[StripeWebhook] Processing error:', err)
    return jsonRes({ error: 'Processing failed' }, 500)
  }
})
