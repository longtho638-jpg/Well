/**
 * Code Reviewer Agent (Refactored)
 * Automated code review and quality assurance coordinator.
 * 
 * Logic delegated to reviewEngine.ts for analysis.
 */

import { BaseAgent } from '../core/BaseAgent';
import { reviewEngine, ReviewResult, ReviewIssue } from '@/services/reviewEngine';
import {
    SecurityScanResult,
    ArchitectureAnalysis,
    FixSuggestionsResult,
    ReviewOptions,
    CodeReviewerAction,
} from '@/types/codeReviewer';

// Re-export types for external use
export type { SecurityScanResult, ArchitectureAnalysis, FixSuggestionsResult, ReviewOptions, CodeReviewerAction };

type ReviewExecutionResult = ReviewResult | SecurityScanResult | ArchitectureAnalysis | FixSuggestionsResult;

export class CodeReviewerAgent extends BaseAgent {
    private readonly prsReviewed: { count: number } = { count: 0 };
    private readonly issuesFound: { count: number } = { count: 0 };

    constructor() {
        super({
            agent_name: 'Code Reviewer',
            business_function: 'Operations & Logistics',
            primary_objectives: [
                'Perform automated code reviews on pull requests',
                'Detect security vulnerabilities and code smells',
                'Enforce type safety and coding standards',
                'Identify performance bottlenecks and optimization opportunities',
            ],
            inputs: [
                { source: 'pull_request', dataType: 'API' },
                { source: 'source_files', dataType: 'user_input' },
                { source: 'review_options', dataType: 'user_input' },
            ],
            tools_and_systems: [
                'TypeScript Compiler',
                'ESLint',
                'Security Scanner',
                'Review Engine (Internal)',
            ],
            core_actions: [
                'reviewPR',
                'checkSecurity',
                'analyzeArchitecture',
                'suggestFixes',
            ],
            outputs: [
                'review_report',
                'issue_list',
                'fix_suggestions',
            ],
            success_kpis: [
                { name: 'PRs Reviewed', target: 200, current: 0, unit: 'reviews' },
                { name: 'Issues Found', target: 150, current: 0, unit: 'issues' },
                { name: 'False Positive Rate', target: 5, current: 0, unit: '%' },
            ],
            risk_and_failure_modes: [
                'False positives blocking valid code',
                'Missing critical security vulnerabilities',
                'Inconsistent review standards',
            ],
            human_in_the_loop_points: [
                'Critical security findings require human verification',
                'Architecture decisions need senior engineer review',
            ],
            policy_and_constraints: [
                {
                    rule: 'All critical issues must block merge',
                    enforcement: 'hard',
                },
                {
                    rule: 'Test coverage must be >= 80%',
                    enforcement: 'soft',
                },
            ],
            visibility: 'all',
        });
    }

    async execute(action: CodeReviewerAction): Promise<{ success: boolean; data?: ReviewExecutionResult; error?: string }> {
        try {
            let result: ReviewExecutionResult;

            switch (action.action) {
                case 'reviewPR':
                    result = await this.reviewPullRequest(
                        action.prNumber || '0',
                        action.files || [],
                        action.options
                    );
                    this.prsReviewed.count++;
                    this.updateKPI('PRs Reviewed', this.prsReviewed.count);
                    break;

                case 'checkSecurity':
                    result = await this.performSecurityScan(action.files || []);
                    break;

                case 'analyzeArchitecture':
                    result = await this.analyzeCodeArchitecture(action.files || []);
                    break;

                case 'suggestFixes':
                    result = await this.generateFixSuggestions(action.files || []);
                    break;

                default:
                    const exhaustiveCheck: never = action;
                    throw new Error(`Unknown action: ${(action as { action: string }).action}`);
            }

            return { success: true, data: result };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Review a pull request (Coordination Logic)
     */
    private async reviewPullRequest(
        prNumber: string,
        files: string[],
        options?: ReviewOptions
    ): Promise<ReviewResult> {
        const issues: ReviewIssue[] = [];

        // Security
        if (options?.checkSecurity !== false) {
            const securityResults = await this.performSecurityScan(files);
            issues.push(...reviewEngine.mapSecurityIssues(securityResults.vulnerabilities));
        }

        // Analysis Hooks
        issues.push(...reviewEngine.checkTypeSafety(files));
        issues.push(...reviewEngine.checkPerformance(files));

        // Style
        if (options?.checkStyle !== false) {
            issues.push(...reviewEngine.checkCodeStyle(files));
        }

        // KPI Management
        this.issuesFound.count += issues.length;
        this.updateKPI('Issues Found', this.issuesFound.count);

        const summary = reviewEngine.summarizeIssues(issues);

        return {
            prNumber,
            filesReviewed: files,
            issues,
            summary,
            recommendation: reviewEngine.determineRecommendation(summary),
            testCoverage: 85.5, // Mocked for SEED demo
        };
    }

    private async performSecurityScan(files: string[]): Promise<SecurityScanResult> {
        const vulnerabilities: SecurityScanResult['vulnerabilities'] = [];
        for (const file of files) {
            if (file.includes('auth')) {
                vulnerabilities.push({ type: 'SQL Injection Risk', severity: 'critical', file });
            }
            if (file.includes('api')) {
                vulnerabilities.push({ type: 'Missing Input Validation', severity: 'high', file });
            }
        }
        return { vulnerabilities };
    }

    private async analyzeCodeArchitecture(files: string[]): Promise<ArchitectureAnalysis> {
        return {
            patterns: ['Repository Pattern', 'Service Layer'],
            issues: ['High coupling between components detected', 'Missing abstraction layers'],
            suggestions: ['Extract interfaces for better testability', 'Implement dependency injection'],
        };
    }

    private async generateFixSuggestions(files: string[]): Promise<FixSuggestionsResult> {
        return {
            fixes: [
                {
                    file: files[0] || 'Unknown',
                    issue: 'Missing error handling',
                    suggestion: 'Wrap in try-catch block',
                    code: 'try { /* existing code */ } catch (error) { handleError(error); }',
                }
            ],
        };
    }
}
