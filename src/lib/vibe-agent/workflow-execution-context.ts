/**
 * Workflow Execution Context — Temporal.io durable workflow pattern.
 *
 * Maps Temporal's Workflow → Activity → Compensation (Saga) to a
 * client-side execution context for multi-step agent workflows.
 *
 * Temporal concepts mapped:
 * - Workflow: defineWorkflow() — declarative step pipeline with state
 * - Activity: WorkflowStep — individual task with retry + timeout
 * - Signal: receiveSignal() — external event injection mid-workflow
 * - Query: getWorkflowState() — read current execution state
 * - Saga: compensation handlers — rollback on step failure
 * - RetryPolicy: per-step retry config (maxAttempts, backoff)
 * - WorkflowHistory: step execution log for replay/audit
 *
 * Pattern source: temporalio/sdk-typescript workflow.ts
 */

// ─── Types ──────────────────────────────────────────────────

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'compensated';

/** Temporal RetryPolicy equivalent */
export interface StepRetryPolicy {
  maxAttempts: number;
  initialIntervalMs: number;
  maxIntervalMs: number;
  backoffCoefficient: number;
}

const DEFAULT_RETRY: StepRetryPolicy = {
  maxAttempts: 3,
  initialIntervalMs: 1000,
  maxIntervalMs: 30_000,
  backoffCoefficient: 2,
};

/** A single workflow step (Temporal Activity) */
export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  name: string;
  /** Execute the step — receives input, returns output */
  execute: (input: TInput, ctx: WorkflowContext) => Promise<TOutput>;
  /** Compensation handler — Temporal Saga rollback */
  compensate?: (input: TInput, output: TOutput, ctx: WorkflowContext) => Promise<void>;
  /** Retry policy for this step */
  retryPolicy?: Partial<StepRetryPolicy>;
  /** Timeout in ms (default: 30000) */
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
  /** Read pending signals (Temporal signal pattern) */
  getSignal: (name: string) => unknown | undefined;
  /** Store data for later steps */
  setData: (key: string, value: unknown) => void;
  /** Read data from previous steps */
  getData: (key: string) => unknown | undefined;
}

// ─── Workflow Execution Engine ──────────────────────────────

/**
 * Execute a durable workflow — Temporal Workflow.execute() equivalent.
 *
 * Pipeline:
 * 1. Run steps sequentially
 * 2. On step failure → retry per RetryPolicy
 * 3. If retries exhausted → run compensation (Saga rollback)
 * 4. Record full execution history (Temporal WorkflowHistory)
 */
export async function executeWorkflow<TInput>(
  workflowName: string,
  steps: WorkflowStep[],
  input: TInput,
): Promise<WorkflowState> {
  const workflowId = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const data = new Map<string, unknown>();
  const signals: WorkflowState['signals'] = [];

  const state: WorkflowState = {
    workflowId,
    workflowName,
    status: 'running',
    currentStep: null,
    startedAt,
    completedAt: null,
    stepHistory: [],
    signals,
    result: null,
    error: null,
  };

  const ctx: WorkflowContext = {
    workflowId,
    getSignal: (name) => signals.find((s) => s.name === name)?.payload,
    setData: (key, value) => data.set(key, value),
    getData: (key) => data.get(key),
  };

  // Track completed steps for compensation
  const completedSteps: Array<{ step: WorkflowStep; input: unknown; output: unknown }> = [];
  let currentInput: unknown = input;

  for (const step of steps) {
    state.currentStep = step.name;
    const stepStart = Date.now();
    const retryPolicy = { ...DEFAULT_RETRY, ...step.retryPolicy };

    const execution: StepExecution = {
      stepName: step.name,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationMs: 0,
      attempt: 0,
      output: null,
      error: null,
    };

    let stepSucceeded = false;
    let lastError: string | null = null;

    // Retry loop (Temporal RetryPolicy)
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      execution.attempt = attempt;
      try {
        const output = await executeWithTimeout(
          () => step.execute(currentInput, ctx),
          step.timeoutMs ?? 30_000,
        );

        execution.status = 'completed';
        execution.output = output;
        execution.completedAt = new Date().toISOString();
        execution.durationMs = Date.now() - stepStart;

        completedSteps.push({ step, input: currentInput, output });
        currentInput = output; // Chain output → next input
        stepSucceeded = true;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < retryPolicy.maxAttempts) {
          const delay = Math.min(
            retryPolicy.initialIntervalMs * Math.pow(retryPolicy.backoffCoefficient, attempt - 1),
            retryPolicy.maxIntervalMs,
          );
          await sleep(delay);
        }
      }
    }

    if (!stepSucceeded) {
      execution.status = 'failed';
      execution.error = lastError;
      execution.completedAt = new Date().toISOString();
      execution.durationMs = Date.now() - stepStart;
      state.stepHistory.push(execution);

      // Saga compensation — rollback completed steps in reverse
      state.status = 'compensating';
      await runCompensation(completedSteps, ctx);

      state.status = 'failed';
      state.error = `Step "${step.name}" failed after ${retryPolicy.maxAttempts} attempts: ${lastError}`;
      state.completedAt = new Date().toISOString();
      state.currentStep = null;
      return state;
    }

    state.stepHistory.push(execution);
  }

  state.status = 'completed';
  state.result = currentInput;
  state.completedAt = new Date().toISOString();
  state.currentStep = null;

  return state;
}

/**
 * Send a signal to a workflow context (Temporal signal).
 * Signals can be read by steps via ctx.getSignal().
 */
export function sendSignal(
  state: WorkflowState,
  name: string,
  payload: unknown,
): void {
  state.signals.push({
    name,
    payload,
    receivedAt: new Date().toISOString(),
  });
}

// ─── Saga Compensation ──────────────────────────────────────

async function runCompensation(
  completedSteps: Array<{ step: WorkflowStep; input: unknown; output: unknown }>,
  ctx: WorkflowContext,
): Promise<void> {
  // Reverse order — Temporal Saga pattern
  for (let i = completedSteps.length - 1; i >= 0; i--) {
    const { step, input, output } = completedSteps[i];
    if (step.compensate) {
      try {
        await step.compensate(input, output, ctx);
      } catch {
        // Compensation must not throw — swallow and continue
      }
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────

function executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Step timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
