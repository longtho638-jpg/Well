import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManagerAgent, ProjectReport, WorkflowPlan, ProgressMetrics, BlockerList } from '@/agents/custom/ProjectManagerAgent';

/**
 * Project Manager Agent Tests
 * Testing multi-agent coordination and project tracking per PM Agent methodology
 */
describe('Project Manager Agent', () => {
    let agent: ProjectManagerAgent;

    beforeEach(() => {
        agent = new ProjectManagerAgent();
    });

    describe('Agent Definition', () => {
        it('should have correct agent name', () => {
            const def = agent.getDefinition();
            expect(def.agent_name).toBe('Project Manager');
        });

        it('should belong to Operations & Logistics function', () => {
            const def = agent.getDefinition();
            expect(def.business_function).toBe('Operations & Logistics');
        });

        it('should have 4 core actions', () => {
            const def = agent.getDefinition();
            expect(def.core_actions).toHaveLength(4);
            expect(def.core_actions).toContain('generateReport');
            expect(def.core_actions).toContain('coordinateAgents');
            expect(def.core_actions).toContain('trackProgress');
            expect(def.core_actions).toContain('identifyBlockers');
        });

        it('should have 3 KPIs defined', () => {
            const kpis = agent.getKPIs();
            expect(kpis).toHaveLength(3);
            expect(kpis.map(k => k.name)).toContain('Reports Generated');
            expect(kpis.map(k => k.name)).toContain('Workflows Coordinated');
            expect(kpis.map(k => k.name)).toContain('Blockers Resolved');
        });
    });

    describe('generateReport Action', () => {
        it('should generate a status report successfully', async () => {
            const result = await agent.execute({
                action: 'generateReport',
                reportType: 'weekly-status',
            });

            expect(result.success).toBe(true);
            const data = result.data as ProjectReport;
            expect(data.reportType).toBe('weekly-status');
            expect(data.summary).toBeDefined();
            expect(data.generatedAt).toBeDefined();
        });

        it('should include summary metrics in report', async () => {
            const result = await agent.execute({
                action: 'generateReport',
            });

            const data = result.data as ProjectReport;
            const summary = data.summary as Record<string, number>;
            expect(summary.totalAgents).toBeGreaterThan(0);
            expect(summary.activeAgents).toBeDefined();
            expect(summary.tasksCompleted).toBeDefined();
        });

        it('should update Reports Generated KPI', async () => {
            await agent.execute({ action: 'generateReport' });
            await agent.execute({ action: 'generateReport' });

            const kpis = agent.getKPIs();
            const reportKPI = kpis.find(k => k.name === 'Reports Generated');
            expect(reportKPI?.current).toBe(2);
        });
    });

    describe('coordinateAgents Action', () => {
        it('should orchestrate workflow with agents', async () => {
            const result = await agent.execute({
                action: 'coordinateAgents',
                agents: ['scout', 'developer', 'tester'],
            });

            expect(result.success).toBe(true);
            const data = result.data as WorkflowPlan;
            expect(data.workflow).toBeDefined();
            expect(data.agents).toContain('scout');
        });

        it('should define workflow sequence', async () => {
            const result = await agent.execute({
                action: 'coordinateAgents',
            });

            const data = result.data as WorkflowPlan;
            expect(data.sequence).toBeDefined();
            expect(Array.isArray(data.sequence)).toBe(true);
            expect(data.sequence[0]).toHaveProperty('agent');
            expect(data.sequence[0]).toHaveProperty('action');
        });
    });

    describe('trackProgress Action', () => {
        it('should monitor project progress', async () => {
            const result = await agent.execute({
                action: 'trackProgress',
                scope: 'current-sprint',
            });

            expect(result.success).toBe(true);
            const data = result.data as ProgressMetrics;
            expect(data.scope).toBe('current-sprint');
            expect(data.percentComplete).toBeDefined();
        });

        it('should include velocity and task counts', async () => {
            const result = await agent.execute({
                action: 'trackProgress',
            });

            const data = result.data as ProgressMetrics;
            expect(data.velocity).toBeDefined();
            expect(data.completed).toBeDefined();
            expect(data.inProgress).toBeDefined();
            expect(data.planned).toBeDefined();
        });
    });

    describe('identifyBlockers Action', () => {
        it('should identify project blockers', async () => {
            const result = await agent.execute({
                action: 'identifyBlockers',
            });

            expect(result.success).toBe(true);
            const data = result.data as BlockerList;
            expect(data.blockers).toBeDefined();
            expect(Array.isArray(data.blockers)).toBe(true);
        });

        it('should include blocker details', async () => {
            const result = await agent.execute({
                action: 'identifyBlockers',
            });

            const data = result.data as BlockerList;
            const blockers = data.blockers;
            if (blockers.length > 0) {
                const blocker = blockers[0];
                expect(blocker).toHaveProperty('id');
                expect(blocker).toHaveProperty('description');
                expect(blocker).toHaveProperty('impact');
                expect(blocker).toHaveProperty('suggestedResolution');
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle unknown actions gracefully', async () => {
            // @ts-ignore - Explicitly testing invalid action
            const result = await agent.execute({
                action: 'unknownAction'
            } as unknown as { action: 'generateReport' }); // Cast to valid type to bypass TS check for test

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});
