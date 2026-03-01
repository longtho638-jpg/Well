/**
 * Agent Execution Queue — n8n BullMQ Pattern
 *
 * Pattern source: n8n-io/n8n Queue + BullMQ scaling pattern
 * Adapted for client-side as an in-memory priority task queue
 * with concurrency control and rate limiting.
 *
 * Maps: Job → QueueJob, Queue → AgentExecutionQueue, Worker → processor fn
 */

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Queue Implementation ─────────────────────────────────────────────────────

class AgentExecutionQueue {
  private config: QueueConfig = { concurrency: 3, maxQueueSize: 100, defaultMaxAttempts: 3, rateLimitPerMinute: 60 };
  private jobs = new Map<string, QueueJob>();
  private processors = new Map<string, JobProcessor>();
  private completedHandlers: JobEventHandler[] = [];
  private failedHandlers: JobEventHandler[] = [];
  private progressHandlers: JobEventHandler[] = [];
  private running = false;
  private paused = false;
  private loopHandle: ReturnType<typeof setInterval> | null = null;
  private startedThisMinute = 0;
  private minuteWindowStart = Date.now();

  // ─── Configuration ──────────────────────────────────────────────────────────

  configure(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  registerProcessor<T = unknown>(jobName: string, processor: JobProcessor<T>): void {
    this.processors.set(jobName, processor as JobProcessor);
  }

  // ─── Job Management ─────────────────────────────────────────────────────────

  add(name: string, data: unknown, options: AddJobOptions = {}): QueueJob {
    if (this.getWaiting().length >= this.config.maxQueueSize)
      throw new Error(`Queue full (max ${this.config.maxQueueSize})`);

    const now = new Date().toISOString();
    const job: QueueJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name, data,
      priority: options.priority ?? 3,
      status: options.delayMs ? 'delayed' : 'waiting',
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.defaultMaxAttempts,
      createdAt: now, startedAt: null, completedAt: null,
      result: null, error: null, progress: 0,
      delayUntil: options.delayMs ? new Date(Date.now() + options.delayMs).toISOString() : null,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): QueueJob | undefined { return this.jobs.get(id); }
  clear(): void { this.jobs.clear(); }

  // ─── Filtered Views ──────────────────────────────────────────────────────────

  getWaiting(): QueueJob[]   { return this.byStatus('waiting'); }
  getActive(): QueueJob[]    { return this.byStatus('active'); }
  getCompleted(): QueueJob[] { return this.byStatus('completed'); }
  getFailed(): QueueJob[]    { return this.byStatus('failed'); }

  private byStatus(s: JobStatus): QueueJob[] {
    return [...this.jobs.values()].filter(j => j.status === s);
  }

  getStats(): QueueStats {
    const all = [...this.jobs.values()];
    const count = (s: JobStatus) => all.filter(j => j.status === s).length;
    return {
      waiting: count('waiting'), active: count('active'), completed: count('completed'),
      failed: count('failed'), delayed: count('delayed'), total: all.length,
    };
  }

  // ─── Processing ──────────────────────────────────────────────────────────────

  process(): void {
    if (this.paused) return;
    const now = Date.now();

    // Promote delayed jobs whose delay has elapsed
    for (const job of this.jobs.values())
      if (job.status === 'delayed' && job.delayUntil && new Date(job.delayUntil).getTime() <= now)
        job.status = 'waiting';

    // Reset rate-limit window every minute
    if (now - this.minuteWindowStart >= 60_000) { this.startedThisMinute = 0; this.minuteWindowStart = now; }

    const slots = this.config.concurrency - this.getActive().length;
    if (slots <= 0 || this.startedThisMinute >= this.config.rateLimitPerMinute) return;

    const candidates = this.getWaiting().sort((a, b) => a.priority - b.priority);
    for (let i = 0; i < Math.min(slots, candidates.length); i++) {
      if (this.startedThisMinute >= this.config.rateLimitPerMinute) break;
      this.runJob(candidates[i]);
      this.startedThisMinute++;
    }
  }

  private async runJob(job: QueueJob): Promise<void> {
    const processor = this.processors.get(job.name);
    if (!processor) {
      job.status = 'failed';
      job.error = `No processor registered for "${job.name}"`;
      this.failedHandlers.forEach(h => h(job));
      return;
    }
    job.status = 'active';
    job.startedAt = new Date().toISOString();
    job.attempts++;
    try {
      job.result = await processor(job);
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.progress = 100;
      this.completedHandlers.forEach(h => h(job));
    } catch (err) {
      job.error = err instanceof Error ? err.message : String(err);
      job.status = job.attempts < job.maxAttempts ? 'waiting' : 'failed';
      if (job.status === 'failed') this.failedHandlers.forEach(h => h(job));
    }
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  start(intervalMs = 500): void {
    if (this.running) return;
    this.running = true;
    this.loopHandle = setInterval(() => this.process(), intervalMs);
  }

  stop(): void {
    if (this.loopHandle) clearInterval(this.loopHandle);
    this.running = false;
    this.loopHandle = null;
  }

  pause(): void  { this.paused = true; }
  resume(): void { this.paused = false; }

  // ─── Event Handlers ──────────────────────────────────────────────────────────

  onCompleted(handler: JobEventHandler): void { this.completedHandlers.push(handler); }
  onFailed(handler: JobEventHandler): void    { this.failedHandlers.push(handler); }
  onProgress(handler: JobEventHandler): void  { this.progressHandlers.push(handler); }

  /** Call from inside a processor to emit progress updates. */
  emitProgress(job: QueueJob, percent: number): void {
    job.progress = Math.max(0, Math.min(100, percent));
    this.progressHandlers.forEach(h => h(job));
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const agentExecutionQueue = new AgentExecutionQueue();
