/**
 * Agent Error Workflow — Error Category, Context, Handler, Recovery Action Types
 *
 * Extracted from agent-error-workflow-n8n-pattern.ts.
 * n8n ErrorTrigger + Error Workflow pattern types:
 * ErrorCategory, AgentErrorContext, ErrorRecoveryAction, ErrorHandler, ErrorWorkflowConfig.
 */

/** Error categories mapped from n8n's error node types */
export type ErrorCategory =
  | 'validation'  // n8n: NodeOperationError with validation context
  | 'timeout'     // n8n: Workflow execution timeout
  | 'permission'  // n8n: Credential / auth errors
  | 'network'     // n8n: NodeApiError for HTTP/network failures
  | 'internal'    // n8n: Internal node execution errors
  | 'unknown';    // n8n: Catch-all for unclassified errors

/** Rich error context passed to the Error Workflow (n8n: $json in ErrorTrigger) */
export interface AgentErrorContext {
  errorId: string;
  /** Agent that produced the error (n8n: workflow.name) */
  agentName: string;
  /** Action/step that failed (n8n: lastNodeExecuted) */
  action: string;
  category: ErrorCategory;
  message: string;
  stack?: string;
  /** Original input that triggered the failure (n8n: inputData) */
  input: unknown;
  timestamp: string;
  /** Number of times this error has been retried (n8n: manual retry count) */
  retryCount: number;
  /** Metadata for debugging (n8n: extra context on error node) */
  metadata: Record<string, unknown>;
}

/** Recovery actions an error handler can return (n8n: workflow continuation modes) */
export type ErrorRecoveryAction =
  | { type: 'retry'; delayMs?: number }        // n8n: retry from failed node
  | { type: 'skip'; reason: string }            // n8n: skip node, continue workflow
  | { type: 'fallback'; result: unknown }       // n8n: substitute output data
  | { type: 'escalate'; message: string }       // n8n: send to notification node
  | { type: 'abort'; reason: string };          // n8n: stop workflow execution

/** Error handler registration (n8n: error workflow node with category filter) */
export interface ErrorHandler {
  name: string;
  /** Which error categories this handler processes (n8n: error type conditions) */
  categories: ErrorCategory[];
  /** Handler function — receives error context, returns recovery action */
  handle: (error: AgentErrorContext) => Promise<ErrorRecoveryAction>;
}

/** Error workflow configuration (n8n: workflow-level error handling settings) */
export interface ErrorWorkflowConfig {
  /** Max retry attempts before escalating (n8n: max retry count) */
  maxRetries: number;
  /** Base delay between retries in ms (n8n: retry interval) */
  retryDelayMs: number;
  /** Auto-classify errors without explicit category (n8n: smart error routing) */
  enableAutoClassification: boolean;
  /** Max error history entries to keep in memory */
  errorHistorySize: number;
}
