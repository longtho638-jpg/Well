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

interface WebhookPayload {
  data: WebhookData
  signature: string
}

serve(async (req) => {
  try {
    // 1. Parse webhook payload
    const payload: WebhookPayload = await req.json()
    const signature = payload.signature

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get checksum key from Vault
    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
    if (!checksumKey) {
      throw new Error('PAYOS_CHECKSUM_KEY not configured')
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

    if (signature !== computedSignature) {
      console.error('Signature mismatch:', { received: signature, computed: computedSignature })
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Update order status using service role (webhook doesn't have user auth)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Determine order status from PayOS webhook code
    let orderStatus = 'pending'
    if (payload.data.code === '00') {
      orderStatus = 'paid'
    } else if (payload.data.code === '01') {
      orderStatus = 'cancelled'
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_data: payload.data,
        updated_at: new Date().toISOString(),
      })
      .eq('order_code', payload.data.orderCode)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    // 5. Trigger notifications (async - don't block webhook response)
    if (orderStatus === 'paid') {
      // Get user_id from order to send email
      const { data: orderData } = await supabase
        .from('orders')
        .select('user_id')
        .eq('order_code', payload.data.orderCode)
        .single()

      if (orderData?.user_id) {
        // Call send-email function for order confirmation
        supabase.functions
          .invoke('send-email', {
            body: {
              type: 'order-confirmation',
              userId: orderData.user_id,
              orderCode: payload.data.orderCode,
              amount: payload.data.amount,
            },
          })
          .catch((err) => console.error('Email send failed:', err))
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: orderStatus }),
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
