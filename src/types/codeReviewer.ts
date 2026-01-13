/**
 * Code Reviewer Agent Types
 * Extracted interfaces for better modularity and reusability.
 */

export interface SecurityScanResult {
    vulnerabilities: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        file: string;
    }>;
}

export interface ArchitectureAnalysis {
    patterns: string[];
    issues: string[];
    suggestions: string[];
}

export interface FixSuggestion {
    file: string;
    issue: string;
    suggestion: string;
    code: string;
}

export interface FixSuggestionsResult {
    fixes: FixSuggestion[];
}

export interface ReviewOptions {
    checkSecurity?: boolean;
    checkTests?: boolean;
    checkStyle?: boolean;
    strictMode?: boolean;
}

export type CodeReviewerAction =
    | { action: 'reviewPR'; prNumber?: string; files?: string[]; options?: ReviewOptions }
    | { action: 'checkSecurity'; files?: string[] }
    | { action: 'analyzeArchitecture'; files?: string[] }
    | { action: 'suggestFixes'; files?: string[] };
