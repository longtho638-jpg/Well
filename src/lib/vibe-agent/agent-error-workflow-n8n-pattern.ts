/**
 * Agent Error Workflow — n8n-inspired error trigger + error workflow pattern.
 *
 * Maps n8n's ErrorTrigger node + dedicated Error Workflow concept to a
 * client-side agent error routing system.
 *
 * Pattern source: n8n-io/n8n ErrorTrigger + Error Workflow
 */

export type {
  ErrorCategory,
  AgentErrorContext,
  ErrorRecoveryAction,
  ErrorHandler,
  ErrorWorkflowConfig,
} from './agent-error-workflow-category-and-context-types';

import type {
  ErrorCategory,
  AgentErrorContext,
  ErrorRecoveryAction,
  ErrorHandler,
  ErrorWorkflowConfig,
} from './agent-error-workflow-category-and-context-types';

// ─── Retry Record (n8n: execution retry state) ───────────────

interface RetryRecord {
  context: AgentErrorContext;
  action: (() => Promise<unknown>) | null;
}

// ─── Error Workflow Class (n8n: Error Workflow execution engine) ─

const DEFAULT_CONFIG: ErrorWorkflowConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  enableAutoClassification: true,
  errorHistorySize: 200,
};

/**
 * Agent error workflow — routes failures to registered handlers.
 * Mirrors n8n's pattern of a dedicated Error Workflow that any
 * failing workflow can delegate to via the ErrorTrigger node.
 */
class AgentErrorWorkflow {
  private handlers: ErrorHandler[] = [];
  private history: AgentErrorContext[] = [];
  private retryMap = new Map<string, RetryRecord>();
  private config: ErrorWorkflowConfig = { ...DEFAULT_CONFIG };

  /** Update configuration (n8n: workflow settings panel) */
  configure(overrides: Partial<ErrorWorkflowConfig>): void {
    this.config = { ...this.config, ...overrides };
  }

  /** Register an error handler (n8n: add error-handling node to Error Workflow) */
  registerHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /** Auto-classify error category from message/type (n8n: error routing logic) */
  classifyError(error: Error | string): ErrorCategory {
    const msg = (typeof error === 'string' ? error : error.message).toLowerCase();
    if (/timeout|timed out|deadline/.test(msg)) return 'timeout';
    if (/unauthori[zs]ed|forbidden|permission|401|403/.test(msg)) return 'permission';
    if (/network|fetch|connection|cors|econnrefused/.test(msg)) return 'network';
    if (/invalid|required|schema|validation|must be/.test(msg)) return 'validation';
    if (/internal|unexpected|unhandled/.test(msg)) return 'internal';
    return 'unknown';
  }

  /** Build a rich error context (n8n: $json payload emitted by ErrorTrigger) */
  createErrorContext(
    agentName: string,
    action: string,
    error: Error | string,
    input: unknown,
    metadata: Record<string, unknown> = {},
  ): AgentErrorContext {
    const err = typeof error === 'string' ? new Error(error) : error;
    const category = this.config.enableAutoClassification
      ? this.classifyError(err)
      : 'unknown';

    return {
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      agentName,
      action,
      category,
      message: err.message,
      stack: err.stack,
      input,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      metadata,
    };
  }

  /** Route error to the first matching handler (n8n: error workflow execution) */
  async handleError(error: AgentErrorContext): Promise<ErrorRecoveryAction> {
    this._recordHistory(error);

    const handler = this.handlers.find((h) =>
      h.categories.includes(error.category),
    );

    if (!handler) {
      return { type: 'escalate', message: `No handler for category: ${error.category}` };
    }

    try {
      return await handler.handle(error);
    } catch (handlerErr) {
      const msg = handlerErr instanceof Error ? handlerErr.message : String(handlerErr);
      return { type: 'abort', reason: `Handler "${handler.name}" threw: ${msg}` };
    }
  }

  /**
   * Register a retryable operation associated with an error ID.
   * Call before handleError so retryWithHandler can replay the action.
   */
  registerRetryAction(errorId: string, context: AgentErrorContext, action: () => Promise<unknown>): void {
    this.retryMap.set(errorId, { context, action });
  }

  /** Retry a failed operation by its error ID (n8n: manual retry from failed node) */
  async retryWithHandler(errorId: string): Promise<ErrorRecoveryAction> {
    const record = this.retryMap.get(errorId);
    if (!record) return { type: 'abort', reason: `No retry record for errorId: ${errorId}` };

    const { context, action } = record;
    if (context.retryCount >= this.config.maxRetries) {
      return { type: 'escalate', message: `Max retries (${this.config.maxRetries}) exceeded for ${errorId}` };
    }

    const delay = this.config.retryDelayMs * Math.pow(2, context.retryCount);
    await new Promise((r) => setTimeout(r, delay));

    context.retryCount += 1;

    if (action) {
      try {
        const result = await action();
        this.retryMap.delete(errorId);
        return { type: 'fallback', result };
      } catch (err) {
        const retryCtx = this.createErrorContext(
          context.agentName,
          context.action,
          err instanceof Error ? err : new Error(String(err)),
          context.input,
          { ...context.metadata, retryCount: context.retryCount },
        );
        retryCtx.retryCount = context.retryCount;
        return this.handleError(retryCtx);
      }
    }

    return this.handleError(context);
  }

  /** Get error history, optionally filtered by agent (n8n: execution list) */
  getErrorHistory(agentName?: string): AgentErrorContext[] {
    if (!agentName) return [...this.history];
    return this.history.filter((e) => e.agentName === agentName);
  }

  /** Error statistics by category (n8n: execution analytics) */
  getErrorStats(): Record<ErrorCategory, number> {
    const stats: Record<ErrorCategory, number> = {
      validation: 0, timeout: 0, permission: 0,
      network: 0, internal: 0, unknown: 0,
    };
    for (const e of this.history) stats[e.category]++;
    return stats;
  }

  /** Clear error history and retry map */
  clear(): void {
    this.history = [];
    this.retryMap.clear();
  }

  private _recordHistory(error: AgentErrorContext): void {
    this.history.push(error);
    if (this.history.length > this.config.errorHistorySize) {
      this.history.shift();
    }
  }
}

// ─── Singleton (n8n: global Error Workflow instance) ─────────

/** Singleton agent error workflow — import and use directly */
export const agentErrorWorkflow = new AgentErrorWorkflow();
