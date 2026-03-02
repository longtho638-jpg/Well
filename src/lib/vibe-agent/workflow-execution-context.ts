/**
 * Workflow Execution Context — Temporal.io durable workflow pattern.
 *
 * Temporal concepts mapped:
 * - Workflow: defineWorkflow() — declarative step pipeline with state
 * - Activity: WorkflowStep — individual task with retry + timeout
 * - Signal: receiveSignal() — external event injection mid-workflow
 * - Saga: compensation handlers — rollback on step failure
 * - RetryPolicy: per-step retry config (maxAttempts, backoff)
 *
 * Pattern source: temporalio/sdk-typescript workflow.ts
 */

export type {
  WorkflowStatus,
  StepStatus,
  StepRetryPolicy,
  WorkflowStep,
  StepExecution,
  WorkflowState,
  WorkflowContext,
} from './workflow-execution-context-types';

import type {
  WorkflowStep,
  WorkflowState,
  WorkflowContext,
  StepExecution,
} from './workflow-execution-context-types';
import { DEFAULT_STEP_RETRY } from './workflow-execution-context-types';

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

  const completedSteps: Array<{ step: WorkflowStep; input: unknown; output: unknown }> = [];
  let currentInput: unknown = input;

  for (const step of steps) {
    state.currentStep = step.name;
    const stepStart = Date.now();
    const retryPolicy = { ...DEFAULT_STEP_RETRY, ...step.retryPolicy };

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
        currentInput = output;
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
