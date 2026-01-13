/**
 * Debugger Agent Types
 * Extracted interfaces for better modularity and reusability.
 */

export interface FixResult {
    status: 'applied' | 'pending' | 'failed';
    timestamp: string;
    filesModified: string[];
    validationSteps: string[];
    rollbackPlan: string;
}

export type DebuggerAction =
    | { action: 'diagnose'; issue: string; context?: Record<string, unknown> }
    | { action: 'applyFix'; context?: Record<string, unknown> }
    | { action: 'profile'; context?: Record<string, unknown> }
    | { action: 'suggest'; issue: string; context?: Record<string, unknown> };
