/**
 * Edge Function: Stripe Overage Invoice
 *
 * Creates Stripe invoice items and invoices for overage charges.
 * Supports idempotency to prevent duplicate invoices.
 *
 * POST /functions/v1/stripe-overage-invoice
 * Headers:
 *   Authorization: Bearer SERVICE_ROLE_KEY
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   org_id: string,
 *   user_id?: string,
 *   metric_type: string,
 *   overage_units: number,
 *   overage_cost: number,
 *   stripe_customer_id: string,
 *   idempotency_key: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   invoice_id: "in_xxx",
 *   invoice_item_id: "ii_xxx",
 *   invoice_url: "https://invoice.stripe.com/i/..."
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface OverageInvoiceRequest {
  org_id: string
  user_id?: string
  metric_type: string
  overage_units: number
  overage_cost: number
  stripe_customer_id: string
  idempotency_key: string
}

interface OverageInvoiceResponse {
  success: boolean
  invoice_id?: string
  invoice_item_id?: string
  invoice_url?: string
  error?: string
}

const STRIPE_API_VERSION = '2024-06-20'

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

    // Validate SERVICE_ROLE_KEY authorization
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.substring(7)
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Parse request body
    const body: OverageInvoiceRequest = await req.json()
    const {
      org_id,
      user_id,
      metric_type,
      overage_units,
      overage_cost,
      stripe_customer_id,
      idempotency_key,
    } = body

    // Validate required fields
    if (!org_id || !metric_type || !overage_units || !overage_cost || !stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[stripe-overage-invoice] Request:', {
      org_id,
      metric_type,
      overage_units,
      overage_cost,
      stripe_customer_id,
      idempotency_key,
    })

    // Check for existing invoice (idempotency)
    const existingInvoice = await checkExistingInvoice(supabase, idempotency_key)
    if (existingInvoice) {
      console.log('[stripe-overage-invoice] Invoice already exists:', existingInvoice)
      return new Response(JSON.stringify({
        success: true,
        invoice_id: existingInvoice.invoice_id,
        invoice_item_id: existingInvoice.invoice_item_id,
        invoice_url: existingInvoice.invoice_url,
      } as OverageInvoiceResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get Stripe API key
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeApiKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const stripeBaseUrl = Deno.env.get('STRIPE_BASE_URL') || 'https://api.stripe.com/v1'

    // Create invoice item first
    const invoiceItemResult = await createInvoiceItem(
      stripeBaseUrl,
      stripeApiKey,
      {
        customer: stripe_customer_id,
        amount: Math.round(overage_cost * 100), // Convert to cents
        currency: 'usd',
        description: `Overage: ${metric_type} (${overage_units.toLocaleString()} units)`,
        metadata: {
          org_id,
          metric_type,
          overage_units: String(overage_units),
        },
      },
      idempotency_key
    )

    if (!invoiceItemResult.success) {
      throw new Error(invoiceItemResult.error)
    }

    console.log('[stripe-overage-invoice] Invoice item created:', invoiceItemResult.data?.id)

    // Create invoice (or get existing one for customer with auto_advance)
    const invoiceResult = await createInvoice(
      stripeBaseUrl,
      stripeApiKey,
      stripe_customer_id,
      idempotency_key
    )

    if (!invoiceResult.success) {
      throw new Error(invoiceResult.error)
    }

    console.log('[stripe-overage-invoice] Invoice created:', invoiceResult.data?.id)

    // Update database with invoice IDs
    const dbUpdateResult = await updateOverageEventWithInvoice(
      supabase,
      org_id,
      metric_type,
      invoiceResult.data?.id,
      invoiceItemResult.data?.id
    )

    if (!dbUpdateResult.success) {
      console.error('[stripe-overage-invoice] Failed to update database:', dbUpdateResult.error)
      // Don't fail the whole request - invoice was created successfully
    }

    // Build response
    const response: OverageInvoiceResponse = {
      success: true,
      invoice_id: invoiceResult.data?.id,
      invoice_item_id: invoiceItemResult.data?.id,
      invoice_url: invoiceResult.data?.hosted_invoice_url,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[stripe-overage-invoice] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as OverageInvoiceResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Check for existing invoice by idempotency key
 */
async function checkExistingInvoice(
  supabase: any,
  idempotencyKey: string
): Promise<{ invoice_id: string; invoice_item_id: string; invoice_url: string } | null> {
  try {
    const { data } = await supabase
      .from('overage_events')
      .select('stripe_invoice_id, stripe_invoice_item_id')
      .eq('idempotency_key', idempotencyKey)
      .eq('status', 'invoiced')
      .single()

    if (data?.stripe_invoice_id) {
      return {
        invoice_id: data.stripe_invoice_id,
        invoice_item_id: data.stripe_invoice_item_id || '',
        invoice_url: `https://invoice.stripe.com/i/${data.stripe_invoice_id}`,
      }
    }

    return null
  } catch (error) {
    console.error('[stripe-overage-invoice] checkExistingInvoice error:', error)
    return null
  }
}

/**
 * Create Stripe invoice item
 */
async function createInvoiceItem(
  stripeBaseUrl: string,
  stripeApiKey: string,
  params: {
    customer: string
    amount: number
    currency: string
    description: string
    metadata: Record<string, string>
  },
  idempotencyKey: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('customer', params.customer)
    formData.append('amount', String(params.amount))
    formData.append('currency', params.currency)
    formData.append('description', params.description)

    Object.entries(params.metadata).forEach(([key, value]) => {
      formData.append(`metadata[${key}]`, value)
    })

    const response = await fetch(`${stripeBaseUrl}/invoiceitems`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `${idempotencyKey}_item`,
        'Stripe-Version': STRIPE_API_VERSION,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Stripe API error')
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[stripe-overage-invoice] createInvoiceItem error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create Stripe invoice from pending invoice items
 */
async function createInvoice(
  stripeBaseUrl: string,
  stripeApiKey: string,
  customerId: string,
  idempotencyKey: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('customer', customerId)
    formData.append('auto_advance', 'true')
    formData.append('collection_method', 'charge_automatically')

    const response = await fetch(`${stripeBaseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `${idempotencyKey}_invoice`,
        'Stripe-Version': STRIPE_API_VERSION,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Stripe API error')
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[stripe-overage-invoice] createInvoice error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update overage_events table with invoice IDs
 */
async function updateOverageEventWithInvoice(
  supabase: any,
  orgId: string,
  metricType: string,
  invoiceId?: string,
  invoiceItemId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('overage_events')
      .update({
        stripe_invoice_id: invoiceId,
        stripe_invoice_item_id: invoiceItemId,
        status: 'invoiced',
        invoiced_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('metric_type', metricType)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('[stripe-overage-invoice] updateOverageEventWithInvoice error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
