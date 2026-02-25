/**
 * ProjectManagerAgent - Multi-agent coordination and project tracking (Refactored)
 * 
 * Capabilities:
 * - Coordinate multiple agents
 * - Track project progress
 * - Generate status reports
 * - Identify blockers
 */

import { BaseAgent } from '../core/BaseAgent';
import {
    ProjectReport,
    WorkflowPlan,
    ProgressMetrics,
    BlockerList,
    ProjectManagerAction,
} from '@/types/projectManager';

// Re-export types for external use
export type { ProjectReport, WorkflowPlan, ProgressMetrics, BlockerList, ProjectManagerAction };

type ExecutionResult = ProjectReport | WorkflowPlan | ProgressMetrics | BlockerList;

export class ProjectManagerAgent extends BaseAgent {
    private readonly reportsGenerated: { count: number } = { count: 0 };

    constructor() {
        super({
            agent_name: 'Project Manager',
            business_function: 'Operations & Logistics',
            primary_objectives: [
                'Coordinate multi-agent workflows',
                'Track project progress and KPIs',
                'Generate status reports',
                'Identify and escalate blockers',
            ],
            inputs: [
                { source: 'agent_status', dataType: 'API' },
                { source: 'project_metrics', dataType: 'API' },
                { source: 'report_request', dataType: 'user_input' },
            ],
            tools_and_systems: [
                'Agent Registry',
                'KPI Tracker',
                'Report Generator',
                'Workflow Orchestrator',
            ],
            core_actions: [
                'generateReport',
                'coordinateAgents',
                'trackProgress',
                'identifyBlockers',
            ],
            outputs: [
                'status_report',
                'workflow_plan',
                'blocker_list',
            ],
            success_kpis: [
                { name: 'Reports Generated', target: 50, current: 0, unit: 'reports' },
                { name: 'Workflows Coordinated', target: 30, current: 0, unit: 'workflows' },
                { name: 'Blockers Resolved', target: 95, current: 0, unit: '%' },
            ],
            risk_and_failure_modes: [
                'Incomplete agent data',
                'Workflow bottlenecks',
                'Communication gaps',
            ],
            human_in_the_loop_points: [
                'Approve workflow changes',
                'Review critical blockers',
            ],
            policy_and_constraints: [
                {
                    rule: 'Escalate critical blockers immediately',
                    enforcement: 'hard',
                    notes: 'Prevent project delays',
                },
            ],
            visibility: 'all',
        });
    }

    async execute(action: ProjectManagerAction): Promise<{ success: boolean; data?: ExecutionResult; error?: string }> {
        try {
            let result: ExecutionResult;

            switch (action.action) {
                case 'generateReport':
                    result = await this.createStatusReport(action.reportType);
                    this.reportsGenerated.count++;
                    this.updateKPI('Reports Generated', this.reportsGenerated.count);
                    break;

                case 'coordinateAgents':
                    result = await this.orchestrateWorkflow(action.agents);
                    break;

                case 'trackProgress':
                    result = await this.monitorProgress(action.scope);
                    break;

                case 'identifyBlockers':
                    result = await this.findBlockers();
                    break;

                default: {
                    const _exhaustiveCheck: never = action;
                    throw new Error(`Unknown action: ${(action as { action: string }).action}`);
                }
            }

            return { success: true, data: result };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async createStatusReport(reportType?: string): Promise<ProjectReport> {
        return {
            reportType: reportType || 'weekly-status',
            generatedAt: new Date().toISOString(),
            summary: {
                totalAgents: 30,
                activeAgents: 28,
                tasksCompleted: 156,
                tasksInProgress: 12,
                blockers: 2,
            },
            highlights: [
                '4 new agents integrated successfully',
                '108/108 tests passing',
                'Zero technical debt achieved',
            ],
            nextPriorities: [
                'Complete remaining agent integrations',
                'Enhance agent UI panels',
                'Implement multi-agent workflows',
            ],
        };
    }

    private async orchestrateWorkflow(agents?: string[]): Promise<WorkflowPlan> {
        return {
            workflow: 'feature-implementation',
            agents: agents || ['scout', 'planner', 'developer', 'tester'],
            sequence: [
                { agent: 'scout', action: 'research' },
                { agent: 'planner', action: 'plan' },
                { agent: 'developer', action: 'implement' },
                { agent: 'tester', action: 'verify' },
            ],
            estimatedTime: '2-3 days',
        };
    }

    private async monitorProgress(scope?: string): Promise<ProgressMetrics> {
        return {
            scope: scope || 'current-sprint',
            velocity: 42,
            completed: 15,
            inProgress: 5,
            planned: 10,
            percentComplete: 50,
        };
    }

    private async findBlockers(): Promise<BlockerList> {
        return {
            blockers: [
                {
                    id: 'blocker-1',
                    description: 'API rate limiting on external service',
                    impact: 'high',
                    affectedAgents: ['scout-external'],
                    suggestedResolution: 'Implement request caching',
                },
            ],
            totalBlockers: 1,
            criticalBlockers: 0,
        };
    }
}
