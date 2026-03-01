/**
 * AGI Commerce Orchestrator — Plan-Execute-Verify for commerce flows.
 *
 * Extends existing worker-supervisor pattern with AGI reasoning.
 * Decomposes high-level commerce goals into tool calls via ReAct loop.
 * Emits domain events on order/commission actions.
 * Human-in-the-loop gate for high-value orders.
 */

import { domainEventDispatcher } from './domain-event-dispatcher';
import { agentEventBus } from './agent-event-bus';
import { executeReActLoop, type ReasoningTrace, type ReActLoopOptions } from './agi-react-reasoning-loop';
import { selectModelTier } from './agi-model-tier-router';
import { agiToolRegistry } from './agi-tool-registry';

// ─── Types ───────────────────────────────────────────────────

export type OrchestratorStatus = 'idle' | 'planning' | 'executing' | 'awaiting_approval' | 'completed' | 'failed';

export interface CommerceGoal {
  /** Natural language goal (e.g., "Find best water filter under 5M VND") */
  goal: string;
  /** Distributor context */
  distributorId?: string;
  /** Skip human approval gate (for low-value ops) */
  skipApproval?: boolean;
  /** Max reasoning steps */
  maxSteps?: number;
}

export interface OrchestratorResult {
  status: OrchestratorStatus;
  trace: ReasoningTrace;
  approvalRequired: boolean;
  domainEventsEmitted: string[];
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────

/** Orders above this threshold require human approval */
const HIGH_VALUE_THRESHOLD_VND = 50_000_000;

const COMMERCE_SYSTEM_PROMPT = `You are the Well Commerce AGI Agent — an autonomous assistant for Well distributors.

Your capabilities:
- Search products by keyword, category, or health benefit
- Create orders for distributors
- Check distributor rank and points
- Calculate commissions on orders
- Provide health-based product recommendations

Rules:
1. Always search before recommending products.
2. For orders, confirm product availability (stock > 0) before creating.
3. After creating an order, always calculate the commission.
4. For health recommendations, include the disclaimer.
5. Use Vietnamese dong (VND) for all prices.
6. Be concise — distributors want quick answers.`;

// ─── Orchestrator ────────────────────────────────────────────

class CommerceOrchestrator {
  private status: OrchestratorStatus = 'idle';
  private lastTrace: ReasoningTrace | null = null;

  /**
   * Plan and execute a commerce goal using AGI ReAct reasoning.
   * Automatically selects model tier based on goal complexity.
   */
  async execute(goal: CommerceGoal): Promise<OrchestratorResult> {
    const emittedEvents: string[] = [];

    try {
      this.status = 'planning';
      await this.emitStatus('planning', goal.goal);

      // Select model tier based on tool count and goal complexity
      const tier = selectModelTier({
        toolCount: Object.keys(agiToolRegistry).length,
        requiresReasoning: goal.goal.length > 100 || goal.goal.includes('recommend'),
      });

      this.status = 'executing';
      await this.emitStatus('executing', goal.goal);

      const loopOptions: ReActLoopOptions = {
        prompt: this.buildPrompt(goal),
        system: COMMERCE_SYSTEM_PROMPT,
        model: tier.modelName,
        maxSteps: goal.maxSteps ?? 8,
        tools: agiToolRegistry,
        onStepFinish: (step) => {
          // Check for order creation in tool results — emit domain events
          if (step.type === 'observation' && step.toolCall) {
            const eventName = this.detectDomainEvent(step.toolCall.toolName, step.toolCall.result);
            if (eventName) emittedEvents.push(eventName);
          }
        },
      };

      const trace = await executeReActLoop(loopOptions);
      this.lastTrace = trace;

      // Human approval gate for high-value operations
      const approvalRequired = this.needsApproval(trace, goal);

      if (approvalRequired && !goal.skipApproval) {
        this.status = 'awaiting_approval';
        await this.emitStatus('awaiting_approval', goal.goal);

        return {
          status: 'awaiting_approval',
          trace,
          approvalRequired: true,
          domainEventsEmitted: emittedEvents,
        };
      }

      this.status = 'completed';
      await this.emitStatus('completed', goal.goal);

      return {
        status: 'completed',
        trace,
        approvalRequired: false,
        domainEventsEmitted: emittedEvents,
      };
    } catch (err) {
      this.status = 'failed';
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.emitStatus('failed', errorMsg);

      return {
        status: 'failed',
        trace: this.lastTrace ?? { steps: [], finalAnswer: '', totalSteps: 0, durationMs: 0 },
        approvalRequired: false,
        domainEventsEmitted: emittedEvents,
        error: errorMsg,
      };
    }
  }

  /** Build the user prompt with distributor context */
  private buildPrompt(goal: CommerceGoal): string {
    const parts = [goal.goal];
    if (goal.distributorId) {
      parts.push(`\nDistributor ID: ${goal.distributorId}`);
    }
    return parts.join('');
  }

  /** Detect domain events from tool call results */
  private detectDomainEvent(toolName: string, result: unknown): string | null {
    if (!result || typeof result !== 'object') return null;

    if (toolName === 'createOrder' && 'orderId' in result) {
      const order = result as { orderId: string; totalAmount: number; status: string };
      void domainEventDispatcher.dispatch('order:created', {
        orderId: order.orderId,
        userId: '',
        amount: order.totalAmount,
        products: [],
        status: 'created',
      }, 'agi-commerce-orchestrator');
      return 'order:created';
    }

    if (toolName === 'calculateCommission' && 'amount' in result) {
      const commission = result as { distributorId: string; orderId: string; amount: number };
      void domainEventDispatcher.dispatch('commission:calculated', {
        transactionId: `txn-${Date.now()}`,
        distributorId: commission.distributorId,
        amount: commission.amount,
        type: 'direct',
        orderId: commission.orderId,
      }, 'agi-commerce-orchestrator');
      return 'commission:calculated';
    }

    return null;
  }

  /** Check if trace contains high-value operations requiring human approval */
  private needsApproval(trace: ReasoningTrace, goal: CommerceGoal): boolean {
    if (goal.skipApproval) return false;

    return trace.steps.some((step) => {
      if (step.type !== 'observation' || !step.toolCall?.result) return false;
      const result = step.toolCall.result as Record<string, unknown>;
      return typeof result.totalAmount === 'number' && result.totalAmount > HIGH_VALUE_THRESHOLD_VND;
    });
  }

  /** Emit orchestrator status change on event bus */
  private async emitStatus(status: OrchestratorStatus, detail: string): Promise<void> {
    await agentEventBus.emit('agent:completed', {
      agentName: 'commerce-orchestrator',
      status,
      detail,
    }, 'agi-commerce-orchestrator');
  }

  /** Get current orchestrator status */
  getStatus(): OrchestratorStatus {
    return this.status;
  }

  /** Get last execution trace */
  getLastTrace(): ReasoningTrace | null {
    return this.lastTrace;
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const commerceOrchestrator = new CommerceOrchestrator();
