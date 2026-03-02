/**
 * Agent Execution Queue — Types (n8n BullMQ Pattern)
 *
 * Extracted from agent-execution-queue-n8n-pattern.ts.
 * Contains: JobStatus, JobPriority, QueueJob, QueueConfig, AddJobOptions,
 * QueueStats, JobProcessor, JobEventHandler.
 */

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
export type JobPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest

export interface QueueJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: unknown;
  error: string | null;
  progress: number; // 0–100
  delayUntil: string | null;
}

export interface QueueConfig {
  concurrency: number;        // Max parallel jobs (default: 3)
  maxQueueSize: number;       // Max waiting jobs (default: 100)
  defaultMaxAttempts: number; // Default retry attempts (default: 3)
  rateLimitPerMinute: number; // Max jobs started per minute (default: 60)
}

export interface AddJobOptions {
  priority?: JobPriority;
  maxAttempts?: number;
  delayMs?: number;
}

export interface QueueStats {
  waiting: number; active: number; completed: number;
  failed: number; delayed: number; total: number;
}

export type JobProcessor<T = unknown> = (job: QueueJob<T>) => Promise<unknown>;
export type JobEventHandler = (job: QueueJob) => void;
