/**
 * Webhook Retry Edge Function
 * Called by DLQ scheduled retry job to re-process failed webhooks
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateWebhookPayload, sanitizeErrorMessage } from '../_shared/utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Constants
 */
const ORDER_STATUS_PAID = 'paid';

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication: Require DLQ service call
    const authHeader = req.headers.get('Authorization');
    const dlqSecret = Deno.env.get('DLQ_SERVICE_SECRET');

    if (dlqSecret && authHeader !== `Bearer ${dlqSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { payload } = await req.json();

    // Validate payload structure
    const validation = validateWebhookPayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Extract order code
    const orderCode = (payload as any).data.orderCode;

    // Check if order already processed (idempotency)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('order_code', orderCode)
      .single();

    if (fetchError) {
      console.error('[webhook-retry] Order not found:', orderCode, fetchError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (order?.status === ORDER_STATUS_PAID) {
      // Already processed - skip (idempotency)
      console.warn('[webhook-retry] Skip - already processed:', orderCode);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invoke actual webhook processor (vibe-payos handler)
    console.warn('[webhook-retry] Processing order:', orderCode);
    const { data: webhookResult, error: webhookError } = await supabase.functions.invoke('vibe-payos', {
      body: { payload: payload as Record<string, unknown> },
    });

    if (webhookError) {
      throw webhookError;
    }

    if (!webhookResult?.success) {
      throw new Error('Webhook processing returned false');
    }

    console.warn('[webhook-retry] Success:', orderCode);
    return new Response(
      JSON.stringify({ success: true, reprocessed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const safeError = sanitizeErrorMessage(error);
    console.error('[webhook-retry] Error:', safeError);
    return new Response(
      JSON.stringify({ success: false, error: safeError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
