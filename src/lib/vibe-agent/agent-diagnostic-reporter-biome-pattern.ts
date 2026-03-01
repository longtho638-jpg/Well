/**
 * Agent Diagnostic Reporter — Biome Diagnostic Pattern
 *
 * Maps biome's rich diagnostic output to agent error reporting.
 * Structured diagnostics with severity, location, code frames, and suggestions.
 *
 * Biome concepts mapped:
 * - Diagnostic: structured error/warning with location info
 * - Advice: contextual hints and suggestions
 * - CodeFrame: source context around the issue
 * - DiagnosticPrinter: formats diagnostics for console/UI
 *
 * Pattern source: biomejs/biome diagnostics/src/display.rs
 */

// ─── Types ──────────────────────────────────────────────────

export type DiagnosticSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'hint';

/** Source location of the diagnostic */
export interface DiagnosticLocation {
  /** File path, agent name, or workflow id */
  resource: string;
  /** Specific section/method/step within the resource */
  span?: string;
}

/** Contextual advice attached to a diagnostic (biome Advice) */
export interface DiagnosticAdvice {
  type: 'note' | 'help' | 'see-also' | 'code';
  message: string;
  /** Optional URL for 'see-also' type */
  url?: string;
}

/** Full diagnostic record */
export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  category: string;
  message: string;
  location: DiagnosticLocation;
  advice: DiagnosticAdvice[];
  timestamp: string;
  /** Tags for filtering */
  tags: string[];
}

/** Formatted diagnostic output */
export interface FormattedDiagnostic {
  text: string;
  ansi: string;
}

// ─── Reporter ───────────────────────────────────────────────

/**
 * Singleton reporter collecting and formatting diagnostics.
 * Mirrors biome's DiagnosticPrinter pattern.
 */
class AgentDiagnosticReporter {
  private diagnostics: Diagnostic[] = [];
  private maxHistorySize = 500;
  private idCounter = 0;

  /** Create and record a diagnostic */
  report(
    severity: DiagnosticSeverity,
    category: string,
    message: string,
    location: DiagnosticLocation,
    advice: DiagnosticAdvice[] = [],
    tags: string[] = [],
  ): Diagnostic {
    const diagnostic: Diagnostic = {
      id: `diag_${++this.idCounter}`,
      severity,
      category,
      message,
      location,
      advice,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.diagnostics.push(diagnostic);
    if (this.diagnostics.length > this.maxHistorySize) {
      this.diagnostics.shift();
    }

    return diagnostic;
  }

  /** Shorthand reporters */
  error(category: string, message: string, location: DiagnosticLocation, advice?: DiagnosticAdvice[]): Diagnostic {
    return this.report('error', category, message, location, advice);
  }

  warning(category: string, message: string, location: DiagnosticLocation, advice?: DiagnosticAdvice[]): Diagnostic {
    return this.report('warning', category, message, location, advice);
  }

  info(category: string, message: string, location: DiagnosticLocation, advice?: DiagnosticAdvice[]): Diagnostic {
    return this.report('info', category, message, location, advice);
  }

  /** Format a diagnostic for console display (biome's rich output) */
  format(diagnostic: Diagnostic): FormattedDiagnostic {
    const icon = SEVERITY_ICONS[diagnostic.severity];
    const label = diagnostic.severity.toUpperCase();

    let text = `${icon} ${label}[${diagnostic.category}]: ${diagnostic.message}\n`;
    text += `   at ${diagnostic.location.resource}`;
    if (diagnostic.location.span) text += `:${diagnostic.location.span}`;
    text += '\n';

    for (const a of diagnostic.advice) {
      const prefix = a.type === 'help' ? '  help: ' : a.type === 'note' ? '  note: ' : '  see: ';
      text += `${prefix}${a.message}`;
      if (a.url) text += ` (${a.url})`;
      text += '\n';
    }

    // ANSI colored version
    const color = SEVERITY_COLORS[diagnostic.severity];
    const ansi = text
      .replace(label, `${color}${label}\x1b[0m`)
      .replace(diagnostic.message, `\x1b[1m${diagnostic.message}\x1b[0m`);

    return { text: text.trimEnd(), ansi: ansi.trimEnd() };
  }

  /** Format all diagnostics as a summary report */
  formatSummary(): string {
    const counts = this.getCounts();
    const lines = [
      `Diagnostics: ${this.diagnostics.length} total`,
      `  ${SEVERITY_ICONS.fatal} Fatal: ${counts.fatal}`,
      `  ${SEVERITY_ICONS.error} Errors: ${counts.error}`,
      `  ${SEVERITY_ICONS.warning} Warnings: ${counts.warning}`,
      `  ${SEVERITY_ICONS.info} Info: ${counts.info}`,
      `  ${SEVERITY_ICONS.hint} Hints: ${counts.hint}`,
    ];
    return lines.join('\n');
  }

  /** Get diagnostics filtered by severity */
  getBySeverity(severity: DiagnosticSeverity): Diagnostic[] {
    return this.diagnostics.filter((d) => d.severity === severity);
  }

  /** Get diagnostics filtered by category */
  getByCategory(category: string): Diagnostic[] {
    return this.diagnostics.filter((d) => d.category === category);
  }

  /** Get diagnostics for a specific resource */
  getByResource(resource: string): Diagnostic[] {
    return this.diagnostics.filter((d) => d.location.resource === resource);
  }

  /** Get all diagnostics */
  getAll(): Diagnostic[] {
    return [...this.diagnostics];
  }

  /** Count by severity */
  getCounts(): Record<DiagnosticSeverity, number> {
    const counts: Record<DiagnosticSeverity, number> = { fatal: 0, error: 0, warning: 0, info: 0, hint: 0 };
    for (const d of this.diagnostics) counts[d.severity]++;
    return counts;
  }

  /** Check if any errors/fatals exist */
  hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === 'error' || d.severity === 'fatal');
  }

  /** Clear all diagnostics */
  clear(): void {
    this.diagnostics = [];
    this.idCounter = 0;
  }
}

// ─── Constants ──────────────────────────────────────────────

const SEVERITY_ICONS: Record<DiagnosticSeverity, string> = {
  fatal: 'x',
  error: 'x',
  warning: '!',
  info: 'i',
  hint: '?',
};

const SEVERITY_COLORS: Record<DiagnosticSeverity, string> = {
  fatal: '\x1b[31m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  hint: '\x1b[90m',
};

// ─── Singleton ──────────────────────────────────────────────

export const agentDiagnosticReporter = new AgentDiagnosticReporter();
