import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { loadCredentials, createPayment, jsonRes, requireAuth, createAdminClient } from '../_shared/vibe-payos/mod.ts'

interface SubscriptionPaymentRequest {
  planId: string
  billingCycle: 'monthly' | 'yearly'
  returnUrl: string
  cancelUrl: string
  orgId?: string
}

serve(async (req) => {
  try {
    const { userId } = await requireAuth(req)
    const supabaseAdmin = createAdminClient()

    const body: SubscriptionPaymentRequest = await req.json()
    if (!body.planId || !body.billingCycle || !body.returnUrl || !body.cancelUrl) {
      return jsonRes({ error: 'Missing required fields' }, 400)
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, slug, name, price_monthly, price_yearly')
      .eq('id', body.planId)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return jsonRes({ error: 'Plan not found' }, 404)
    }

    const amount = body.billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
    if (amount < 1000) {
      return jsonRes({ error: 'Free plan không cần thanh toán' }, 400)
    }

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

    await supabaseAdmin.from('subscription_payment_intents').insert({
      user_id: userId,
      plan_id: body.planId,
      billing_cycle: body.billingCycle,
      payos_order_code: orderCode,
      amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      org_id: body.orgId ?? null,
    })

    return jsonRes(result as unknown as Record<string, unknown>)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('[payos-create-subscription] Error:', error)
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
