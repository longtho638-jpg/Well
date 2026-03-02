/**
 * Agent Diagnostic Reporter — Types (Biome Diagnostic Pattern)
 *
 * Extracted from agent-diagnostic-reporter-biome-pattern.ts.
 * Contains: DiagnosticSeverity, DiagnosticLocation, DiagnosticAdvice,
 * Diagnostic, FormattedDiagnostic.
 */

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
