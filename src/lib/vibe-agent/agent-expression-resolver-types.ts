/**
 * Agent Expression Resolver — Types (n8n expression evaluation pattern)
 *
 * Extracted from agent-expression-resolver-n8n-pattern.ts.
 * Contains: ExpressionContext, ResolvedExpression, ExpressionHelperFn.
 */

/** Context data available inside {{ }} expressions (n8n WorkflowDataProxy) */
export interface ExpressionContext {
  $input: unknown;
  $node: Record<string, { data: unknown }>;
  $env: Record<string, string>;
  $workflow: { id: string; name: string; active: boolean };
  $execution: { id: string; mode: string };
  $now: string;
  $today: string;
  $vars: Record<string, unknown>;
}

/** Result of resolving a single {{ }} expression */
export interface ResolvedExpression {
  original: string;
  resolved: unknown;
  success: boolean;
  error?: string;
}

/** Signature for helper functions registered on the resolver */
export type ExpressionHelperFn = (...args: unknown[]) => unknown;
