/**
 * DLQ Retry Job - Cron Trigger
 * Runs every 5 minutes to retry pending DLQ items
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('SUPABASE_CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: pendingItems } = await supabase
      .from('dead_letter_queue')
      .select('id, event_type, order_code, raw_payload, failure_count, last_error_at')
      .eq('status', 'pending')
      .lte('failure_count', 5)
      .order('created_at', { ascending: true })
      .limit(50);

    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems || []) {
      const failureCount = item.failure_count || 1;
      const delayMs = Math.min(60000 * Math.pow(2, failureCount - 1), 3600000);
      const lastErrorTime = item.last_error_at ? new Date(item.last_error_at).getTime() : 0;
      
      if (Date.now() - lastErrorTime < delayMs) continue;

      await supabase.from('dead_letter_queue').update({ status: 'processing' }).eq('id', item.id);

      try {
        const { data, error } = await supabase.functions.invoke('webhook-retry', {
          body: { payload: item.raw_payload },
        });

        if (error) throw error;
        if (data?.success) {
          await supabase.from('dead_letter_queue').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: 'dlq_retry_job' }).eq('id', item.id);
          succeeded++;
        } else {
          throw new Error('Retry returned false');
        }
      } catch (err) {
        const newFailureCount = failureCount + 1;
        if (newFailureCount >= 5) {
          await supabase.from('dead_letter_queue').update({ status: 'discarded', resolved_at: new Date().toISOString(), resolved_by: 'max_retries_exceeded' }).eq('id', item.id);
        } else {
          await supabase.from('dead_letter_queue').update({ status: 'pending', failure_count: newFailureCount, last_error_at: new Date().toISOString() }).eq('id', item.id);
        }
        failed++;
      }
    }

    return new Response(JSON.stringify({ success: true, processed: pendingItems?.length || 0, succeeded, failed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
