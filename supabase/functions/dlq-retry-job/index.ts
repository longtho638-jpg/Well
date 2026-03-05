/**
 * DLQ Retry Job - Cron Trigger
 * Runs every 5 minutes to retry pending DLQ items
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeErrorMessage, calculateBackoffDelay, updateDLQStatus } from '../_shared/utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Constants
 */
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60000; // 1 minute
const MAX_DELAY_MS = 3600000; // 1 hour
const BATCH_LIMIT = 50;

/**
 * Process a single DLQ item with retry logic
 */
async function processDLQItem(
  supabase: Record<string, unknown>,
  item: { id: number; failure_count: number; last_error_at: string; raw_payload: unknown },
  onSuccess: () => void,
  onFailure: () => void
): Promise<void> {
  const failureCount = item.failure_count || 1;

  // Check exponential backoff delay
  const delayMs = calculateBackoffDelay(failureCount, BASE_DELAY_MS, MAX_DELAY_MS);
  const lastErrorTime = item.last_error_at ? new Date(item.last_error_at).getTime() : 0;

  if (Date.now() - lastErrorTime < delayMs) {
    return; // Not yet time to retry
  }

  // Mark as processing
  await updateDLQStatus(supabase, item.id, 'processing');

  try {
    // Invoke webhook-retry function
    const { data, error } = await supabase.functions.invoke('webhook-retry', {
      body: { payload: item.raw_payload },
    });

    if (error) throw error;
    if (data?.success) {
      // Success - mark as resolved
      await updateDLQStatus(supabase, item.id, 'resolved', {
        resolved_at: new Date().toISOString(),
        resolved_by: 'dlq_retry_job',
      });
      onSuccess();
    } else {
      throw new Error('Retry returned false');
    }
  } catch {
    const newFailureCount = failureCount + 1;

    if (newFailureCount >= MAX_RETRIES) {
      // Max retries exceeded - discard
      await updateDLQStatus(supabase, item.id, 'discarded', {
        resolved_at: new Date().toISOString(),
        resolved_by: 'max_retries_exceeded',
      });
    } else {
      // Retry later
      await updateDLQStatus(supabase, item.id, 'pending', {
        failure_count: newFailureCount,
        last_error_at: new Date().toISOString(),
      });
    }
    onFailure();
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('SUPABASE_CRON_SECRET');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch pending DLQ items
    const { data: pendingItems } = await supabase
      .from('dead_letter_queue')
      .select('id, event_type, order_code, raw_payload, failure_count, last_error_at')
      .eq('status', 'pending')
      .lte('failure_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(BATCH_LIMIT);

    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems || []) {
      await processDLQItem(supabase, item, () => succeeded++, () => failed++);
    }

    return new Response(
      JSON.stringify({ success: true, processed: pendingItems?.length || 0, succeeded, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const safeError = sanitizeErrorMessage(error);
    console.error('[dlq-retry-job] Critical error:', safeError);
    return new Response(
      JSON.stringify({ success: false, error: safeError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
