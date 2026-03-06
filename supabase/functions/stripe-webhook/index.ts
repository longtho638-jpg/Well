/**
 * Stripe Webhook Handler — Supabase Edge Function
 *
 * Handles Stripe subscription events and syncs to license state:
 * - customer.subscription.created → provision license
 * - customer.subscription.updated → update license tier
 * - customer.subscription.deleted → revoke license
 * - checkout.session.completed → activate license
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

interface Callbacks {
  logAudit: (userId: string, action: string, payload: Record<string, unknown>, severity: 'success' | 'failure') => Promise<void>
}

serve(async (req) => {
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
            paymentAmount: 0, // Will be updated on payment
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

        // If subscription exists, activate license
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
        const subscriptionId = invoice.subscription as string

        if (!userId || !subscriptionId) break

        // Update subscription period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await supabase
          .from('user_subscriptions')
          .update({
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            last_payment_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

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

        if (!userId) break

        // Mark subscription as past_due
        await supabase
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription)

        await callbacks.logAudit(userId, 'PAYMENT_FAILED', {
          invoiceId: invoice.id,
          source: 'stripe',
        }, 'failure')

        break
      }

      default:
        console.warn('[StripeWebhook] Unhandled event type: {0}', event.type)
    }

    return jsonRes({ received: true, eventId: event.id }, 200)

  } catch (err) {
    console.error('[StripeWebhook] Processing error:', err)
    return jsonRes({ error: 'Processing failed' }, 500)
  }
})

// Helper: Map Stripe plan ID to tier
function getTierFromPlan(planId: string): 'basic' | 'premium' | 'enterprise' | 'master' {
  const plan = planId.toLowerCase()
  if (plan.includes('basic')) return 'basic'
  if (plan.includes('premium')) return 'premium'
  if (plan.includes('enterprise')) return 'enterprise'
  if (plan.includes('master')) return 'master'
  return 'basic'
}
