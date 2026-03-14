/**
 * Dead Letter Queue Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeadLetterQueueService } from '../dead-letter-queue-service';
import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';

describe('DeadLetterQueueService', () => {
  let dlq: DeadLetterQueueService;
  let mockSupabase: SupabaseLike;

  beforeEach(() => {
    mockSupabase = { from: vi.fn(), rpc: vi.fn(),
    } as SupabaseLike;
    dlq = new DeadLetterQueueService(mockSupabase);
  });

  it('should queue failed webhook to DLQ', async () => {
    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'dlq-123' }, error: null }),
        }),
      }),
    }));

    const id = await dlq.queue({
      event_type: 'payment.failed',
      order_code: 12345,
      raw_payload: { data: { amount: 100 } },
      error_message: 'Invalid signature',
    });

    expect(id).toBe('dlq-123');
  });

  it('should mark DLQ record as resolved', async () => {
    mockSupabase.from = vi.fn(() => ({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }));

    await dlq.markResolved('dlq-123', 'admin-user');
    expect(mockSupabase.from).toHaveBeenCalledWith('dead_letter_queue');
  });
});
