/**
 * Dead Letter Queue Service for Failed Webhooks
 * 
 * Usage:
 *   const dlq = new DeadLetterQueueService(supabase);
 *   await dlq.queue({ event_type: 'payment.failed', order_code: 123, ... });
 */

import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';
import type { DeadLetterQueueRecord } from './webhook-handler-dependency-injection-types';

export class DeadLetterQueueService {
  private supabase: SupabaseLike;

  constructor(supabase: SupabaseLike) {
    this.supabase = supabase;
  }

  async queue(record: DeadLetterQueueRecord): Promise<string> {
    const { data, error } = await this.supabase
      .from('dead_letter_queue')
      .insert({
        event_type: record.event_type,
        order_code: record.order_code,
        raw_payload: record.raw_payload,
        signature: record.signature,
        error_message: record.error_message,
        error_details: record.error_details || {},
        failure_count: record.failure_count || 1,
        max_retries: record.max_retries || 3,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to queue to DLQ:', error);
      throw error;
    }

    return (data as { id: string }).id;
  }

  async getPending(limit = 100): Promise<Array<{ id: string; event_type: string; order_code: number; raw_payload: unknown }>> {
    const { data, error } = await this.supabase
      .from('dead_letter_queue')
      .select('id, event_type, order_code, raw_payload')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async markProcessing(id: string): Promise<void> {
    await this.supabase
      .from('dead_letter_queue')
      .update({ status: 'processing' })
      .eq('id', id);
  }

  async markResolved(id: string, resolvedBy: string): Promise<void> {
    await this.supabase
      .from('dead_letter_queue')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', id);
  }

  async markDiscarded(id: string, resolvedBy: string): Promise<void> {
    await this.supabase
      .from('dead_letter_queue')
      .update({
        status: 'discarded',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', id);
  }

  async incrementFailureCount(id: string, errorMessage: string): Promise<void> {
    await this.supabase.rpc('increment_dlq_failure_count', {
      p_id: id,
      p_error_message: errorMessage,
    });
  }
}
