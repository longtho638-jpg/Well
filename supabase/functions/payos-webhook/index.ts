import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookData {
  orderCode: number
  amount: number
  description: string
  accountNumber: string
  reference: string
  transactionDateTime: string
  currency: string
  paymentLinkId: string
  code: string
  desc: string
  counterAccountBankId?: string
  counterAccountBankName?: string
  counterAccountName?: string
  counterAccountNumber?: string
  virtualAccountName?: string
  virtualAccountNumber?: string
}

interface OrderItem {
  product_name: string
  quantity: number
  unit_price?: number
}

interface WebhookPayload {
  data: WebhookData
  signature: string
}

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

serve(async (req) => {
  // SECURITY: Verify Webhook Secret (mandatory for POST requests)
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

  if (!expectedSecret) {
    console.error("[Security] WEBHOOK_SECRET is not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  // Handle GET requests for PayOS webhook URL verification
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (secret !== expectedSecret) {
    console.error("[Security] Invalid Webhook Secret");
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Parse webhook payload
    const payload: WebhookPayload = await req.json()
    const signature = payload.signature

    if (!signature) {
      await logAudit(supabase, null, 'PAYOS_WEBHOOK_FAILED', { error: 'Missing signature' }, 'failure')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get checksum key
    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
    if (!checksumKey) {
      console.error('PAYOS_CHECKSUM_KEY not configured')
      throw new Error('Server configuration error')
    }

    // 3. Verify webhook signature
    const sortedKeys = Object.keys(payload.data).sort()
    const signatureData = sortedKeys.map(key => `${key}=${payload.data[key as keyof WebhookData]}`).join('&')

    const encoder = new TextEncoder()
    const keyData = encoder.encode(checksumKey)
    const msgData = encoder.encode(signatureData)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const computedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (!secureCompare(signature, computedSignature)) {
      console.error('Signature mismatch:', { received: signature, computed: computedSignature })
      await logAudit(supabase, null, 'PAYOS_WEBHOOK_FAILED', { error: 'Invalid signature', payload }, 'failure')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Fetch current order to check state (Idempotency & State Machine)
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, user_id, order_code')
      .eq('order_code', payload.data.orderCode)
      .single()

    if (fetchError || !currentOrder) {
      // Không phải order thường — kiểm tra subscription payment intent
      const { data: intent } = await supabase
        .from('subscription_payment_intents')
        .select('id, user_id, plan_id, billing_cycle, status')
        .eq('payos_order_code', payload.data.orderCode)
        .single()

      if (intent) {
        // Xử lý subscription payment
        return await handleSubscriptionWebhook(supabase, intent, payload.data)
      }

      console.error('Order not found:', payload.data.orderCode)
      await logAudit(supabase, null, 'PAYOS_WEBHOOK_FAILED', { error: 'Order not found', orderCode: payload.data.orderCode }, 'failure')
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Determine new status
    let newStatus = 'pending'
    if (payload.data.code === '00') {
      newStatus = 'paid'
    } else if (payload.data.code === '01') {
      newStatus = 'cancelled'
    }

    // State Machine Check
    // If order is already paid or cancelled, do not update again (Idempotency)
    if (currentOrder.status === 'paid' || currentOrder.status === 'cancelled') {
      console.log(`Order ${currentOrder.order_code} is already ${currentOrder.status}. Ignoring webhook update to ${newStatus}.`)
      await logAudit(supabase, currentOrder.user_id, 'PAYOS_WEBHOOK_IGNORED', {
        orderId: currentOrder.id,
        currentStatus: currentOrder.status,
        newStatus,
        reason: 'Order already finalized'
      }, 'info')

      return new Response(
        JSON.stringify({ success: true, status: currentOrder.status, message: 'Order already finalized' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Atomic update: only update if still in 'pending' state (prevents race condition)
    // If two webhooks fire simultaneously, only one will match the .eq('status', 'pending') filter
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_data: payload.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentOrder.id)
      .eq('status', 'pending') // Atomic guard: only update if still pending
      .select('id, status')
      .single()

    if (updateError || !updatedOrder) {
      // If no row was updated, order was already finalized by a concurrent request
      console.log(`Order ${currentOrder.order_code} was already finalized by concurrent request. Ignoring.`)
      return new Response(
        JSON.stringify({ success: true, status: 'already_finalized', message: 'Concurrent webhook already processed' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log success
    await logAudit(supabase, currentOrder.user_id, 'PAYOS_WEBHOOK_SUCCESS', {
      orderId: currentOrder.id,
      oldStatus: currentOrder.status,
      newStatus,
      amount: payload.data.amount
    }, 'success')

    // 6a. Sync to transactions table (single source of truth for business logic)
    // This ensures commission/history logic works even if frontend closes before processOrder runs
    if (newStatus === 'paid') {
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
    }

    // 6. Trigger order confirmation email on successful payment
    if (newStatus === 'paid') {
      if (currentOrder.user_id) {
        // Fetch user email/name and order items for the email template
        const [userResult, itemsResult] = await Promise.all([
          supabase.from('users').select('email, full_name').eq('id', currentOrder.user_id).single(),
          supabase.from('order_items')
            .select('product_name, quantity, unit_price')
            .eq('order_id', currentOrder.id),
        ])

        const user = userResult.data
        const items = itemsResult.data || []

        if (user?.email) {
          // Fire-and-forget with explicit catch — do not block webhook response
          supabase.functions
            .invoke('send-email', {
              body: {
                to: user.email,
                subject: `✅ Đơn hàng #${payload.data.orderCode} đã được xác nhận!`,
                templateType: 'order-confirmation',
                data: {
                  userName: user.full_name || 'Bạn',
                  orderId: String(payload.data.orderCode),
                  orderDate: new Date().toLocaleDateString('vi-VN'),
                  totalAmount: `${payload.data.amount.toLocaleString('vi-VN')} VND`,
                  items: items.map((i: OrderItem) => ({
                    name: i.product_name,
                    quantity: i.quantity,
                    price: `${(i.unit_price || 0).toLocaleString('vi-VN')} VND`,
                  })),
                },
              },
            })
            .catch((err) => console.error('Email send failed:', err))
        }
      }

      // 7. Trigger commission distribution via agent-reward
      if (currentOrder.user_id) {
        const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
        supabase.functions
          .invoke('agent-reward', {
            body: {
              record: {
                id: currentOrder.id,
                user_id: currentOrder.user_id,
                total_vnd: payload.data.amount,
                status: 'completed',
              },
              old_record: { status: 'pending' },
            },
            ...(webhookSecret ? { headers: { 'x-webhook-secret': webhookSecret } } : {}),
          })
          .then(() => console.log(`Commission distributed for order ${currentOrder.id}`))
          .catch((err) => console.error('Commission distribution failed:', err))
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

// ---------------------------------------------------------------------------
// Subscription webhook handler — activate/cancel subscription sau PayOS payment
// ---------------------------------------------------------------------------
async function handleSubscriptionWebhook(
  supabase: ReturnType<typeof createClient>,
  intent: { id: string; user_id: string; plan_id: string; billing_cycle: string; status: string },
  data: WebhookData
): Promise<Response> {
  // Idempotency: bỏ qua nếu đã xử lý
  if (intent.status !== 'pending') {
    return new Response(
      JSON.stringify({ success: true, message: 'Subscription already processed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const isPaid = data.code === '00'
  const isCanceled = data.code === '01'
  const newIntentStatus = isPaid ? 'paid' : isCanceled ? 'canceled' : 'pending'

  // Cập nhật intent status (atomic: chỉ update nếu vẫn pending)
  await supabase
    .from('subscription_payment_intents')
    .update({ status: newIntentStatus, completed_at: new Date().toISOString() })
    .eq('id', intent.id)
    .eq('status', 'pending')

  if (isPaid) {
    // Tính period_end dựa trên billing_cycle
    const periodEnd = new Date()
    if (intent.billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Hủy subscription cũ nếu có (upgrade/renew)
    await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('user_id', intent.user_id)
      .in('status', ['active', 'trialing'])

    // Tạo subscription mới
    const { error: subError } = await supabase.from('user_subscriptions').insert({
      user_id: intent.user_id,
      plan_id: intent.plan_id,
      billing_cycle: intent.billing_cycle,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      payos_order_code: data.orderCode,
      last_payment_at: new Date().toISOString(),
      next_payment_at: periodEnd.toISOString(),
    })

    if (subError) {
      console.error('[subscription] Create subscription failed:', subError)
    } else {
      console.log(`[subscription] Activated for user ${intent.user_id}, plan ${intent.plan_id}`)
    }
  }

  return new Response(
    JSON.stringify({ success: true, subscriptionStatus: newIntentStatus }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// Helper to log to audit_logs table
async function logAudit(supabase: ReturnType<typeof createClient>, userId: string | null, action: string, payload: Record<string, unknown>, severity: string) {
  try {
    // If we don't have a user_id (e.g. failed signature), we might log with a system user or just null
    // Assuming audit_logs table allows null user_id or we use a specific system UUID if needed.
    // Based on migration, user_id is nullable? Let's check migration again.
    // Migration: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
    // It does not say NOT NULL, so it should be nullable.

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: action,
      payload: { ...payload, severity },
      user_agent: 'PayOS-Webhook-Service',
      ip_address: '0.0.0.0' // We don't have easy access to IP in this context without specific headers
    })
  } catch (err) {
    console.error('Failed to write audit log:', err)
    // Don't block the webhook response for audit logging failure
  }
}
