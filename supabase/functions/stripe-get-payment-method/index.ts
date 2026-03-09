/**
 * Stripe Get Payment Method Edge Function
 *
 * Fetches payment method details for a Stripe customer's subscription.
 * Used by PaymentUpdate page to display current payment method.
 *
 * Request:
 * {
 *   customer_id: string,
 *   subscription_id: string
 * }
 *
 * Response:
 * {
 *   payment_method: {
 *     id: string,
 *     type: string,
 *     card?: {
 *       brand: string,
 *       last4: string,
 *       exp_month: number,
 *       exp_year: number
 *     }
 *   } | null
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-requested-with, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { customer_id, subscription_id } = await req.json()

    if (!customer_id || !subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Missing customer_id or subscription_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    })

    // Get subscription to find payment method
    const subscription = await stripe.subscriptions.retrieve(subscription_id, {
      expand: ['default_payment_method', 'default_source'],
    })

    // Extract payment method from subscription
    const paymentMethodId =
      (subscription as any).default_payment_method?.id ||
      (subscription as any).default_source?.id

    if (!paymentMethodId) {
      // No payment method found
      return new Response(
        JSON.stringify({ payment_method: null }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    // Format response
    const response = {
      payment_method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.type === 'card' ? {
          brand: (paymentMethod as any).card?.brand || 'unknown',
          last4: (paymentMethod as any).card?.last4 || '****',
          exp_month: (paymentMethod as any).card?.exp_month,
          exp_year: (paymentMethod as any).card?.exp_year,
        } : null,
      },
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[stripe-get-payment-method] Error:', err)

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
