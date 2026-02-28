import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadCredentials, createPayment } from '../_shared/vibe-payos/mod.ts'

// ─── Types ──────────────────────────────────────────────────────

interface SubscriptionPaymentRequest {
  planId: string
  billingCycle: 'monthly' | 'yearly'
  returnUrl: string
  cancelUrl: string
  orgId?: string
}

// ─── Main handler ───────────────────────────────────────────────

serve(async (req) => {
  try {
    // 1. Auth required for subscriptions
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

    // 2. Parse & validate
    const body: SubscriptionPaymentRequest = await req.json()
    if (!body.planId || !body.billingCycle || !body.returnUrl || !body.cancelUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // 3. Fetch plan pricing
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

    // 4. Create payment via SDK
    const orderCode = Math.floor(Date.now() / 1000)
    const description = `WellNexus ${plan.name} ${body.billingCycle === 'yearly' ? '12 tháng' : '1 tháng'}`
    const creds = loadCredentials()

    const result = await createPayment({
      orderCode,
      amount,
      description,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
      items: [{ name: plan.name, quantity: 1, price: amount }],
    }, creds)

    // 5. Save subscription payment intent
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
      JSON.stringify(result),
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
