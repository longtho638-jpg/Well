import { BaseAgent } from '../core/BaseAgent';

interface DiagnosisResult {
    issue: string;
    rootCause: string;
    affectedFiles: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    fixSuggestions: FixSuggestion[];
    validationSteps: string[];
}

interface FixSuggestion {
    id: string;
    title: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    code?: string;
    affectedFiles: string[];
    estimatedTime: number; // minutes
}

interface PerformanceProfile {
    endpoint: string;
    avgLatency: number;
    p95Latency: number;
    slowQueries: string[];
    optimizations: string[];
}

/**
 * DebuggerAgent - Production debugging and issue resolution
 * 
 * Capabilities:
 * - Diagnose API errors and 500s
 * - Identify database connection issues
 * - Profile performance problems
 * - Suggest and apply fixes with approval gates
 */
export class DebuggerAgent extends BaseAgent {
    private issuesDiagnosed: number = 0;
    private fixesApplied: number = 0;
    private totalResolutionTime: number = 0; // seconds

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
                'Code Analysis',
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
                'Automated fix breaks production',
                'Performance profiling overhead impacts production',
            ],
            human_in_the_loop_points: [
                'All fixes require approval before application',
                'High-risk changes must be reviewed by senior engineer',
            ],
            policy_and_constraints: [
                {
                    rule: 'Never apply fixes without explicit approval',
                    enforcement: 'hard',
                    notes: 'Approval gate required for all automated changes',
                },
                {
                    rule: 'Rollback plan must be provided with every fix',
                    enforcement: 'hard',
                    notes: 'Ensures safe recovery if fix fails',
                },
            ],
        });
    }

    async execute(action: {
        action: 'diagnose' | 'applyFix' | 'profile' | 'suggest';
        issue?: string;
        context?: any;
    }): Promise<any> {
        const startTime = Date.now();
        // Log action (BaseAgent.log signature may differ)

        let result: any;

        try {
            switch (action.action) {
                case 'diagnose':
                    result = await this.diagnoseIssue(action.issue!, action.context);
                    this.issuesDiagnosed++;
                    this.updateKPI('Issues Diagnosed', this.issuesDiagnosed);
                    break;

                case 'applyFix':
                    result = await this.applyFix(action.context);
                    this.fixesApplied++;
                    this.updateKPI('Fixes Applied', this.fixesApplied);
                    break;

                case 'profile':
                    result = await this.profilePerformance(action.context);
                    break;

                case 'suggest':
                    result = await this.suggestFixes(action.issue!, action.context);
                    break;

                default:
                    throw new Error(`Unknown action: ${action.action}`);
            }

            // Track resolution time
            const resolutionTime = (Date.now() - startTime) / 1000;
            this.totalResolutionTime += resolutionTime;
            const avgTime = this.totalResolutionTime / (this.issuesDiagnosed || 1);
            this.updateKPI('Avg Resolution Time', Math.round(avgTime));

            return { success: true, ...result };
        } catch (error) {
            // Log error
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Diagnose a production issue
     */
    private async diagnoseIssue(issue: string, context?: any): Promise<DiagnosisResult> {
        // Simulate AI-powered diagnosis
        // In production, this would call Gemini API with logs/traces

        const issueType = this.detectIssueType(issue);

        const diagnosis: DiagnosisResult = {
            issue,
            rootCause: this.identifyRootCause(issue, issueType, context),
            affectedFiles: this.findAffectedFiles(issueType),
            severity: this.assessSeverity(issue),
            fixSuggestions: this.generateFixSuggestions(issueType),
            validationSteps: this.getValidationSteps(issueType),
        };

        return diagnosis;
    }

    /**
     * Apply an approved fix
     */
    private async applyFix(fixContext: FixSuggestion): Promise<any> {
        // Simulate fix application
        // In production, this would make actual code/config changes

        return {
            filesModified: fixContext.affectedFiles,
            changesApplied: fixContext.code ? [fixContext.code] : [],
            validationSteps: [
                'Run automated tests',
                'Check application logs',
                'Verify endpoint functionality',
                'Monitor error rates',
            ],
            rollbackPlan: {
                command: 'git revert HEAD',
                description: 'Revert to previous commit if issues persist',
            },
        };
    }

    /**
     * Profile performance issues
     */
    private async profilePerformance(context: any): Promise<PerformanceProfile> {
        // Simulate performance profiling
        // In production, would analyze real metrics

        return {
            endpoint: context?.endpoint || '/api/products',
            avgLatency: 250,
            p95Latency: 850,
            slowQueries: [
                'SELECT * FROM products WHERE category = ... (145ms)',
                'SELECT * FROM users JOIN orders ... (380ms)',
            ],
            optimizations: [
                'Add index on products.category column',
                'Use SELECT specific columns instead of *',
                'Implement query result caching',
                'Use database connection pooling',
            ],
        };
    }

    /**
     * Suggest fixes for an issue
     */
    private async suggestFixes(issue: string, context?: any): Promise<FixSuggestion[]> {
        const issueType = this.detectIssueType(issue);
        return this.generateFixSuggestions(issueType);
    }

    // Helper methods

    private detectIssueType(issue: string): string {
        const lowerIssue = issue.toLowerCase();

        if (lowerIssue.includes('500') || lowerIssue.includes('error')) {
            return 'api_error';
        }
        if (lowerIssue.includes('database') || lowerIssue.includes('connection')) {
            return 'database';
        }
        if (lowerIssue.includes('slow') || lowerIssue.includes('latency')) {
            return 'performance';
        }
        if (lowerIssue.includes('build') || lowerIssue.includes('ci')) {
            return 'build';
        }

        return 'unknown';
    }

    private identifyRootCause(issue: string, type: string, context?: any): string {
        const causes: Record<string, string> = {
            api_error: 'Missing null check on req.user object causing unhandled exception',
            database: 'Connection pool exhausted - 47/20 connections active, likely leaked transactions',
            performance: 'N+1 query problem - fetching related data in loop instead of JOIN',
            build: 'Missing dependency in package.json after recent update',
            unknown: 'Requires manual investigation with full error logs',
        };

        return causes[type] || causes.unknown;
    }

    private findAffectedFiles(type: string): string[] {
        const files: Record<string, string[]> = {
            api_error: ['src/api/products.ts', 'src/middleware/auth.ts'],
            database: ['src/lib/db.ts', 'src/config/database.ts'],
            performance: ['src/api/orders.ts', 'src/lib/queries.ts'],
            build: ['package.json', '.github/workflows/ci.yml'],
            unknown: [],
        };

        return files[type] || [];
    }

    private assessSeverity(issue: string): 'low' | 'medium' | 'high' | 'critical' {
        if (issue.includes('500') || issue.includes('crash')) return 'critical';
        if (issue.includes('slow') || issue.includes('timeout')) return 'high';
        if (issue.includes('warning')) return 'medium';
        return 'low';
    }

    private generateFixSuggestions(type: string): FixSuggestion[] {
        const suggestions: Record<string, FixSuggestion[]> = {
            api_error: [
                {
                    id: 'fix-1',
                    title: 'Add null check for req.user',
                    description: 'Add authentication validation before accessing user object',
                    riskLevel: 'low',
                    code: 'if (!req.user) return res.status(401).json({ error: "Unauthorized" });',
                    affectedFiles: ['src/middleware/auth.ts'],
                    estimatedTime: 5,
                },
            ],
            database: [
                {
                    id: 'fix-2',
                    title: 'Implement connection pooling',
                    description: 'Configure max connections and idle timeout',
                    riskLevel: 'medium',
                    affectedFiles: ['src/lib/db.ts'],
                    estimatedTime: 15,
                },
            ],
            performance: [
                {
                    id: 'fix-3',
                    title: 'Optimize query with JOIN',
                    description: 'Replace N+1 query pattern with single JOIN query',
                    riskLevel: 'low',
                    affectedFiles: ['src/lib/queries.ts'],
                    estimatedTime: 10,
                },
            ],
        };

        return suggestions[type] || [];
    }

    private getValidationSteps(type: string): string[] {
        const steps: Record<string, string[]> = {
            api_error: [
                'Run integration tests: npm test',
                'Check API response: curl -X POST /api/products',
                'Monitor error rates in production logs',
            ],
            database: [
                'Verify connection count: SELECT count(*) FROM pg_stat_activity',
                'Check for long-running queries: SELECT * FROM pg_stat_activity WHERE state = \'active\'',
                'Monitor connection pool metrics',
            ],
            performance: [
                'Run performance tests: npm run test:perf',
                'Measure endpoint latency: curl -w "@curl-format.txt" /api/orders',
                'Check database query execution time',
            ],
        };

        return steps[type] || ['Manual verification required'];
    }

    private updateKPI(name: string, value: number): void {
        const kpi = this.definition.success_kpis.find((k) => k.name === name);
        if (kpi) {
            kpi.current = value;
        }
    }
}
