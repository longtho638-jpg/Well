import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionPaymentRequest {
  planId: string           // UUID của subscription_plans
  billingCycle: 'monthly' | 'yearly'
  returnUrl: string
  cancelUrl: string
  orgId?: string           // UUID của organizations (multi-org support)
}

// ---------------------------------------------------------------------------
// Helper: Tạo HMAC-SHA256 signature cho PayOS
// ---------------------------------------------------------------------------
async function createPayOSSignature(
  amount: number,
  description: string,
  orderCode: number,
  returnUrl: string,
  cancelUrl: string,
  checksumKey: string
): Promise<string> {
  const signatureData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(checksumKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureData))
  return Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  try {
    // 1. Lấy authenticated user (subscription bắt buộc phải đăng nhập)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Parse request
    const body: SubscriptionPaymentRequest = await req.json()
    if (!body.planId || !body.billingCycle || !body.returnUrl || !body.cancelUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // 3. Lấy plan để biết giá
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, slug, name, price_monthly, price_yearly')
      .eq('id', body.planId)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 })
    }

    const amount = body.billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
    if (amount < 1000) {
      return new Response(JSON.stringify({ error: 'Free plan không cần thanh toán' }), { status: 400 })
    }

    // 4. Tạo orderCode duy nhất (timestamp-based)
    const orderCode = Math.floor(Date.now() / 1000)
    const description = `WellNexus ${plan.name} ${body.billingCycle === 'yearly' ? '12 tháng' : '1 tháng'}`

    // 5. Tạo PayOS signature
    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
    if (!checksumKey) throw new Error('PAYOS_CHECKSUM_KEY not configured')

    const signature = await createPayOSSignature(
      amount, description, orderCode, body.returnUrl, body.cancelUrl, checksumKey
    )

    // 6. Gọi PayOS API
    const payosClientId = Deno.env.get('PAYOS_CLIENT_ID')
    const payosApiKey = Deno.env.get('PAYOS_API_KEY')
    if (!payosClientId || !payosApiKey) throw new Error('PayOS credentials not configured')

    const payosResponse = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': payosClientId,
        'x-api-key': payosApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderCode,
        amount,
        description,
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
        signature,
        items: [{ name: plan.name, quantity: 1, price: amount }],
      }),
    })

    if (!payosResponse.ok) {
      const errText = await payosResponse.text()
      throw new Error(`PayOS API error: ${errText}`)
    }

    const paymentData = await payosResponse.json()

    // 7. Lưu subscription_payment_intent để webhook biết cần activate subscription
    await supabaseAdmin.from('subscription_payment_intents').insert({
      user_id: user.id,
      plan_id: body.planId,
      billing_cycle: body.billingCycle,
      payos_order_code: orderCode,
      amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      org_id: body.orgId ?? null,
    })

    return new Response(
      JSON.stringify({ checkoutUrl: paymentData.data?.checkoutUrl ?? '', orderCode }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[payos-create-subscription] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
