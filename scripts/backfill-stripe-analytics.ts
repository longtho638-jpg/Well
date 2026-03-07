#!/usr/bin/env node
/**
 * Backfill Migration Script - Stripe → Local Analytics Tables
 * Migrates historical Stripe data to local analytics tables for cohort analysis.
 * This script is idempotent and can be run multiple times safely.
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

interface StripeCustomer {
  id: string
  email?: string
  created: number
  metadata: { polar_customer_id?: string; [key: string]: string }
}

interface StripeSubscription {
  id: string
  customer: string
  status: string
  created: number
  items: {
    data: Array<{
      price: {
        product: string
        unit_amount?: number
        recurring?: { interval: string }
      }
    }>
  }
}

interface StripePaymentIntent {
  id: string
  customer: string
  amount: number
  created: number
  status: string
  metadata: { license_id?: string; user_id?: string; [key: string]: string }
}

function mapProductToTier(productId: string): string {
  const productMap: Record<string, string> = {
    'prod_master': 'master',
    'prod_enterprise': 'enterprise',
    'prod_premium': 'premium',
    'prod_basic': 'basic',
  }
  return productMap[productId] || 'free'
}

function stripeDateToDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0]
}

async function backfill() {
  console.warn('Starting Stripe → Analytics backfill...')
  console.warn('Supabase:', SUPABASE_URL)

  let totalCustomers = 0
  let totalSubscriptions = 0
  let totalPayments = 0
  let backfilledCustomers = 0
  let backfilledSubscriptions = 0
  let backfilledPayments = 0

  try {
    console.warn('\nBackfilling customers...')
    const customersIterator = stripe.customers.list({ limit: 100 })
    for await (const customer of customersIterator) {
      totalCustomers++
      const stripeCustomer = customer as unknown as StripeCustomer
      const cohortMonth = stripeDateToDate(stripeCustomer.created)
      const { data: existing } = await supabase
        .from('customer_cohorts')
        .select('id')
        .eq('customer_id', stripeCustomer.id)
        .single()
      if (existing) continue
      const { error } = await supabase
        .from('customer_cohorts')
        .insert({
          customer_id: stripeCustomer.id,
          cohort_month: cohortMonth,
          initial_tier: 'free',
          current_tier: 'free',
          status: 'active',
          first_purchase_date: null,
          customer_email: stripeCustomer.email,
          geography: 'VN',
        })
      if (error) {
        console.error(`Failed to insert customer ${stripeCustomer.id}:`, error.message)
      } else {
        backfilledCustomers++
      }
    }

    console.warn('\nBackfilling subscriptions...')
    const subscriptionsIterator = stripe.subscriptions.list({ limit: 100, status: 'all' })
    for await (const subscription of subscriptionsIterator) {
      totalSubscriptions++
      const stripeSub = subscription as unknown as StripeSubscription
      const customerId = stripeSub.customer as string
      const priceItem = stripeSub.items.data[0]
      const productId = priceItem?.price.product as string
      const tier = mapProductToTier(productId)
      const amountCents = priceItem?.price.unit_amount || 0
      const interval = priceItem?.price.recurring?.interval || 'month'
      const mrrCents = interval === 'year' ? amountCents / 12 : amountCents
      const { error } = await supabase
        .from('customer_cohorts')
        .update({
          current_tier: tier,
          current_mrr_cents: mrrCents,
          initial_tier: tier,
          initial_mrr_cents: mrrCents,
          status: stripeSub.status === 'active' ? 'active' :
                  stripeSub.status === 'canceled' ? 'churned' :
                  stripeSub.status === 'past_due' ? 'past_due' : 'active',
          churned_date: stripeSub.status === 'canceled' ? stripeDateToDate(stripeSub.ended_at || 0) : null,
          last_activity_date: stripeDateToDate(stripeSub.current_period_start),
        })
        .eq('customer_id', customerId)
      if (error) {
        console.error(`Failed to update subscription ${stripeSub.id}:`, error.message)
      } else {
        backfilledSubscriptions++
      }
    }

    console.warn('\nBackfilling payments...')
    const paymentsIterator = stripe.paymentIntents.list({ limit: 100 })
    for await (const payment of paymentsIterator) {
      totalPayments++
      const stripePayment = payment as unknown as StripePaymentIntent
      const customerId = stripePayment.customer as string
      const amountCents = stripePayment.amount
      const eventId = `pi_${stripePayment.id}`
      const { data: existing } = await supabase
        .from('polar_webhook_events')
        .select('id')
        .eq('event_id', eventId)
        .single()
      if (existing) continue
      const { error } = await supabase
        .from('polar_webhook_events')
        .insert({
          event_id: eventId,
          event_type: stripePayment.status === 'succeeded' ? 'payment.succeeded' : 'payment.failed',
          customer_id: customerId,
          amount_cents: amountCents,
          currency: 'VND',
          payload: stripePayment,
          processed: true,
          processed_at: stripeDateToDate(stripePayment.created),
          received_at: stripeDateToDate(stripePayment.created),
        })
      if (error) {
        console.error(`Failed to insert payment ${stripePayment.id}:`, error.message)
      } else {
        backfilledPayments++
      }
    }

    console.warn('\nComputing cohort metrics...')
    const { data: cohorts } = await supabase
      .from('customer_cohorts')
      .select('cohort_month')
      .group('cohort_month')
    if (cohorts) {
      for (const cohort of cohorts) {
        const cohortMonth = cohort.cohort_month
        for (const periodDay of [0, 30, 60, 90]) {
          const result = await supabase.rpc('compute_cohort_metrics', {
            p_cohort_month: cohortMonth,
            p_period_day: periodDay,
          })
          if (result.error) {
            console.error(`Failed to compute metrics for ${cohortMonth} D${periodDay}:`, result.error.message)
          }
        }
      }
    }

    console.warn('\nBackfill complete!')
    console.warn('============================')
    console.warn(`Customers:  ${backfilledCustomers}/${totalCustomers} backfilled`)
    console.warn(`Subscriptions: ${backfilledSubscriptions}/${totalSubscriptions} backfilled`)
    console.warn(`Payments:   ${backfilledPayments}/${totalPayments} backfilled`)
    console.warn('============================')
  } catch (error: any) {
    console.error('Backfill failed:', error.message)
    process.exit(1)
  }
}

backfill()
