/**
 * Agent Expression Resolver — n8n Pattern
 *
 * Pattern source: n8n-io/n8n Expression + WorkflowDataProxy
 * Maps n8n's expression evaluation engine to safe client-side resolution.
 *
 * Key mappings:
 *   ExpressionEvaluator      → AgentExpressionResolver
 *   WorkflowDataProxy        → ExpressionContext ($input, $node, $env…)
 *   tmpl / expression-eval   → property-path resolution (NO eval/Function)
 *   $helpers                 → built-in + user-registered functions
 */

export type {
  ExpressionContext,
  ResolvedExpression,
  ExpressionHelperFn,
} from './agent-expression-resolver-types';

import type {
  ExpressionContext,
  ResolvedExpression,
  ExpressionHelperFn,
} from './agent-expression-resolver-types';

// ─── Helpers Registry ────────────────────────────────────────────────────────

/** Built-in helpers mirroring n8n $helpers */
const BUILT_IN_HELPERS: Record<string, ExpressionHelperFn> = {
  $if: (condition, trueVal, falseVal) => (condition ? trueVal : falseVal),
  $isEmpty: (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value as object).length === 0;
    return false;
  },
  $default: (value, fallback) =>
    value === null || value === undefined || value === '' ? fallback : value,
  $lowercase: (str) => (typeof str === 'string' ? str.toLowerCase() : str),
  $uppercase: (str) => (typeof str === 'string' ? str.toUpperCase() : str),
  $parseInt: (str) => parseInt(String(str), 10),
  $parseFloat: (str) => parseFloat(String(str)),
  $jsonStringify: (obj) => JSON.stringify(obj),
  $length: (arr) => {
    if (typeof arr === 'string' || Array.isArray(arr)) return arr.length;
    return 0;
  },
};

// ─── Path Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a dotted/bracket path against an object.
 * Supports: "a.b.c", "a[0].b", "$input.data.name"
 * No eval() — pure property traversal.
 */
function resolveDottedPath(obj: unknown, path: string): unknown {
  const normalised = path.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalised.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ─── Expression Parser ────────────────────────────────────────────────────────

/** Match helper call: $fnName(arg1, arg2, ...) */
const HELPER_CALL_RE = /^\$([a-zA-Z_]\w*)\((.*)\)$/s;

/**
 * Evaluate a single expression body against the context.
 * Supports: property paths, helper calls (no nesting), context variables.
 */
function evaluateExpressionBody(
  body: string,
  ctx: ExpressionContext,
  helpers: Map<string, ExpressionHelperFn>,
): unknown {
  const trimmed = body.trim();

  const helperMatch = HELPER_CALL_RE.exec(trimmed);
  if (helperMatch) {
    const fnName = `$${helperMatch[1]}`;
    const fn = helpers.get(fnName);
    if (!fn) throw new Error(`Unknown helper: ${fnName}`);
    const rawArgs = helperMatch[2].trim();
    const args = rawArgs.length === 0
      ? []
      : rawArgs.split(',').map((a) => evaluateExpressionBody(a, ctx, helpers));
    return fn(...args);
  }

  if (/^".*"$/.test(trimmed) || /^'.*'$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;

  const root = trimmed.split(/[.[]/)[0];
  const contextAny = ctx as unknown as Record<string, unknown>;
  if (root in contextAny) {
    if (trimmed === root) return contextAny[root];
    const subPath = trimmed.slice(root.length).replace(/^\./, '');
    return resolveDottedPath(contextAny[root], subPath);
  }

  throw new Error(`Cannot resolve: ${trimmed}`);
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

class AgentExpressionResolver {
  private helpers = new Map<string, ExpressionHelperFn>(
    Object.entries(BUILT_IN_HELPERS),
  );

  registerFunction(name: string, fn: ExpressionHelperFn): void {
    const key = name.startsWith('$') ? name : `$${name}`;
    this.helpers.set(key, fn);
  }

  listFunctions(): string[] {
    return Array.from(this.helpers.keys()).sort();
  }

  validate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const regex = /\{\{([\s\S]*?)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template)) !== null) {
      const body = match[1].trim();
      if (!body) errors.push(`Empty expression at position ${match.index}`);
    }
    const opens = (template.match(/\{\{/g) ?? []).length;
    const closes = (template.match(/\}\}/g) ?? []).length;
    if (opens !== closes) errors.push('Unbalanced {{ }} in template');
    return { valid: errors.length === 0, errors };
  }

  resolvePath(obj: unknown, path: string): unknown {
    return resolveDottedPath(obj, path);
  }

  resolve(template: string, ctx: ExpressionContext): string {
    return template.replace(/\{\{([\s\S]*?)\}\}/g, (_match, body: string) => {
      try {
        const value = evaluateExpressionBody(body, ctx, this.helpers);
        return value === null || value === undefined
          ? ''
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
      } catch {
        return `{{${body}}}`;
      }
    });
  }

  resolveOne(expression: string, ctx: ExpressionContext): ResolvedExpression {
    try {
      const body = expression.replace(/^\{\{|\}\}$/g, '').trim();
      const resolved = evaluateExpressionBody(body, ctx, this.helpers);
      return { original: expression, resolved, success: true };
    } catch (err) {
      return {
        original: expression,
        resolved: undefined,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  resolveAll(
    params: Record<string, unknown>,
    ctx: ExpressionContext,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        result[key] = this.resolve(value, ctx);
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.resolveAll(value as Record<string, unknown>, ctx);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const expressionResolver = new AgentExpressionResolver();
