/**
 * DLQ Scheduled Retry Job
 * Auto-retries pending DLQ items with exponential backoff
 * Runs every 5 minutes via cron (Supabase Functions + cron.trigger)
 */

import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';
import type { DeadLetterQueueRecord } from './webhook-handler-dependency-injection-types';

interface RetryJobConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_CONFIG: RetryJobConfig = {
  maxRetries: 5,
  baseDelayMs: 60000,      // 1 minute
  maxDelayMs: 3600000,     // 1 hour
};

export class DLQScheduledRetryJob {
  private supabase: SupabaseLike;
  private config: RetryJobConfig;

  constructor(supabase: SupabaseLike, config?: Partial<RetryJobConfig>) {
    this.supabase = supabase;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get DLQ items ready for retry based on exponential backoff
   */
  async getItemsReadyForRetry(limit = 50): Promise<Array<{ id: string; event_type: string; order_code: number; raw_payload: Record<string, unknown>; failure_count: number }>> {
    const now = new Date().toISOString();

    // Fetch all pending items and filter by exponential backoff at client side
    // (Supabase Like interface doesn't have lte/gte comparison operators)
    const { data, error } = await this.supabase
      .from('dead_letter_queue')
      .select('id, event_type, order_code, raw_payload, failure_count, last_error_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit * 2); // Fetch more to have enough after filtering

    if (error) throw error;

    // Filter by exponential backoff delay
    return ((data || []) as Array<{ id: string; event_type: string; order_code: number; raw_payload: Record<string, unknown>; failure_count: number; last_error_at?: string }>).filter(item => {
      const delay = Math.min(
        this.config.baseDelayMs * Math.pow(2, (item.failure_count || 1) - 1),
        this.config.maxDelayMs
      );
      const lastErrorTime = item.last_error_at ? new Date(item.last_error_at).getTime() : 0;
      return Date.now() - lastErrorTime >= delay;
    });
  }

  /**
   * Process and retry a single DLQ item
   */
  async retryItem(
    itemId: string,
    processor: (payload: unknown) => Promise<boolean>
  ): Promise<{ success: boolean; error?: string }> {
    // Mark as processing
    await this.supabase
      .from('dead_letter_queue')
      .update({ status: 'processing' })
      .eq('id', itemId);

    try {
      const { data, error } = await this.supabase
        .from('dead_letter_queue')
        .select('raw_payload')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      const success = await processor((data as { raw_payload: Record<string, unknown> }).raw_payload);

      if (success) {
        await this.supabase
          .from('dead_letter_queue')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: 'scheduled_retry_job',
          })
          .eq('id', itemId);

        return { success: true };
      }

      // Retry failed - increment failure count
      throw new Error('Processor returned false');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Increment failure count and set backoff
      const { data: item } = await this.supabase
        .from('dead_letter_queue')
        .select('failure_count')
        .eq('id', itemId)
        .single();

      const newFailureCount = ((item as { failure_count?: number })?.failure_count || 0) + 1;

      if (newFailureCount >= this.config.maxRetries) {
        // Max retries exceeded - mark as discarded
        await this.supabase
          .from('dead_letter_queue')
          .update({
            status: 'discarded',
            resolved_at: new Date().toISOString(),
            resolved_by: 'max_retries_exceeded',
          })
          .eq('id', itemId);
      } else {
        // Back to pending with incremented count
        await this.supabase
          .from('dead_letter_queue')
          .update({
            status: 'pending',
            failure_count: newFailureCount,
            last_error_at: new Date().toISOString(),
            error_message: errorMessage,
          })
          .eq('id', itemId);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Main job entry point - run this from cron
   */
  async run(): Promise<{ processed: number; succeeded: number; failed: number }> {
    const items = await this.getItemsReadyForRetry();
    let succeeded = 0;
    let failed = 0;

    for (const item of items) {
      const result = await this.retryItem(item.id, async (payload) => {
        // Re-process webhook payload
        const { data, error } = await this.supabase.functions.invoke('webhook-retry', {
          body: { payload },
        });

        if (error) throw error;
        return (data as { success?: boolean })?.success || false;
      });

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return { processed: items.length, succeeded, failed };
  }
}
