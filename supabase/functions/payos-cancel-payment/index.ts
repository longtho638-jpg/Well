import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CancelPaymentRequest {
  orderCode: number
  cancellationReason?: string
}

serve(async (req) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse request body
    const body: CancelPaymentRequest = await req.json()

    // Validate required field
    if (!body.orderCode || typeof body.orderCode !== 'number' || body.orderCode <= 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid orderCode' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Verify user owns this order (RLS check)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('user_id, order_code')
      .eq('order_code', body.orderCode)
      .single()

    if (orderError || !orderData) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (orderData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this order' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Get PayOS credentials from Vault
    const payosClientId = Deno.env.get('PAYOS_CLIENT_ID')
    const payosApiKey = Deno.env.get('PAYOS_API_KEY')

    if (!payosClientId || !payosApiKey) {
      throw new Error('PayOS credentials not configured')
    }

    // 5. Call PayOS API to cancel payment
    const payosResponse = await fetch(
      `https://api-merchant.payos.vn/v2/payment-requests/${body.orderCode}/cancel`,
      {
        method: 'POST',
        headers: {
          'x-client-id': payosClientId,
          'x-api-key': payosApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancellationReason: body.cancellationReason || 'User cancelled',
        }),
      }
    )

    if (!payosResponse.ok) {
      const error = await payosResponse.text()
      throw new Error(`PayOS API error: ${error}`)
    }

    const paymentData = await payosResponse.json()

    // 6. Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('order_code', body.orderCode)

    if (updateError) {
      console.error('Database update error:', updateError)
    }

    // 7. Return cancellation result
    return new Response(
      JSON.stringify(paymentData.data || {}),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payment cancellation error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
