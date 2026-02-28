import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadCredentials, createPayment } from '../_shared/vibe-payos/mod.ts'
import type { PayOSCreateRequest } from '../_shared/vibe-payos/mod.ts'

serve(async (req) => {
  try {
    // 1. Optionally get authenticated user (guest checkout allowed)
    const authHeader = req.headers.get('Authorization')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let userId: string | null = null
    if (authHeader) {
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await supabaseUser.auth.getUser()
      userId = user?.id ?? null
    }

    // 2. Parse & validate request
    const body: PayOSCreateRequest = await req.json()

    if (!body.amount || body.amount < 1000) {
      return new Response(
        JSON.stringify({ error: `Invalid amount: ${body.amount}. Minimum is 1000 VND.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!body.orderCode || !body.description || !body.returnUrl || !body.cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderCode, description, returnUrl, cancelUrl' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Create payment via SDK
    const creds = loadCredentials()
    const result = await createPayment(body, creds)

    // 4. Store order in database
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

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payment creation error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
