/**
 * Workflow Execution Context — Types (Temporal.io durable workflow pattern)
 *
 * Extracted from workflow-execution-context.ts.
 * Contains: WorkflowStatus, StepStatus, StepRetryPolicy, WorkflowStep,
 * StepExecution, WorkflowState, WorkflowContext.
 */

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'compensated';

/** Temporal RetryPolicy equivalent */
export interface StepRetryPolicy {
  maxAttempts: number;
  initialIntervalMs: number;
  maxIntervalMs: number;
  backoffCoefficient: number;
}

/** A single workflow step (Temporal Activity) */
export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  name: string;
  execute: (input: TInput, ctx: WorkflowContext) => Promise<TOutput>;
  /** Compensation handler — Temporal Saga rollback */
  compensate?: (input: TInput, output: TOutput, ctx: WorkflowContext) => Promise<void>;
  retryPolicy?: Partial<StepRetryPolicy>;
  timeoutMs?: number;
}

/** Execution record for a single step (WorkflowHistory event) */
export interface StepExecution {
  stepName: string;
  status: StepStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  attempt: number;
  output: unknown;
  error: string | null;
}

/** Full workflow execution state (Temporal WorkflowExecution) */
export interface WorkflowState {
  workflowId: string;
  workflowName: string;
  status: WorkflowStatus;
  currentStep: string | null;
  startedAt: string;
  completedAt: string | null;
  stepHistory: StepExecution[];
  signals: Array<{ name: string; payload: unknown; receivedAt: string }>;
  result: unknown;
  error: string | null;
}

/** Context passed to step execute/compensate functions */
export interface WorkflowContext {
  workflowId: string;
  getSignal: (name: string) => unknown | undefined;
  setData: (key: string, value: unknown) => void;
  getData: (key: string) => unknown | undefined;
}

export const DEFAULT_STEP_RETRY: StepRetryPolicy = {
  maxAttempts: 3,
  initialIntervalMs: 1000,
  maxIntervalMs: 30_000,
  backoffCoefficient: 2,
};
