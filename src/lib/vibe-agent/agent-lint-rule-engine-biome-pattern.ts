/**
 * Agent Lint Rule Engine — Biome Rule System Pattern
 *
 * Maps biome's declarative lint rule system to agent validation.
 * Agents define rules; the engine evaluates them and produces diagnostics.
 *
 * Biome concepts mapped:
 * - Rule: declarative validation with severity + message
 * - RuleCategory: grouping (correctness, style, performance, security)
 * - RuleFix: auto-fixable suggestion attached to a diagnostic
 * - Analyzer: runs all rules against an agent or workflow artifact
 *
 * Pattern source: biomejs/biome analyzer/src/rule.rs + lint categories
 */

// ─── Types ──────────────────────────────────────────────────

/** Rule severity matching biome's Severity enum */
export type RuleSeverity = 'error' | 'warning' | 'info';

/** Rule categories matching biome's lint groups */
export type RuleCategory =
  | 'correctness'   // Logic errors, broken invariants
  | 'performance'   // Perf anti-patterns
  | 'security'      // Security vulnerabilities
  | 'style'         // Naming, formatting conventions
  | 'suspicious'    // Code that is likely a mistake
  | 'a11y';         // Accessibility issues

/** A lint diagnostic produced by a rule */
export interface LintDiagnostic {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  message: string;
  /** Target identifier (agent name, workflow id, etc.) */
  target: string;
  /** Optional fix suggestion */
  fix?: LintFix;
  /** Additional context for debugging */
  metadata?: Record<string, unknown>;
}

/** Auto-fix suggestion (biome's CodeAction equivalent) */
export interface LintFix {
  description: string;
  /** If true, safe to apply automatically */
  safe: boolean;
  /** Apply function — mutates the target to fix the issue */
  apply?: () => void;
}

/** Rule check function — returns diagnostics if rule is violated */
export type RuleChecker<T = unknown> = (target: T, ctx: RuleContext) => LintDiagnostic[];

/** Context passed to rule checkers */
export interface RuleContext {
  /** Current rule being evaluated */
  ruleId: string;
  /** Helper to create a diagnostic */
  report: (opts: Omit<LintDiagnostic, 'ruleId' | 'ruleName' | 'category' | 'severity'>) => LintDiagnostic;
}

/** Rule definition (biome's Rule trait equivalent) */
export interface LintRule<T = unknown> {
  id: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  /** Whether this rule is enabled by default */
  recommended: boolean;
  /** The check function */
  check: RuleChecker<T>;
}

// ─── Lint Rule Engine ───────────────────────────────────────

/**
 * Singleton engine that registers and executes lint rules.
 * Mirrors biome's Analyzer + RuleRegistry pattern.
 */
class AgentLintRuleEngine {
  private rules = new Map<string, LintRule>();
  private disabledRules = new Set<string>();

  /** Register a lint rule */
  register<T>(rule: LintRule<T>): void {
    this.rules.set(rule.id, rule as LintRule);
  }

  /** Disable a rule by id */
  disable(ruleId: string): void {
    this.disabledRules.add(ruleId);
  }

  /** Enable a previously disabled rule */
  enable(ruleId: string): void {
    this.disabledRules.delete(ruleId);
  }

  /** Run all enabled rules against a target */
  analyze<T>(target: T): LintDiagnostic[] {
    const diagnostics: LintDiagnostic[] = [];

    for (const rule of this.rules.values()) {
      if (this.disabledRules.has(rule.id)) continue;
      if (!rule.recommended && !this.isExplicitlyEnabled(rule.id)) continue;

      const ctx: RuleContext = {
        ruleId: rule.id,
        report: (opts) => ({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          ...opts,
        }),
      };

      try {
        const results = rule.check(target, ctx);
        diagnostics.push(...results);
      } catch {
        // Rule must not crash the engine — biome's error isolation
      }
    }

    return diagnostics;
  }

  /** Run rules filtered by category */
  analyzeByCategory<T>(target: T, category: RuleCategory): LintDiagnostic[] {
    return this.analyze(target).filter((d) => d.category === category);
  }

  /** Get all registered rules */
  listRules(): Array<{ id: string; name: string; category: RuleCategory; severity: RuleSeverity; recommended: boolean }> {
    return Array.from(this.rules.values()).map(({ id, name, category, severity, recommended }) => ({
      id, name, category, severity, recommended,
    }));
  }

  /** Get rules by category */
  getRulesByCategory(category: RuleCategory): LintRule[] {
    return Array.from(this.rules.values()).filter((r) => r.category === category);
  }

  /** Apply all safe auto-fixes from diagnostics */
  applyFixes(diagnostics: LintDiagnostic[]): number {
    let applied = 0;
    for (const d of diagnostics) {
      if (d.fix?.safe && d.fix.apply) {
        d.fix.apply();
        applied++;
      }
    }
    return applied;
  }

  /** Summary stats from diagnostics */
  summarize(diagnostics: LintDiagnostic[]): { errors: number; warnings: number; infos: number; fixable: number } {
    return {
      errors: diagnostics.filter((d) => d.severity === 'error').length,
      warnings: diagnostics.filter((d) => d.severity === 'warning').length,
      infos: diagnostics.filter((d) => d.severity === 'info').length,
      fixable: diagnostics.filter((d) => d.fix?.safe).length,
    };
  }

  /** Clear all rules */
  clear(): void {
    this.rules.clear();
    this.disabledRules.clear();
  }

  private isExplicitlyEnabled(ruleId: string): boolean {
    return this.rules.has(ruleId) && !this.disabledRules.has(ruleId);
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentLintRuleEngine = new AgentLintRuleEngine();
