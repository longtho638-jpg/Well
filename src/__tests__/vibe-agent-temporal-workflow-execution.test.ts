/**
 * Tests for Temporal.io-inspired Workflow Execution Context.
 * Validates: step pipeline, retry policy, saga compensation, signals, timeout.
 */
import { describe, it, expect } from 'vitest';
import {
  executeWorkflow,
  sendSignal,
  type WorkflowStep,
  type WorkflowState,
  type WorkflowContext,
} from '../lib/vibe-agent/index';

describe('Temporal Workflow Execution Context', () => {
  // ─── Happy Path ───────────────────────────────────────────

  it('should execute a simple 3-step workflow sequentially', async () => {
    const steps: WorkflowStep[] = [
      {
        name: 'validate-input',
        execute: async (input: unknown) => {
          const data = input as { amount: number };
          if (data.amount <= 0) throw new Error('Invalid amount');
          return { ...data, validated: true };
        },
      },
      {
        name: 'calculate-commission',
        execute: async (input: unknown) => {
          const data = input as { amount: number; validated: boolean };
          return { ...data, commission: data.amount * 0.25 };
        },
      },
      {
        name: 'create-transaction',
        execute: async (input: unknown) => {
          const data = input as { amount: number; commission: number };
          return { transactionId: 'tx-123', ...data };
        },
      },
    ];

    const state = await executeWorkflow('commission-workflow', steps, { amount: 1000 });

    expect(state.status).toBe('completed');
    expect(state.stepHistory).toHaveLength(3);
    expect(state.stepHistory.every((s: { status: string }) => s.status === 'completed')).toBe(true);
    expect(state.result).toEqual({
      amount: 1000,
      validated: true,
      commission: 250,
      transactionId: 'tx-123',
    });
    expect(state.workflowName).toBe('commission-workflow');
    expect(state.error).toBeNull();
  });

  // ─── Retry Policy ─────────────────────────────────────────

  it('should retry failed steps according to retry policy', async () => {
    let attempt = 0;
    const steps: WorkflowStep[] = [
      {
        name: 'flaky-api-call',
        execute: async () => {
          attempt++;
          if (attempt < 3) throw new Error('Network timeout');
          return { success: true };
        },
        retryPolicy: {
          maxAttempts: 3,
          initialIntervalMs: 10, // Fast for tests
          maxIntervalMs: 50,
          backoffCoefficient: 2,
        },
      },
    ];

    const state = await executeWorkflow('retry-test', steps, {});

    expect(state.status).toBe('completed');
    expect(state.stepHistory[0].attempt).toBe(3);
    expect(attempt).toBe(3);
  });

  it('should fail workflow when retries exhausted', async () => {
    const steps: WorkflowStep[] = [
      {
        name: 'always-fails',
        execute: async () => {
          throw new Error('Service unavailable');
        },
        retryPolicy: { maxAttempts: 2, initialIntervalMs: 10, maxIntervalMs: 50, backoffCoefficient: 2 },
      },
    ];

    const state = await executeWorkflow('fail-test', steps, {});

    expect(state.status).toBe('failed');
    expect(state.error).toContain('always-fails');
    expect(state.error).toContain('Service unavailable');
    expect(state.stepHistory[0].status).toBe('failed');
  });

  // ─── Saga Compensation ────────────────────────────────────

  it('should run compensation in reverse order on failure', async () => {
    const compensationOrder: string[] = [];

    const steps: WorkflowStep[] = [
      {
        name: 'step-A',
        execute: async () => ({ a: true }),
        compensate: async () => {
          compensationOrder.push('A');
        },
      },
      {
        name: 'step-B',
        execute: async () => ({ b: true }),
        compensate: async () => {
          compensationOrder.push('B');
        },
      },
      {
        name: 'step-C-fails',
        execute: async () => {
          throw new Error('Step C crashed');
        },
        retryPolicy: { maxAttempts: 1, initialIntervalMs: 10, maxIntervalMs: 10, backoffCoefficient: 1 },
      },
    ];

    const state = await executeWorkflow('saga-test', steps, {});

    expect(state.status).toBe('failed');
    // Compensation runs in reverse: B first, then A
    expect(compensationOrder).toEqual(['B', 'A']);
  });

  it('should not crash if compensation handler throws', async () => {
    const steps: WorkflowStep[] = [
      {
        name: 'step-ok',
        execute: async () => ({ ok: true }),
        compensate: async () => {
          throw new Error('Compensation also failed');
        },
      },
      {
        name: 'step-fail',
        execute: async () => {
          throw new Error('Boom');
        },
        retryPolicy: { maxAttempts: 1, initialIntervalMs: 10, maxIntervalMs: 10, backoffCoefficient: 1 },
      },
    ];

    // Should not throw even if compensation fails
    const state = await executeWorkflow('compensation-error-test', steps, {});
    expect(state.status).toBe('failed');
  });

  // ─── Signals ──────────────────────────────────────────────

  it('should support signal injection and reading', async () => {
    const state: WorkflowState = {
      workflowId: 'wf-test',
      workflowName: 'signal-test',
      status: 'running',
      currentStep: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      stepHistory: [],
      signals: [],
      result: null,
      error: null,
    };

    sendSignal(state, 'approval', { approved: true, approver: 'admin' });
    sendSignal(state, 'priority', { level: 'high' });

    expect(state.signals).toHaveLength(2);
    expect(state.signals[0].name).toBe('approval');
    expect(state.signals[0].payload).toEqual({ approved: true, approver: 'admin' });
    expect(state.signals[1].name).toBe('priority');
  });

  it('should allow steps to read signals via context', async () => {
    let signalValue: unknown = undefined;

    const steps: WorkflowStep[] = [
      {
        name: 'read-signal',
        execute: async (_input: unknown, ctx: WorkflowContext) => {
          // Simulate signal being available before step runs
          signalValue = ctx.getSignal('test-signal');
          return { signalReceived: signalValue !== undefined };
        },
      },
    ];

    const state = await executeWorkflow('signal-read-test', steps, {});
    // Signal not sent, so should be undefined
    expect(signalValue).toBeUndefined();
    expect(state.status).toBe('completed');
  });

  // ─── Workflow Context Data Sharing ─────────────────────────

  it('should support data sharing between steps via context', async () => {
    const steps: WorkflowStep[] = [
      {
        name: 'producer',
        execute: async (_input: unknown, ctx: WorkflowContext) => {
          ctx.setData('computed-value', 42);
          return { produced: true };
        },
      },
      {
        name: 'consumer',
        execute: async (_input: unknown, ctx: WorkflowContext) => {
          const value = ctx.getData('computed-value');
          return { consumed: value };
        },
      },
    ];

    const state = await executeWorkflow('data-sharing-test', steps, {});

    expect(state.status).toBe('completed');
    expect(state.result).toEqual({ consumed: 42 });
  });

  // ─── Timeout ──────────────────────────────────────────────

  it('should fail step on timeout', async () => {
    const steps: WorkflowStep[] = [
      {
        name: 'slow-step',
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { done: true };
        },
        timeoutMs: 50, // Timeout before step completes
        retryPolicy: { maxAttempts: 1, initialIntervalMs: 10, maxIntervalMs: 10, backoffCoefficient: 1 },
      },
    ];

    const state = await executeWorkflow('timeout-test', steps, {});

    expect(state.status).toBe('failed');
    expect(state.error).toContain('timed out');
  });

  // ─── Workflow Metadata ────────────────────────────────────

  it('should populate workflow metadata correctly', async () => {
    const steps: WorkflowStep[] = [
      { name: 'noop', execute: async (input: unknown) => input },
    ];

    const state = await executeWorkflow('metadata-test', steps, { foo: 'bar' });

    expect(state.workflowId).toMatch(/^wf-/);
    expect(state.workflowName).toBe('metadata-test');
    expect(state.startedAt).toBeTruthy();
    expect(state.completedAt).toBeTruthy();
    expect(state.currentStep).toBeNull(); // Null after completion
    expect(state.stepHistory).toHaveLength(1);
    expect(state.stepHistory[0].stepName).toBe('noop');
    expect(state.stepHistory[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  // ─── Step History ─────────────────────────────────────────

  it('should record full step execution history', async () => {
    const steps: WorkflowStep[] = [
      { name: 'step-1', execute: async () => ({ s1: true }) },
      { name: 'step-2', execute: async () => ({ s2: true }) },
      { name: 'step-3', execute: async () => ({ s3: true }) },
    ];

    const state = await executeWorkflow('history-test', steps, {});

    expect(state.stepHistory).toHaveLength(3);
    state.stepHistory.forEach((step: { stepName: string; status: string; startedAt: string; completedAt: string | null; attempt: number; error: string | null }, i: number) => {
      expect(step.stepName).toBe(`step-${i + 1}`);
      expect(step.status).toBe('completed');
      expect(step.startedAt).toBeTruthy();
      expect(step.completedAt).toBeTruthy();
      expect(step.attempt).toBe(1);
      expect(step.error).toBeNull();
    });
  });

  // ─── Empty Workflow ───────────────────────────────────────

  it('should handle empty workflow (no steps)', async () => {
    const state = await executeWorkflow('empty-test', [], { data: 1 });

    expect(state.status).toBe('completed');
    expect(state.stepHistory).toHaveLength(0);
    expect(state.result).toEqual({ data: 1 }); // Input passed through
  });
});
