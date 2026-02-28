import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyWebhookSignature } from '../_shared/vibe-payos/mod.ts'
import type { PayOSWebhookData, PayOSWebhookPayload } from '../_shared/vibe-payos/mod.ts'

// ─── Types ──────────────────────────────────────────────────────

interface OrderItem {
  product_name: string
  quantity: number
  unit_price?: number
}

// ─── Main handler ───────────────────────────────────────────────

serve(async (req) => {
  // Verify Webhook Secret
  const secret = req.headers.get("x-webhook-secret")
  const expectedSecret = Deno.env.get("WEBHOOK_SECRET")

  if (!expectedSecret) {
    console.error("[Security] WEBHOOK_SECRET is not configured")
    return new Response("Server configuration error", { status: 500 })
  }

  // GET = PayOS URL verification ping
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (secret !== expectedSecret) {
    console.error("[Security] Invalid Webhook Secret")
    return new Response("Unauthorized", { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Parse & verify signature via SDK
    const payload: PayOSWebhookPayload = await req.json()

    if (!payload.signature) {
      await logAudit(supabase, null, 'PAYOS_WEBHOOK_FAILED', { error: 'Missing signature' }, 'failure')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
    if (!checksumKey) throw new Error('PAYOS_CHECKSUM_KEY not configured')

    const isValid = await verifyWebhookSignature(
      payload.data as unknown as Record<string, unknown>,
      payload.signature,
      checksumKey,
    )

    if (!isValid) {
      console.error('Signature mismatch')
      await logAudit(supabase, null, 'PAYOS_WEBHOOK_FAILED', { error: 'Invalid signature' }, 'failure')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Find order or subscription intent
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, user_id, order_code')
      .eq('order_code', payload.data.orderCode)
      .single()

    if (fetchError || !currentOrder) {
      // Check subscription payment intent
      const { data: intent } = await supabase
        .from('subscription_payment_intents')
        .select('id, user_id, plan_id, billing_cycle, status, org_id')
        .eq('payos_order_code', payload.data.orderCode)
        .single()

      if (intent) {
        return await handleSubscriptionWebhook(supabase, intent, payload.data)
      }

      console.error('Order not found:', payload.data.orderCode)
      await logAudit(supabase, null, 'PAYOS_WEBHOOK_FAILED', { error: 'Order not found', orderCode: payload.data.orderCode }, 'failure')
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Determine new status
    let newStatus = 'pending'
    if (payload.data.code === '00') newStatus = 'paid'
    else if (payload.data.code === '01') newStatus = 'cancelled'

    // 4. State machine — idempotency guard
    if (currentOrder.status === 'paid' || currentOrder.status === 'cancelled') {
      await logAudit(supabase, currentOrder.user_id, 'PAYOS_WEBHOOK_IGNORED', {
        orderId: currentOrder.id, currentStatus: currentOrder.status, newStatus, reason: 'Order already finalized'
      }, 'info')

      return new Response(
        JSON.stringify({ success: true, status: currentOrder.status, message: 'Order already finalized' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Atomic update (optimistic concurrency)
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus, payment_data: payload.data, updated_at: new Date().toISOString() })
      .eq('id', currentOrder.id)
      .eq('status', 'pending')
      .select('id, status')
      .single()

    if (updateError || !updatedOrder) {
      return new Response(
        JSON.stringify({ success: true, status: 'already_finalized', message: 'Concurrent webhook already processed' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    await logAudit(supabase, currentOrder.user_id, 'PAYOS_WEBHOOK_SUCCESS', {
      orderId: currentOrder.id, oldStatus: currentOrder.status, newStatus, amount: payload.data.amount
    }, 'success')

    // 6. Side effects on payment success
    if (newStatus === 'paid') {
      // Sync to transactions table
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference_id', currentOrder.id)
        .eq('type', 'sale')
        .limit(1)

      if (!existingTx || existingTx.length === 0) {
        await supabase.from('transactions').insert({
          user_id: currentOrder.user_id,
          amount: payload.data.amount,
          type: 'sale',
          status: 'completed',
          description: `PayOS đơn hàng #${payload.data.orderCode}`,
          reference_id: currentOrder.id,
          created_at: new Date().toISOString(),
        }).catch((err: Error) => console.error('Failed to sync transaction:', err))
      }

      // Email notification (fire-and-forget)
      if (currentOrder.user_id) {
        const [userResult, itemsResult] = await Promise.all([
          supabase.from('users').select('email, full_name').eq('id', currentOrder.user_id).single(),
          supabase.from('order_items').select('product_name, quantity, unit_price').eq('order_id', currentOrder.id),
        ])

        if (userResult.data?.email) {
          supabase.functions.invoke('send-email', {
            body: {
              to: userResult.data.email,
              subject: `✅ Đơn hàng #${payload.data.orderCode} đã được xác nhận!`,
              templateType: 'order-confirmation',
              data: {
                userName: userResult.data.full_name || 'Bạn',
                orderId: String(payload.data.orderCode),
                orderDate: new Date().toLocaleDateString('vi-VN'),
                totalAmount: `${payload.data.amount.toLocaleString('vi-VN')} VND`,
                items: (itemsResult.data || []).map((i: OrderItem) => ({
                  name: i.product_name, quantity: i.quantity,
                  price: `${(i.unit_price || 0).toLocaleString('vi-VN')} VND`,
                })),
              },
            },
          }).catch((err) => console.error('Email send failed:', err))
        }
      }

      // Commission distribution (fire-and-forget)
      if (currentOrder.user_id) {
        const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
        supabase.functions.invoke('agent-reward', {
          body: {
            record: { id: currentOrder.id, user_id: currentOrder.user_id, total_vnd: payload.data.amount, status: 'completed' },
            old_record: { status: 'pending' },
          },
          ...(webhookSecret ? { headers: { 'x-webhook-secret': webhookSecret } } : {}),
        }).catch((err) => console.error('Commission distribution failed:', err))
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ─── Subscription webhook handler ───────────────────────────────

async function handleSubscriptionWebhook(
  supabase: ReturnType<typeof createClient>,
  intent: { id: string; user_id: string; plan_id: string; billing_cycle: string; status: string; org_id?: string | null },
  data: PayOSWebhookData
): Promise<Response> {
  if (intent.status !== 'pending') {
    return new Response(
      JSON.stringify({ success: true, message: 'Subscription already processed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const isPaid = data.code === '00'
  const isCanceled = data.code === '01'
  const newIntentStatus = isPaid ? 'paid' : isCanceled ? 'canceled' : 'pending'

  await supabase
    .from('subscription_payment_intents')
    .update({ status: newIntentStatus, completed_at: new Date().toISOString() })
    .eq('id', intent.id)
    .eq('status', 'pending')

  if (isPaid) {
    const periodEnd = new Date()
    if (intent.billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('user_id', intent.user_id)
      .in('status', ['active', 'trialing'])

    const { error: subError } = await supabase.from('user_subscriptions').insert({
      user_id: intent.user_id,
      plan_id: intent.plan_id,
      billing_cycle: intent.billing_cycle,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      payos_order_code: data.orderCode,
      last_payment_at: new Date().toISOString(),
      next_payment_at: periodEnd.toISOString(),
      org_id: intent.org_id ?? null,
    })

    if (subError) console.error('[subscription] Create failed:', subError)
    else console.log(`[subscription] Activated for user ${intent.user_id}, plan ${intent.plan_id}`)
  }

  return new Response(
    JSON.stringify({ success: true, subscriptionStatus: newIntentStatus }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// ─── Audit helper ───────────────────────────────────────────────

async function logAudit(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  action: string,
  payload: Record<string, unknown>,
  severity: string,
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      payload: { ...payload, severity },
      user_agent: 'PayOS-Webhook-Service',
      ip_address: '0.0.0.0',
    })
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}
