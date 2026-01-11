import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManagerAgent } from '@/agents/custom/ProjectManagerAgent';

/** Type for execute result */
type ExecuteResult = { success: boolean;[key: string]: unknown };

/**
 * Project Manager Agent Tests
 * Testing multi-agent coordination and project tracking per PM Agent methodology
 * 
 * Success Criteria:
 * - Project created
 * - Tasks assigned
 * - Progress tracked
 * - Deadlines met
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

        it('should have visibility set to all', () => {
            const def = agent.getDefinition();
            expect(def.visibility).toBe('all');
        });
    });

    describe('generateReport Action', () => {
        it('should generate a status report successfully', async () => {
            const result = await agent.execute({
                action: 'generateReport',
                reportType: 'weekly-status',
            });

            expect(result.success).toBe(true);
            expect(result.reportType).toBe('weekly-status');
            expect(result.summary).toBeDefined();
            expect(result.generatedAt).toBeDefined();
        });

        it('should include summary metrics in report', async () => {
            const result = await agent.execute({
                action: 'generateReport',
            }) as ExecuteResult;

            const summary = result.summary as Record<string, number>;
            expect(summary.totalAgents).toBeGreaterThan(0);
            expect(summary.activeAgents).toBeDefined();
            expect(summary.tasksCompleted).toBeDefined();
        });

        it('should include highlights and next priorities', async () => {
            const result = await agent.execute({
                action: 'generateReport',
            });

            expect(result.highlights).toBeDefined();
            expect(Array.isArray(result.highlights)).toBe(true);
            expect(result.nextPriorities).toBeDefined();
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
            expect(result.workflow).toBeDefined();
            expect(result.agents).toContain('scout');
        });

        it('should define workflow sequence', async () => {
            const result = await agent.execute({
                action: 'coordinateAgents',
            });

            expect(result.sequence).toBeDefined();
            expect(Array.isArray(result.sequence)).toBe(true);
            expect(result.sequence[0]).toHaveProperty('agent');
            expect(result.sequence[0]).toHaveProperty('action');
        });

        it('should provide estimated time', async () => {
            const result = await agent.execute({
                action: 'coordinateAgents',
            });

            expect(result.estimatedTime).toBeDefined();
        });
    });

    describe('trackProgress Action', () => {
        it('should monitor project progress', async () => {
            const result = await agent.execute({
                action: 'trackProgress',
                scope: 'current-sprint',
            });

            expect(result.success).toBe(true);
            expect(result.scope).toBe('current-sprint');
            expect(result.percentComplete).toBeDefined();
        });

        it('should include velocity and task counts', async () => {
            const result = await agent.execute({
                action: 'trackProgress',
            });

            expect(result.velocity).toBeDefined();
            expect(result.completed).toBeDefined();
            expect(result.inProgress).toBeDefined();
            expect(result.planned).toBeDefined();
        });

        it('should calculate percent complete correctly', async () => {
            const result = await agent.execute({
                action: 'trackProgress',
            });

            expect(result.percentComplete).toBeGreaterThanOrEqual(0);
            expect(result.percentComplete).toBeLessThanOrEqual(100);
        });
    });

    describe('identifyBlockers Action', () => {
        it('should identify project blockers', async () => {
            const result = await agent.execute({
                action: 'identifyBlockers',
            });

            expect(result.success).toBe(true);
            expect(result.blockers).toBeDefined();
            expect(Array.isArray(result.blockers)).toBe(true);
        });

        it('should include blocker details', async () => {
            const result = await agent.execute({
                action: 'identifyBlockers',
            }) as ExecuteResult;

            const blockers = result.blockers as Array<Record<string, unknown>>;
            if (blockers.length > 0) {
                const blocker = blockers[0];
                expect(blocker).toHaveProperty('id');
                expect(blocker).toHaveProperty('description');
                expect(blocker).toHaveProperty('impact');
                expect(blocker).toHaveProperty('suggestedResolution');
            }
        });

        it('should count total and critical blockers', async () => {
            const result = await agent.execute({
                action: 'identifyBlockers',
            });

            expect(result.totalBlockers).toBeDefined();
            expect(result.criticalBlockers).toBeDefined();
            expect(typeof result.totalBlockers).toBe('number');
        });
    });

    describe('Error Handling', () => {
        it('should handle unknown actions gracefully', async () => {
            const result = await agent.execute({
                action: 'unknownAction' as any,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Logging', () => {
        it('should have getLogs method available', () => {
            const logs = agent.getLogs();
            expect(Array.isArray(logs)).toBe(true);
        });
    });
});
