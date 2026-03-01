/**
 * Agent Message Queue — QStash Serverless Queue Pattern
 *
 * Maps upstash/qstash's HTTP-based message queue to agent task scheduling.
 * Deferred execution, scheduled messages, topic-based pub/sub, DLQ.
 *
 * QStash concepts mapped:
 * - Message: HTTP-based task with URL destination → agent task with handler
 * - Schedule: cron-based recurring messages
 * - Topic: fan-out to multiple subscribers
 * - DLQ (Dead Letter Queue): failed message storage for retry
 * - Deduplication: idempotency key to prevent duplicate processing
 *
 * Pattern source: upstash/qstash-js SDK + QStash REST API
 */

// ─── Types ──────────────────────────────────────────────────

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

// ─── Queue Engine ───────────────────────────────────────────

class AgentMessageQueue {
  private messages = new Map<string, QueueMessage>();
  private handlers = new Map<string, MessageHandler>();
  private topics = new Map<string, MessageTopic>();
  private dlq: QueueMessage[] = [];
  private schedules = new Map<string, ScheduledMessage>();
  private processedIds = new Set<string>();
  private idCounter = 0;
  private maxDlqSize = 100;

  /** Register a message handler for a destination */
  registerHandler<T>(destination: string, handler: MessageHandler<T>): void {
    this.handlers.set(destination, handler as MessageHandler);
  }

  /** Publish a message (QStash publish equivalent) */
  publish<T>(destination: string, body: T, options?: PublishOptions): string {
    // Deduplication check
    if (options?.deduplicationId && this.processedIds.has(options.deduplicationId)) {
      return ''; // Skip duplicate
    }

    const messageId = `msg_${++this.idCounter}_${Date.now()}`;
    const msg: QueueMessage<T> = {
      messageId,
      body,
      destination,
      status: options?.delayMs ? 'scheduled' : 'pending',
      delayMs: options?.delayMs ?? 0,
      maxRetries: options?.maxRetries ?? 3,
      retryCount: 0,
      deduplicationId: options?.deduplicationId,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      error: null,
    };

    this.messages.set(messageId, msg as QueueMessage);

    // Schedule delayed delivery
    if (msg.delayMs > 0) {
      setTimeout(() => {
        msg.status = 'pending';
        this.processMessage(messageId);
      }, msg.delayMs);
    } else {
      this.processMessage(messageId);
    }

    return messageId;
  }

  /** Publish to a topic (fan-out to all subscribers) */
  publishToTopic<T>(topicName: string, body: T, options?: PublishOptions): string[] {
    const topic = this.topics.get(topicName);
    if (!topic) return [];
    return topic.subscribers.map((dest) => this.publish(dest, body, options));
  }

  /** Create or update a topic */
  createTopic(name: string, subscribers: string[]): void {
    this.topics.set(name, { name, subscribers });
  }

  /** Process a message — deliver to handler */
  private async processMessage(messageId: string): Promise<void> {
    const msg = this.messages.get(messageId);
    if (!msg || msg.status === 'delivered' || msg.status === 'dlq') return;

    const handler = this.handlers.get(msg.destination);
    if (!handler) {
      msg.status = 'failed';
      msg.error = `No handler for destination: ${msg.destination}`;
      this.moveToDlq(msg);
      return;
    }

    try {
      msg.status = 'pending';
      await handler(msg);
      msg.status = 'delivered';
      msg.deliveredAt = new Date().toISOString();
      if (msg.deduplicationId) this.processedIds.add(msg.deduplicationId);
    } catch (err) {
      msg.retryCount++;
      msg.error = err instanceof Error ? err.message : String(err);

      if (msg.retryCount >= msg.maxRetries) {
        this.moveToDlq(msg);
      } else {
        // Retry with backoff
        const delay = 1000 * Math.pow(2, msg.retryCount - 1);
        setTimeout(() => this.processMessage(messageId), delay);
      }
    }
  }

  /** Move failed message to DLQ */
  private moveToDlq(msg: QueueMessage): void {
    msg.status = 'dlq';
    this.dlq.push(msg);
    if (this.dlq.length > this.maxDlqSize) this.dlq.shift();
  }

  /** Get DLQ messages */
  getDlq(): QueueMessage[] {
    return [...this.dlq];
  }

  /** Retry a DLQ message */
  retryDlq(messageId: string): boolean {
    const idx = this.dlq.findIndex((m) => m.messageId === messageId);
    if (idx === -1) return false;
    const msg = this.dlq.splice(idx, 1)[0];
    msg.retryCount = 0;
    msg.status = 'pending';
    msg.error = null;
    this.processMessage(msg.messageId);
    return true;
  }

  /** Get queue stats */
  getStats(): { total: number; pending: number; delivered: number; failed: number; dlq: number } {
    const msgs = Array.from(this.messages.values());
    return {
      total: msgs.length,
      pending: msgs.filter((m) => m.status === 'pending').length,
      delivered: msgs.filter((m) => m.status === 'delivered').length,
      failed: msgs.filter((m) => m.status === 'failed').length,
      dlq: this.dlq.length,
    };
  }

  /** Clear all */
  clear(): void {
    this.messages.clear();
    this.handlers.clear();
    this.topics.clear();
    this.dlq = [];
    this.schedules.clear();
    this.processedIds.clear();
    this.idCounter = 0;
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentMessageQueue = new AgentMessageQueue();
