/**
 * Stripe Billing Webhook Handler - Phase 7
 *
 * Handles Stripe webhook events for billing, overage, and dunning management.
 * Routes events to appropriate handlers and manages idempotency.
 *
 * Events handled:
 * - invoice.payment_failed → Triggers dunning workflow
 * - invoice.payment_succeeded → Resolves dunning, clears alerts
 * - customer.subscription.updated → Updates subscription status
 * - customer.subscription.deleted → Cancels subscription
 *
 * Usage: Edge Function at /supabase/functions/stripe-webhook/index.ts
 */

// Deno runtime type declarations for Edge Function
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

interface StripeWebhookEvent {
  id: string
  type: string
  created: number
  data: {
    object: any
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')!
    const body = await req.text()

    // Verify webhook signature
    let event: StripeWebhookEvent
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('[StripeWebhook] Signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[StripeWebhook] Received event: ${event.type} (${event.id})`)

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Route to appropriate handler
    let result: { success: boolean; message?: string; data?: any }

    switch (event.type) {
      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event, supabase)
        break
      case 'invoice.payment_succeeded':
        result = await handlePaymentSucceeded(event, supabase)
        break
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event, supabase)
        break
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event, supabase)
        break
      case 'charge.failed':
      case 'charge.succeeded':
        result = { success: true, message: 'Charge event acknowledged' }
        break
      default:
        console.log(`[StripeWebhook] Unhandled event type: ${event.type}`)
        result = { success: true, message: 'Event received but not processed' }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[StripeWebhook] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Handle invoice.payment_failed event
 * Triggers dunning workflow
 */
async function handlePaymentFailed(
  event: StripeWebhookEvent,
  supabase: any
): Promise<{ success: boolean; message?: string; dunningId?: string }> {
  const invoice = event.data.object

  console.log('[StripeWebhook] Payment failed:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_due,
    subscriptionId: invoice.subscription,
  })

  try {
    // Get subscription to find org_id
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('org_id, user_id, id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single()

    if (!subscription) {
      console.error('[StripeWebhook] Subscription not found for:', invoice.subscription)
      return { success: false, message: 'Subscription not found' }
    }

    // Check if dunning event already exists (idempotency)
    const { data: existingDunning } = await supabase
      .from('dunning_events')
      .select('id')
      .eq('stripe_invoice_id', invoice.id)
      .single()

    if (existingDunning) {
      console.log('[StripeWebhook] Dunning event already exists:', existingDunning.id)
      return { success: true, message: 'Dunning event already logged', dunningId: existingDunning.id }
    }

    // Generate payment URL (Stripe Customer Portal)
    let paymentUrl: string | null = null
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: invoice.customer,
        return_url: 'https://agencyos.network/dashboard/billing',
      })
      paymentUrl = portalSession.url
    } catch (err) {
      console.error('[StripeWebhook] Failed to create portal session:', err)
    }

    // Log dunning event
    const { data: dunningId, error } = await supabase.rpc('log_dunning_event', {
      p_org_id: subscription.org_id,
      p_user_id: subscription.user_id,
      p_subscription_id: subscription.id,
      p_stripe_invoice_id: invoice.id,
      p_stripe_subscription_id: invoice.subscription,
      p_stripe_customer_id: invoice.customer,
      p_amount_owed: invoice.amount_due / 100, // Convert cents to dollars
      p_currency: invoice.currency,
      p_payment_url: paymentUrl,
    })

    if (error) {
      console.error('[StripeWebhook] Error logging dunning event:', error)
      return { success: false, message: error.message }
    }

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      org_id: subscription.org_id,
      user_id: subscription.user_id,
      action: 'payment_failed',
      payload: {
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due,
        subscription_id: invoice.subscription,
      },
      severity: 'high',
    })

    console.log('[StripeWebhook] Dunning event created:', dunningId)
    return { success: true, message: 'Dunning event created', dunningId }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[StripeWebhook] handlePaymentFailed error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Resolves any active dunning events
 */
async function handlePaymentSucceeded(
  event: StripeWebhookEvent,
  supabase: any
): Promise<{ success: boolean; message?: string }> {
  const invoice = event.data.object

  console.log('[StripeWebhook] Payment succeeded:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_paid,
  })

  try {
    // Find dunning event for this invoice
    const { data: dunningEvent } = await supabase
      .from('dunning_events')
      .select('id, subscription_id')
      .eq('stripe_invoice_id', invoice.id)
      .eq('resolved', false)
      .single()

    if (dunningEvent) {
      // Resolve dunning event
      const { error } = await supabase.rpc('resolve_dunning_event', {
        p_dunning_id: dunningEvent.id,
        p_resolution_method: 'payment_success',
      })

      if (error) {
        console.error('[StripeWebhook] Error resolving dunning:', error)
      } else {
        console.log('[StripeWebhook] Dunning resolved:', dunningEvent.id)
      }
    }

    // Log to audit trail
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('org_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single()

    if (subscription) {
      await supabase.from('audit_logs').insert({
        org_id: subscription.org_id,
        user_id: subscription.user_id,
        action: 'payment_succeeded',
        payload: {
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
        },
        severity: 'info',
      })
    }

    return { success: true, message: 'Payment recorded and dunning resolved' }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[StripeWebhook] handlePaymentSucceeded error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

/**
 * Handle customer.subscription.updated event
 * Updates subscription status in database
 */
async function handleSubscriptionUpdated(
  event: StripeWebhookEvent,
  supabase: any
): Promise<{ success: boolean; message?: string }> {
  const subscription = event.data.object

  console.log('[StripeWebhook] Subscription updated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer,
  })

  try {
    // Update subscription in database
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        metadata: {
          stripe_customer_id: subscription.customer,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('[StripeWebhook] Error updating subscription:', error)
      return { success: false, message: error.message }
    }

    console.log('[StripeWebhook] Subscription updated successfully')
    return { success: true, message: 'Subscription updated' }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[StripeWebhook] handleSubscriptionUpdated error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  event: StripeWebhookEvent,
  supabase: any
): Promise<{ success: boolean; message?: string }> {
  const subscription = event.data.object

  console.log('[StripeWebhook] Subscription deleted:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  })

  try {
    // Mark subscription as canceled
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        metadata: {
          canceled_at: new Date().toISOString(),
          cancel_reason: subscription.cancellation_details?.reason || 'customer_request',
        },
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('[StripeWebhook] Error canceling subscription:', error)
      return { success: false, message: error.message }
    }

    console.log('[StripeWebhook] Subscription canceled successfully')
    return { success: true, message: 'Subscription canceled' }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[StripeWebhook] handleSubscriptionDeleted error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}
