/**
 * Agent Message Queue — Types (QStash Serverless Queue Pattern)
 *
 * Extracted from agent-message-queue-qstash-pattern.ts.
 * Contains: MessageStatus, QueueMessage, ScheduledMessage, MessageTopic,
 * MessageHandler, PublishOptions.
 */

export type MessageStatus = 'pending' | 'delivered' | 'failed' | 'dlq' | 'scheduled';

/** A queued message (QStash publishJSON equivalent) */
export interface QueueMessage<T = unknown> {
  messageId: string;
  body: T;
  /** Target handler name */
  destination: string;
  status: MessageStatus;
  /** Delay before delivery (ms) */
  delayMs: number;
  /** Max retries before DLQ */
  maxRetries: number;
  retryCount: number;
  /** Idempotency key for deduplication */
  deduplicationId?: string;
  createdAt: string;
  deliveredAt: string | null;
  error: string | null;
}

/** Scheduled recurring message (QStash schedule) */
export interface ScheduledMessage {
  scheduleId: string;
  destination: string;
  body: unknown;
  /** Cron expression (e.g., every 5 minutes) */
  cron: string;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

/** Topic with subscribers (QStash topics) */
export interface MessageTopic {
  name: string;
  subscribers: string[];
}

/** Message handler */
export type MessageHandler<T = unknown> = (message: QueueMessage<T>) => Promise<void>;

/** Publish options */
export interface PublishOptions {
  delayMs?: number;
  maxRetries?: number;
  deduplicationId?: string;
}
