/**
 * Debugger Agent (Refactored)
 * Coordinator for production issue resolution and performance profiling.
 */

import { BaseAgent } from '../core/BaseAgent';
import { debuggerEngine, DiagnosisResult, FixSuggestion, PerformanceProfile } from '@/services/debuggerEngine';
import { DebuggerAction, FixResult } from '@/types/debugger';

// Re-export types for external use
export type { DebuggerAction, FixResult };

type DebuggerResult = DiagnosisResult | FixResult | PerformanceProfile | FixSuggestion[];

export class DebuggerAgent extends BaseAgent {
    private readonly issuesDiagnosed: { count: number } = { count: 0 };
    private readonly fixesApplied: { count: number } = { count: 0 };
    private readonly totalResolutionTime: { value: number } = { value: 0 };

    constructor() {
        super({
            agent_name: 'System Debugger',
            business_function: 'Operations & Logistics',
            primary_objectives: [
                'Diagnose production errors and API failures',
                'Identify database connection and performance issues',
                'Profile application performance bottlenecks',
                'Suggest and apply automated fixes with approval gates',
            ],
            inputs: [
                { source: 'error_logs', dataType: 'logs' },
                { source: 'performance_metrics', dataType: 'API' },
                { source: 'issue_description', dataType: 'user_input' },
            ],
            tools_and_systems: [
                'Application Logs',
                'Database Query Profiler',
                'Performance Monitoring',
                'Debugger Engine (Internal)',
            ],
            core_actions: [
                'diagnose',
                'applyFix',
                'profile',
                'suggest',
            ],
            outputs: [
                'diagnosis_report',
                'fix_suggestions',
                'performance_profile',
            ],
            success_kpis: [
                { name: 'Issues Diagnosed', target: 100, current: 0, unit: 'issues' },
                { name: 'Fixes Applied', target: 50, current: 0, unit: 'fixes' },
                { name: 'Avg Resolution Time', target: 300, current: 0, unit: 'seconds' },
            ],
            risk_and_failure_modes: [
                'Incorrect diagnosis leading to wrong fix',
                'Automated fix breaks production environment',
            ],
            human_in_the_loop_points: [
                'All automated fixes require manual review and approval',
            ],
            policy_and_constraints: [
                {
                    rule: 'Never apply code changes directly without a rollback plan',
                    enforcement: 'hard'
                }
            ],
            visibility: 'all',
        });
    }

    async execute(action: DebuggerAction): Promise<{ success: boolean; data?: DebuggerResult; error?: string }> {
        const startTime = Date.now();

        try {
            let result: DebuggerResult;

            switch (action.action) {
                case 'diagnose':
                    result = await debuggerEngine.diagnoseIssue(action.issue, action.context);
                    this.issuesDiagnosed.count++;
                    this.updateKPI('Issues Diagnosed', this.issuesDiagnosed.count);
                    break;

                case 'applyFix':
                    result = await this.performFix(action.context || {});
                    this.fixesApplied.count++;
                    this.updateKPI('Fixes Applied', this.fixesApplied.count);
                    break;

                case 'profile':
                    result = await debuggerEngine.profilePerformance(action.context);
                    break;

                case 'suggest':
                    result = await debuggerEngine.generateFixSuggestions(debuggerEngine.detectIssueType(action.issue));
                    break;

                default:
                    const exhaustiveCheck: never = action;
                    throw new Error(`Unknown action: ${(action as { action: string }).action}`);
            }

            // Telemetry
            const duration = (Date.now() - startTime) / 1000;
            this.totalResolutionTime.value += duration;
            const avgTime = Math.round(this.totalResolutionTime.value / (this.issuesDiagnosed.count || 1));
            this.updateKPI('Avg Resolution Time', avgTime);

            return { success: true, data: result };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Internal simulation of fix application
     */
    private async performFix(context: Record<string, unknown>): Promise<FixResult> {
        return {
            status: 'applied',
            timestamp: new Date().toISOString(),
            filesModified: (context.affectedFiles as string[]) || [],
            validationSteps: [
                'Verify endpoint health',
                'Monitor error rate reduction'
            ],
            rollbackPlan: 'git revert HEAD'
        };
    }
}
