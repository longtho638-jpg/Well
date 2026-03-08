/**
 * Stripe Dunning Webhook Handler - Supabase Edge Function
 *
 * Handles Stripe webhook events for payment failures and dunning management:
 * - invoice.payment_failed: Trigger dunning sequence
 * - customer.subscription.updated: Sync subscription status
 * - invoice.upcoming: Send pre-renewal notifications
 * - invoice.paid: Resolve dunning events
 * - payment_intent.payment_failed: Notify users of failed payments
 *
 * POST /functions/v1/stripe-dunning
 * Headers:
 *   Stripe-Signature: <webhook_signature>
 *
 * Body: Stripe webhook event payload
 *
 * Response:
 * { received: true, event_type: string, processed: boolean }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.18.0?dts'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

// Dunning email sequence configuration
const DUNNING_SEQUENCE = [
  { stage: 'initial', day: 0, template: 'dunning-initial' },
  { stage: 'reminder', day: 2, template: 'dunning-reminder' },
  { stage: 'final', day: 5, template: 'dunning-final' },
  { stage: 'cancel_notice', day: 10, template: 'dunning-cancel' },
]

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://wellnexus.vn'
const RAAAS_GATEWAY_URL = Deno.env.get('RAAS_GATEWAY_URL') || 'https://raas.agencyos.network'

interface DetailedWebhookResponse {
  success: boolean
  event_type: string
  processed: boolean
  error?: string
  dunning_id?: string
  metadata?: any
}

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey)

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

    // Get Stripe signature
    const signature = req.headers.get('Stripe-Signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing Stripe-Signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Read and parse webhook payload
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('[StripeDunning] Webhook signature verification failed:', err)
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.warn('[StripeDunning] Received event:', event.type, event.id)

    // Process event by type
    const result: DetailedWebhookResponse = {
      success: true,
      event_type: event.type,
      processed: true,
    }

    switch (event.type) {
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, supabase, result)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, supabase, result)
        break

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event, supabase, result)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event, supabase, result)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, supabase, result)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event, supabase, result)
        break

      default:
        console.warn('[StripeDunning] Unhandled event type:', event.type)
        result.processed = false
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[StripeDunning] Error:', error)

    // Log failed webhook
    try {
      const body = await req.text()
      await supabase
        .from('failed_webhooks')
        .insert({
          webhook_id: 'unknown',
          event_type: 'unknown',
          payload: JSON.parse(body || '{}'),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          next_retry_at: new Date(Date.now() + 3600000).toISOString(),
        })
    } catch (logError) {
      console.error('[StripeDunning] Failed to log error:', logError)
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ============================================================
// Event Handlers
// ============================================================

/**
 * Handle invoice.payment_failed event
 * Trigger: Payment for an invoice fails
 */
async function handleInvoicePaymentFailed(
  event: Stripe.Event,
  supabase: any,
  result: DetailedWebhookResponse
) {
  const invoice = event.data.object as Stripe.Invoice
  console.warn('[StripeDunning] invoice.payment_failed:', invoice.id)

  // Get customer details
  const customer = await stripe.customers.retrieve(invoice.customer as string)
  if (customer.deleted) {
    console.warn('[StripeDunning] Customer deleted:', invoice.customer)
    return
  }

  const orgId = customer.metadata?.org_id
  const userId = customer.metadata?.user_id

  if (!orgId) {
    console.error('[StripeDunning] Missing org_id in customer metadata')
    throw new Error('Missing org_id in customer metadata')
  }

  // Get dunning config
  const { data: config } = await supabase.rpc('get_dunning_config', { p_org_id: orgId })
  const dunningEnabled = config?.enabled !== false

  if (!dunningEnabled) {
    console.warn('[StripeDunning] Dunning disabled for org:', orgId)
    result.metadata = { dunning_enabled: false }
    return
  }

  // Create dunning event
  const { data: dunningData, error: dunningError } = await supabase.rpc('log_dunning_event', {
    p_org_id: orgId,
    p_user_id: userId,
    p_subscription_id: null,
    p_stripe_invoice_id: invoice.id,
    p_stripe_subscription_id: invoice.subscription as string,
    p_stripe_customer_id: invoice.customer as string,
    p_amount_owed: invoice.amount_remaining ? invoice.amount_remaining / 100 : 0,
    p_currency: invoice.currency?.toUpperCase() || 'USD',
    p_payment_url: invoice.hosted_invoice_url || null,
  })

  if (dunningError) {
    console.error('[StripeDunning] Failed to log dunning event:', dunningError)
    throw dunningError
  }

  result.dunning_id = dunningData
  result.metadata = {
    org_id: orgId,
    user_id: userId,
    amount_owed: invoice.amount_remaining / 100,
    dunning_enabled: true,
  }

  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      metadata: {
        ...((await supabase
          .from('user_subscriptions')
          .select('metadata')
          .eq('stripe_subscription_id', invoice.subscription)
          .single())
          .data?.metadata || {}),
        dunning_started_at: new Date().toISOString(),
        last_payment_failed_at: new Date().toISOString(),
      },
    })
    .eq('stripe_subscription_id', invoice.subscription)

  // Create notification for user
  if (userId) {
    await supabase.rpc('create_user_notification', {
      p_user_id: userId,
      p_title: 'Thanh toán thất bại',
      p_message: `Thanh toán của bạn cho hóa đơn ${invoice.id} đã thất bại. Số tiền: $${(invoice.amount_due || 0) / 100}. Vui lòng cập nhật phương thức thanh toán.`,
      p_action_url: '/dashboard/billing',
      p_type: 'payment_failed',
    })
  }

  // Sync to RaaS Gateway for license state consistency
  try {
    await fetch(`${RAAAS_GATEWAY_URL}/api/v1/license/sync-billing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RAAS_GATEWAY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_id: orgId,
        subscription_status: 'past_due',
        stripe_subscription_id: invoice.subscription,
        failed_invoice_id: invoice.id,
        amount_owed: invoice.amount_remaining / 100,
      }),
    })
    console.warn('[StripeDunning] Synced to RaaS Gateway:', orgId)
  } catch (gatewayError) {
    console.error('[StripeDunning] Failed to sync to RaaS Gateway:', gatewayError)
    // Don't throw - gateway failure shouldn't fail the whole webhook
  }

  // Send dunning email (if enabled)
  if (config?.auto_send_emails && invoice.customer_email) {
    try {
      await sendDunningEmail(supabase, {
        to: invoice.customer_email,
        template: 'dunning-initial',
        orgId,
        userId,
        amount: (invoice.amount_due || 0) / 100,
        invoiceId: invoice.id,
        paymentUrl: invoice.hosted_invoice_url,
      })

      // Mark email as sent
      await supabase.rpc('advance_dunning_stage', {
        p_dunning_id: dunningData,
        p_new_stage: 'initial',
        p_email_template: 'dunning-initial',
        p_email_sent: true,
      })
    } catch (emailError) {
      console.error('[StripeDunning] Failed to send dunning email:', emailError)
    }
  }

  // Send SMS notification (if phone available)
  if (userId && config?.auto_send_sms) {
    const phone = await getUserPhoneNumber(supabase, userId)
    if (phone) {
      try {
        await sendDunningSms(supabase, {
          to: phone,
          template: 'dunning-initial',
          orgId,
          userId,
          dunningEventId: dunningData,
          templateData: {
            amount: `$${((invoice.amount_due || 0) / 100).toFixed(2)}`,
            plan_name: 'Subscription',
            payment_url: invoice.hosted_invoice_url || '/dashboard/billing',
          },
        })
        console.warn('[StripeDunning] SMS sent:', phone)
      } catch (smsError) {
        console.error('[StripeDunning] Failed to send SMS:', smsError)
      }
    }
  }

  console.warn('[StripeDunning] Dunning event created:', dunningData)
}

/**
 * Handle customer.subscription.updated event
 * Trigger: Subscription status changes
 */
async function handleSubscriptionUpdated(
  event: Stripe.Event,
  supabase: any,
  result: DetailedWebhookResponse
) {
  const subscription = event.data.object as Stripe.Subscription
  console.warn('[StripeDunning] customer.subscription.updated:', subscription.id)

  // Map Stripe status to local status
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'unpaid': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
  }

  const localStatus = statusMap[subscription.status] || 'active'

  // Get customer to find org_id
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  const orgId = customer.metadata?.org_id

  if (!orgId) {
    console.warn('[StripeDunning] Missing org_id for subscription update')
    result.metadata = { org_id_missing: true }
    return
  }

  // Update subscription in database
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: localStatus,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toISOString()
        : null,
      metadata: {
        ...((await supabase
          .from('user_subscriptions')
          .select('metadata')
          .eq('stripe_subscription_id', subscription.id)
          .single())
          .data?.metadata || {}),
        stripe_status: subscription.status,
        updated_at: new Date().toISOString(),
      },
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[StripeDunning] Failed to update subscription:', error)
    throw error
  }

  // Handle transition from past_due to active (payment recovery)
  if (subscription.status === 'active') {
    // Resolve any open dunning events
    const { data: openDunning } = await supabase
      .from('dunning_events')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .eq('resolved', false)
      .single()

    if (openDunning) {
      await supabase.rpc('resolve_dunning_event', {
        p_dunning_id: openDunning.id,
        p_resolution_method: 'payment_success',
      })
      result.metadata = { dunning_resolved: true }
    }

    // Sync to RaaS Gateway - restore license
    try {
      await fetch(`${RAAAS_GATEWAY_URL}/api/v1/license/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RAAS_GATEWAY_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_id: orgId,
          subscription_status: 'active',
          stripe_subscription_id: subscription.id,
        }),
      })
    } catch (gatewayError) {
      console.error('[StripeDunning] Failed to sync restore to RaaS Gateway:', gatewayError)
    }
  }

  console.warn('[StripeDunning] Subscription updated:', subscription.id, '->', localStatus)
}

/**
 * Handle invoice.upcoming event
 * Trigger: Invoice preview generated before billing
 */
async function handleInvoiceUpcoming(
  event: Stripe.Event,
  supabase: any,
  result: DetailedWebhookResponse
) {
  const invoice = event.data.object as Stripe.Invoice
  console.warn('[StripeDunning] invoice.upcoming:', invoice.id)

  // Get customer
  const customer = await stripe.customers.retrieve(invoice.customer as string)
  const orgId = customer.metadata?.org_id
  const userId = customer.metadata?.user_id

  if (!orgId) {
    result.metadata = { org_id_missing: true }
    return
  }

  // Send pre-renewal notification
  if (userId && customer.email) {
    await supabase.rpc('create_user_notification', {
      p_user_id: userId,
      p_title: 'Hóa đơn sắp đến hạn',
      p_message: `Hóa đơn tiếp theo của bạn sẽ đến hạn vào ${new Date((invoice.lines?.data?.[0]?.period?.end || 0) * 1000).toLocaleDateString()}. Số tiền: $${(invoice.amount_due || 0) / 100}.`,
      p_action_url: '/dashboard/billing',
      p_type: 'invoice_upcoming',
    })
  }

  console.warn('[StripeDunning] Invoice upcoming notification sent:', invoice.id)
}

/**
 * Handle invoice.paid event
 * Trigger: Invoice successfully paid
 */
async function handleInvoicePaid(
  event: Stripe.Event,
  supabase: any,
  result: DetailedWebhookResponse
) {
  const invoice = event.data.object as Stripe.Invoice
  console.warn('[StripeDunning] invoice.paid:', invoice.id)

  // Resolve dunning event if exists
  const { data: dunningEvent } = await supabase
    .from('dunning_events')
    .select('id, org_id, user_id')
    .eq('stripe_invoice_id', invoice.id)
    .single()

  if (dunningEvent) {
    await supabase.rpc('resolve_dunning_event', {
      p_dunning_id: dunningEvent.id,
      p_resolution_method: 'payment_success',
    })
    result.metadata = { dunning_resolved: true, dunning_id: dunningEvent.id }

    // Sync to RaaS Gateway - restore license
    if (dunningEvent.org_id) {
      try {
        await fetch(`${RAAAS_GATEWAY_URL}/api/v1/license/restore`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RAAS_GATEWAY_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            org_id: dunningEvent.org_id,
            subscription_status: 'active',
            paid_invoice_id: invoice.id,
          }),
        })
      } catch (gatewayError) {
        console.error('[StripeDunning] Failed to sync restore to RaaS Gateway:', gatewayError)
      }
    }

    // Send payment confirmation email
    const customer = await stripe.customers.retrieve(invoice.customer as string)
    if (customer.email && !customer.deleted) {
      await sendPaymentConfirmationEmail(supabase, {
        to: customer.email,
        orgId: dunningEvent.org_id,
        userId: dunningEvent.user_id,
        amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
        invoiceId: invoice.id,
      })
    }
  }

  console.warn('[StripeDunning] Invoice paid, dunning resolved:', invoice.id)
}

/**
 * Handle customer.subscription.deleted event
 * Trigger: Subscription canceled
 */
async function handleSubscriptionDeleted(
  event: Stripe.Event,
  supabase: any,
  result: DetailedWebhookResponse
) {
  const subscription = event.data.object as Stripe.Subscription
  console.warn('[StripeDunning] customer.subscription.deleted:', subscription.id)

  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      metadata: {
        ...((await supabase
          .from('user_subscriptions')
          .select('metadata')
          .eq('stripe_subscription_id', subscription.id)
          .single())
          .data?.metadata || {}),
        stripe_status: 'canceled',
        canceled_at: new Date().toISOString(),
      },
    })
    .eq('stripe_subscription_id', subscription.id)

  // Resolve any open dunning events
  const { data: openDunning } = await supabase
    .from('dunning_events')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .eq('resolved', false)
    .single()

  if (openDunning) {
    await supabase.rpc('resolve_dunning_event', {
      p_dunning_id: openDunning.id,
      p_resolution_method: 'subscription_canceled',
    })
  }

  // Sync to RaaS Gateway - revoke license
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  const orgId = customer.metadata?.org_id
  if (orgId) {
    try {
      await fetch(`${RAAAS_GATEWAY_URL}/api/v1/license/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RAAS_GATEWAY_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_id: orgId,
          reason: 'subscription_canceled',
          stripe_subscription_id: subscription.id,
        }),
      })
    } catch (gatewayError) {
      console.error('[StripeDunning] Failed to sync revoke to RaaS Gateway:', gatewayError)
    }
  }

  console.warn('[StripeDunning] Subscription deleted:', subscription.id)
}

/**
 * Handle payment_intent.payment_failed event
 * Trigger: Payment intent fails (for one-time payments)
 */
async function handlePaymentIntentFailed(
  event: Stripe.Event,
  supabase: any,
  result: DetailedWebhookResponse
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  console.warn('[StripeDunning] payment_intent.payment_failed:', paymentIntent.id)

  const customer = await stripe.customers.retrieve(paymentIntent.customer as string)
  const orgId = customer.metadata?.org_id
  const userId = customer.metadata?.user_id

  if (!orgId) {
    result.metadata = { org_id_missing: true }
    return
  }

  // Create notification for user
  if (userId) {
    await supabase.rpc('create_user_notification', {
      p_user_id: userId,
      p_title: 'Thanh toán thất bại',
      p_message: `Thanh toán của bạn đã thất bại. Số tiền: $${(paymentIntent.amount || 0) / 100}. Vui lòng thử lại.`,
      p_action_url: '/dashboard/billing',
      p_type: 'payment_failed',
    })
  }

  console.warn('[StripeDunning] Payment intent failed notification sent:', paymentIntent.id)
}

// ============================================================
// Email Helpers
// ============================================================

interface DunningEmailParams {
  to: string
  template: string
  orgId: string
  userId?: string
  amount: number
  invoiceId: string
  paymentUrl?: string | null
}

async function sendDunningEmail(
  supabase: any,
  params: DunningEmailParams
) {
  const { to, template, orgId, userId, amount, invoiceId, paymentUrl } = params

  // Get org/subscription details for email template
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('metadata')
    .eq('org_id', orgId)
    .single()

  const planName = subscription?.metadata?.plan_name || 'Subscription'

  // Call email service
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject: getDunningEmailSubject(template, amount),
      templateType: template,
      data: {
        userName: 'Bạn',
        amount: `$${amount.toFixed(2)}`,
        invoiceId,
        planName,
        paymentUrl: paymentUrl || '/dashboard/billing',
        daysUntilSuspension: getDaysUntilSuspension(template),
      },
    },
  })

  if (error) {
    throw new Error(`Failed to send dunning email: ${error.message}`)
  }
}

async function sendPaymentConfirmationEmail(
  supabase: any,
  params: { to: string; orgId: string; userId?: string; amount: number; invoiceId: string }
) {
  const { to, amount, invoiceId } = params

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject: '✅ Thanh toán thành công - WellNexus',
      templateType: 'payment-confirmation',
      data: {
        amount: `$${amount.toFixed(2)}`,
        invoiceId,
      },
    },
  })

  if (error) {
    console.error('[StripeDunning] Failed to send payment confirmation:', error)
  }
}

function getDunningEmailSubject(template: string, amount: number): string {
  switch (template) {
    case 'dunning-initial':
      return `⚠️ Thanh toán thất bại - $${amount.toFixed(2)}`
    case 'dunning-reminder':
      return `🔔 Nhắc nhở: Thanh toán quá hạn - $${amount.toFixed(2)}`
    case 'dunning-final':
      return `🚨 Cảnh báo cuối: Subscription sẽ bị đình chỉ`
    case 'dunning-cancel':
      return `❌ Subscription đã bị hủy`
    default:
      return `Thanh toán thất bại - $${amount.toFixed(2)}`
  }
}

function getDaysUntilSuspension(template: string): string {
  switch (template) {
    case 'dunning-initial':
      return '14'
    case 'dunning-reminder':
      return '12'
    case 'dunning-final':
      return '5'
    default:
      return '3'
  }
}

// ============================================================
// SMS Helpers - Twilio Integration
// ============================================================

interface SendSmsParams {
  to: string
  template: string
  orgId: string
  userId?: string
  dunningEventId?: string
  templateData?: Record<string, string>
}

async function sendDunningSms(
  supabase: any,
  params: SendSmsParams
): Promise<{ success: boolean; smsId?: string; error?: string }> {
  const { to, template, orgId, userId, dunningEventId, templateData } = params

  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to,
        template,
        locale: 'vi',
        orgId,
        userId,
        dunningEventId,
        templateData,
      },
    })

    if (error) {
      console.error('[StripeDunning] Failed to send SMS:', error)
      return { success: false, error: error.message }
    }

    return { success: true, smsId: data.smsId }
  } catch (err) {
    console.error('[StripeDunning] SMS error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function getUserPhoneNumber(
  supabase: any,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('id', userId)
      .single()

    if (error || !data?.phone) {
      return null
    }

    return data.phone
  } catch (err) {
    console.error('[StripeDunning] Error getting phone:', err)
    return null
  }
}

/**
 * Send SMS for dunning reminder stage
 */
async function sendDunningReminderSms(
  supabase: any,
  dunningEvent: any,
  userId: string,
  amount: number,
  daysUntilCancel: string,
  paymentUrl: string
) {
  const phone = await getUserPhoneNumber(supabase, userId)
  if (!phone) return

  try {
    await sendDunningSms(supabase, {
      to: phone,
      template: 'dunning-reminder',
      orgId: dunningEvent.org_id,
      userId,
      dunningEventId: dunningEvent.id,
      templateData: {
        amount: `$${amount.toFixed(2)}`,
        days: daysUntilCancel,
        payment_url: paymentUrl,
      },
    })
  } catch (err) {
    console.error('[StripeDunning] Failed to send reminder SMS:', err)
  }
}

/**
 * Send SMS for dunning final stage
 */
async function sendDunningFinalSms(
  supabase: any,
  dunningEvent: any,
  userId: string,
  amount: number,
  daysUntilCancel: string,
  paymentUrl: string
) {
  const phone = await getUserPhoneNumber(supabase, userId)
  if (!phone) return

  try {
    await sendDunningSms(supabase, {
      to: phone,
      template: 'dunning-final',
      orgId: dunningEvent.org_id,
      userId,
      dunningEventId: dunningEvent.id,
      templateData: {
        amount: `$${amount.toFixed(2)}`,
        days: daysUntilCancel,
        payment_url: paymentUrl,
      },
    })
  } catch (err) {
    console.error('[StripeDunning] Failed to send final SMS:', err)
  }
}

/**
 * Send SMS for dunning cancel stage
 */
async function sendDunningCancelSms(
  supabase: any,
  dunningEvent: any,
  userId: string,
  paymentUrl: string
) {
  const phone = await getUserPhoneNumber(supabase, userId)
  if (!phone) return

  try {
    await sendDunningSms(supabase, {
      to: phone,
      template: 'dunning-cancel',
      orgId: dunningEvent.org_id,
      userId,
      dunningEventId: dunningEvent.id,
      templateData: {
        payment_url: paymentUrl,
      },
    })
  } catch (err) {
    console.error('[StripeDunning] Failed to send cancel SMS:', err)
  }
}

/**
 * Send SMS for payment confirmation
 */
async function sendPaymentConfirmationSms(
  supabase: any,
  userId: string,
  orgId: string,
  amount: number
) {
  const phone = await getUserPhoneNumber(supabase, userId)
  if (!phone) return

  try {
    await sendDunningSms(supabase, {
      to: phone,
      template: 'payment_confirmation',
      orgId,
      userId,
      templateData: {
        amount: `$${amount.toFixed(2)}`,
      },
    })
  } catch (err) {
    console.error('[StripeDunning] Failed to send payment confirmation SMS:', err)
  }
}
