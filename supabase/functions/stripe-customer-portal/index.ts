/**
 * Stripe Customer Portal - Edge Function
 *
 * Creates a Stripe Customer Portal session for self-service subscription management.
 * Users can upgrade/downgrade plans, update payment methods, and view billing history.
 *
 * POST /functions/v1/stripe-customer-portal
 * Headers:
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   customer_id: string,
 *   return_url?: string
 * }
 *
 * Response:
 * {
 *   url: string,
 *   expiresAt: number
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.18.0?dts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Parse request body
    const body = await req.json()
    const { customer_id, return_url } = body

    if (!customer_id) {
      return new Response(JSON.stringify({ error: 'Missing required field: customer_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate customer exists and has active subscription
    try {
      const customer = await stripe.customers.retrieve(customer_id)
      if (customer.deleted) {
        throw new Error('Customer not found')
      }

      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer_id,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length === 0) {
        // No active subscription - create portal session for product purchase
        console.warn('[StripePortal] No active subscription, creating for product purchase')
      }
    } catch (err) {
      console.error('[StripePortal] Customer validation error:', err)
      return new Response(JSON.stringify({
        error: 'Invalid customer ID',
        details: err instanceof Error ? err.message : 'Unknown error',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: return_url || 'https://wellnexus.vn/dashboard/billing',
      flow_data: {
        type: 'subscription_update_confirm',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: return_url || 'https://wellnexus.vn/dashboard/billing',
          },
        },
      },
    })

    // Session expires in 1 hour (Stripe default)
    const expiresAt = Date.now() + 3600000

    console.warn('[StripePortal] Created portal session:', session.id)

    return new Response(JSON.stringify({
      url: session.url,
      expiresAt,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[StripePortal] Error:', error)

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
