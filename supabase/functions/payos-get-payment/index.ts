import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { loadCredentials, getPaymentStatus, jsonRes, requireAuth } from '../_shared/vibe-payos/mod.ts'

serve(async (req) => {
  try {
    const { userId, supabase } = await requireAuth(req)

    const body: { orderCode: number } = await req.json()

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('user_id, order_code')
      .eq('order_code', body.orderCode)
      .single()

    if (orderError || !orderData) {
      return jsonRes({ error: 'Order not found' }, 404)
    }

    if (orderData.user_id !== userId) {
      return jsonRes({ error: 'Forbidden: You do not own this order' }, 403)
    }

    const creds = loadCredentials()
    const status = await getPaymentStatus(body.orderCode, creds)

    return jsonRes(status as unknown as Record<string, unknown>)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Payment status check error:', error)
    return jsonRes({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
