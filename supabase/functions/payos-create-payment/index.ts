import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PaymentItem {
  name: string
  quantity: number
  price: number
}

interface PaymentRequest {
  orderCode: number
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  items: PaymentItem[]
}

serve(async (req) => {
  try {
    // 1. Optionally get authenticated user (guest checkout allowed)
    const authHeader = req.headers.get('Authorization')

    // Use service role for DB writes (bypasses RLS), anon key for auth lookup
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Try to identify user if auth header present, but don't block guests
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

    // 2. Parse request body
    const body: PaymentRequest = await req.json()

    // Validate amount (PayOS minimum is 1000 VND)
    if (!body.amount || body.amount < 1000) {
      return new Response(
        JSON.stringify({ error: `Invalid amount: ${body.amount}. Minimum is 1000 VND.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!body.orderCode || !body.description || !body.returnUrl || !body.cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment fields: orderCode, description, returnUrl, cancelUrl' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get PayOS credentials from Vault
    const payosClientId = Deno.env.get('PAYOS_CLIENT_ID')
    const payosApiKey = Deno.env.get('PAYOS_API_KEY')
    const payosChecksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')

    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      throw new Error('PayOS credentials not configured')
    }

    // 4. Create signature data (server-side only)
    const signatureData = `amount=${body.amount}&cancelUrl=${body.cancelUrl}&description=${body.description}&orderCode=${body.orderCode}&returnUrl=${body.returnUrl}`

    const encoder = new TextEncoder()
    const keyData = encoder.encode(payosChecksumKey)
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
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 5. Call PayOS API
    const payosResponse = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': payosClientId,
        'x-api-key': payosApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderCode: body.orderCode,
        amount: body.amount,
        description: body.description,
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
        signature: signature,
        items: body.items,
      }),
    })

    if (!payosResponse.ok) {
      const error = await payosResponse.text()
      throw new Error(`PayOS API error: ${error}`)
    }

    const paymentData = await payosResponse.json()

    // 6. Store order in database (service role bypasses RLS)
    const { error: dbError } = await supabaseAdmin.from('orders').insert({
      user_id: userId,
      order_code: body.orderCode,
      amount: body.amount,
      status: 'pending',
      payment_url: paymentData.data?.checkoutUrl || '',
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to store order: ${dbError.message}`)
    }

    // 7. Return payment URL
    return new Response(
      JSON.stringify({
        checkoutUrl: paymentData.data?.checkoutUrl || '',
        orderCode: body.orderCode
      }),
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
