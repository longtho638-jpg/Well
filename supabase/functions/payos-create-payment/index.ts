import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { loadCredentials, createPayment, jsonRes, optionalAuth, createAdminClient } from '../_shared/vibe-payos/mod.ts'
import type { PayOSCreateRequest } from '../_shared/vibe-payos/mod.ts'

serve(async (req) => {
  try {
    const userId = await optionalAuth(req)
    const supabaseAdmin = createAdminClient()

    const body: PayOSCreateRequest = await req.json()

    if (!body.amount || body.amount < 1000) {
      return jsonRes({ error: `Invalid amount: ${body.amount}. Minimum is 1000 VND.` }, 400)
    }

    if (!body.orderCode || !body.description || !body.returnUrl || !body.cancelUrl) {
      return jsonRes({ error: 'Missing required fields: orderCode, description, returnUrl, cancelUrl' }, 400)
    }

    const creds = loadCredentials()
    const result = await createPayment(body, creds)

    const { error: dbError } = await supabaseAdmin.from('orders').insert({
      user_id: userId,
      order_code: body.orderCode,
      amount: body.amount,
      status: 'pending',
      payment_url: result.checkoutUrl,
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to store order: ${dbError.message}`)
    }

    return jsonRes(result as unknown as Record<string, unknown>)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Payment creation error:', error)
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
