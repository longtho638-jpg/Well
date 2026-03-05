/**
 * Shared Utilities for Edge Functions
 *
 * Common helpers used across webhook-retry, dlq-retry-job, and other edge functions
 */

/**
 * Exponential backoff delay calculator
 *
 * Formula: min(baseDelay * 2^(failureCount-1), maxDelay)
 *
 * Examples:
 * - failureCount=1: 1min
 * - failureCount=2: 2min
 * - failureCount=3: 4min
 * - failureCount=4: 8min
 * - failureCount=5: 16min (capped at maxDelay)
 */
export function calculateBackoffDelay(
  failureCount: number,
  baseDelayMs: number = 60000,
  maxDelayMs: number = 3600000
): number {
  const count = Math.max(1, failureCount);
  return Math.min(baseDelayMs * Math.pow(2, count - 1), maxDelayMs);
}

/**
 * DLQ status update helper
 * Updates dead_letter_queue record with status and optional metadata
 */
export async function updateDLQStatus(
  supabase: Record<string, unknown>,
  id: number,
  status: 'pending' | 'processing' | 'resolved' | 'discarded',
  metadata?: Record<string, unknown>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    ...metadata,
  };

  await supabase
    .from('dead_letter_queue')
    .update(updateData)
    .eq('id', id);
}

/**
 * Validate webhook payload structure
 * Returns validation result with error message if invalid
 */
export interface WebhookPayload {
  data: {
    orderCode: number;
    amount?: number;
    description?: string;
    status?: 'paid' | 'pending' | 'cancelled';
  };
}

export function validateWebhookPayload(payload: unknown): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Missing payload' };
  }

  const data = (payload as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Missing payload.data' };
  }

  const orderCode = (data as Record<string, unknown>).orderCode;
  if (orderCode === undefined || typeof orderCode !== 'number') {
    return { valid: false, error: 'Invalid or missing orderCode' };
  }

  return { valid: true };
}

/**
 * Sanitize error messages for client response
 * Never expose internal details (DB passwords, stack traces, etc.)
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Internal server error';
  }

  const message = error.message.toLowerCase();

  // Block sensitive keywords
  const sensitiveKeywords = ['password', 'secret', 'key', 'token', 'credential', 'private'];
  if (sensitiveKeywords.some(keyword => message.includes(keyword))) {
    return 'Internal server error';
  }

  // Block stack traces
  if (message.includes('at ') || message.includes('\n')) {
    return 'Internal server error';
  }

  return error.message || 'Internal server error';
}
