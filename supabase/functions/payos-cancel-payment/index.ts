import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadCredentials, cancelPayment } from '../_shared/vibe-payos/mod.ts'

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

    // 2. Parse & validate
    const body: { orderCode: number; cancellationReason?: string } = await req.json()

    if (!body.orderCode || typeof body.orderCode !== 'number' || body.orderCode <= 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid orderCode' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Verify ownership
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

    // 4. Cancel via SDK
    const creds = loadCredentials()
    const result = await cancelPayment(body.orderCode, body.cancellationReason || 'User cancelled', creds)

    // 5. Update local DB
    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('order_code', body.orderCode)

    return new Response(
      JSON.stringify(result),
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
