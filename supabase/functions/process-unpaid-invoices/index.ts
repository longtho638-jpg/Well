/**
 * Process Unpaid Invoices - Supabase Edge Function
 *
 * Detects unpaid invoices from Stripe (not just failed payments) and creates
 * dunning events for missing ones. Runs daily to catch invoices that were
 * created but never paid.
 *
 * Scheduled via pg_cron: 0 9 * * * (daily at 9 AM UTC)
 *
 * Response: { success: boolean, processedCount: number, createdCount: number }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.18.0?dts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

interface ProcessResult {
  success: boolean
  processedCount: number
  createdCount: number
  skippedCount: number
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('[ProcessUnpaidInvoices] Starting cron job...')

    // Step 1: Query Stripe for unpaid invoices (3+ days past due)
    const threeDaysAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60)

    const unpaidInvoices = await stripe.invoices.list({
      status: 'open',
      due_date: {
        lte: threeDaysAgo,
      },
      limit: 100,
    })

    if (!unpaidInvoices.data || unpaidInvoices.data.length === 0) {
      console.log('[ProcessUnpaidInvoices] No unpaid invoices found')
      return new Response(JSON.stringify({
        success: true,
        processedCount: 0,
        createdCount: 0,
        skippedCount: 0,
        message: 'No unpaid invoices',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[ProcessUnpaidInvoices] Found ${unpaidInvoices.data.length} unpaid invoices`)

    const result: ProcessResult = {
      success: true,
      processedCount: 0,
      createdCount: 0,
      skippedCount: 0,
    }

    // Step 2: Process each unpaid invoice
    for (const invoice of unpaidInvoices.data) {
      result.processedCount++

      // Get customer details
      const customer = await stripe.customers.retrieve(invoice.customer as string)
      if (customer.deleted) {
        console.log('[ProcessUnpaidInvoices] Customer deleted, skipping:', invoice.id)
        continue
      }

      const orgId = customer.metadata?.org_id
      const userId = customer.metadata?.user_id

      if (!orgId) {
        console.warn('[ProcessUnpaidInvoices] Missing org_id for invoice:', invoice.id)
        continue
      }

      // Step 3: Check if dunning event already exists
      const { data: existingDunning } = await supabase
        .from('dunning_events')
        .select('id')
        .eq('stripe_invoice_id', invoice.id)
        .single()

      if (existingDunning) {
        console.log('[ProcessUnpaidInvoices] Dunning exists, skipping:', invoice.id)
        result.skippedCount++
        continue
      }

      // Step 4: Create dunning event for unpaid invoice
      const amountOwed = invoice.amount_remaining ? invoice.amount_remaining / 100 : 0

      const { data: dunningData, error: dunningError } = await supabase.rpc('log_dunning_event', {
        p_org_id: orgId,
        p_user_id: userId || null,
        p_subscription_id: null,
        p_stripe_invoice_id: invoice.id,
        p_stripe_subscription_id: (invoice.subscription as string) || null,
        p_stripe_customer_id: invoice.customer as string,
        p_amount_owed: amountOwed,
        p_currency: invoice.currency?.toUpperCase() || 'USD',
        p_payment_url: invoice.hosted_invoice_url || null,
      })

      if (dunningError) {
        console.error('[ProcessUnpaidInvoices] Failed to create dunning:', dunningError)
        continue
      }

      console.log('[ProcessUnpaidInvoices] Created dunning event:', dunningData)
      result.createdCount++

      // Step 5: Create notification for user
      if (userId) {
        await supabase.rpc('create_user_notification', {
          p_user_id: userId,
          p_title: 'Hóa đơn chưa thanh toán',
          p_message: `Hóa đơn ${invoice.id} của bạn chưa được thanh toán. Số tiền: $${amountOwed.toFixed(2)}. Vui lòng thanh toán để tránh bị đình chỉ.`,
          p_action_url: '/dashboard/billing',
          p_type: 'invoice_unpaid',
        })
      }
    }

    console.log(`[ProcessUnpaidInvoices] Completed: ${result.processedCount} processed, ${result.createdCount} created, ${result.skippedCount} skipped`)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[ProcessUnpaidInvoices] Error:', error)

    return new Response(JSON.stringify({
      success: false,
      processedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
