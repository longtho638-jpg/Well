import { describe, it, expect, beforeEach } from 'vitest';
import { agentRegistry } from '@/agents';
import { AgencyOSAgent } from '@/agents/custom/AgencyOSAgent';
import type { AgentDefinition, AgentKPI } from '@/types/agentic';

interface SearchResult {
  success: boolean;
  suggestion: string[];
}

/**
 * Admin-focused integration tests
 * Testing agent management, monitoring, and dashboard workflows
 */
describe('Admin Logic Integration Tests', () => {
    beforeEach(() => {
        // Ensure clean state
    });

    describe('Agent Registry Management', () => {
        it('should list all registered agents', () => {
            const allAgents = agentRegistry.listAll();

            // Should have at least 4 core agents + AgencyOS
            expect(allAgents.length).toBeGreaterThanOrEqual(5);

            // Verify core agents present
            const agentNames = allAgents.map((a: AgentDefinition) => a.agent_name);
            expect(agentNames).toContain('AgencyOS');
            expect(agentNames).toContain('Gemini Coach'); // Note: has space
            expect(agentNames).toContain('Sales Copilot'); // Note: has space
            expect(agentNames).toContain('The Bee'); // Note: has space
        });

        it('should retrieve specific agent by name', () => {
            const agencyOSAgent = agentRegistry.get('AgencyOS');

            expect(agencyOSAgent).toBeDefined();
            expect(agencyOSAgent?.getDefinition().agent_name).toBe('AgencyOS');
        });

        it('should filter agents by business function', () => {
            const allAgents = agentRegistry.listAll();

            // Filter manually (getByFunction doesn't exist)
            const opsAgents = allAgents.filter(
                (a: AgentDefinition) => a.business_function === 'Operations & Logistics'
            );

            expect(opsAgents.length).toBeGreaterThan(0);
            expect(opsAgents.some((a: AgentDefinition) => a.agent_name === 'AgencyOS')).toBe(true);
        });

        it('should handle agent registration workflow', () => {
            const initialCount = agentRegistry.listAll().length;

            // Create and register a test agent
            const testAgent = new AgencyOSAgent();
            agentRegistry.register(testAgent);

            // Count should remain same (AgencyOS already registered)
            const afterCount = agentRegistry.listAll().length;
            expect(afterCount).toBe(initialCount);
        });
    });

    describe('Agent Status Monitoring', () => {
        it('should retrieve KPIs from all agents', () => {
            const allAgents = agentRegistry.listAll();

            const agentKPIs = allAgents.map((agentDef: AgentDefinition) => {
                const agent = agentRegistry.get(agentDef.agent_name);
                return {
                    name: agentDef.agent_name,
                    kpis: agent?.getKPIs() || [],
                };
            });

            // All agents should have KPIs
            expect(agentKPIs.length).toBeGreaterThan(0);

            // AgencyOS should have 3 KPIs
            const agencyOSKPIs = agentKPIs.find((a: { name: string; kpis: AgentKPI[] }) => a.name === 'AgencyOS');
            expect(agencyOSKPIs?.kpis.length).toBe(3);
        });

        it('should track agent execution logs', async () => {
            const agent = agentRegistry.get('AgencyOS');

            // Execute a command
            await agent!.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
            });

            // Check logs
            const logs = agent!.getLogs();
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[logs.length - 1].action).toBe('executeCommand');
        });

        it('should monitor agent health status', () => {
            const allAgents = agentRegistry.listAll();

            // All agents should be accessible
            allAgents.forEach((agentDef: AgentDefinition) => {
                const agent = agentRegistry.get(agentDef.agent_name);
                expect(agent).toBeDefined();
                expect(agent?.getDefinition()).toBeDefined();
            });
        });
    });

    describe('Command Analytics Dashboard', () => {
        it('should aggregate command execution statistics', async () => {
            const agent = agentRegistry.get('AgencyOS');

            // Execute multiple commands
            const commands = ['/marketing-plan', '/proposal', '/invoice'];
            for (const cmd of commands) {
                await agent!.execute({
                    action: 'executeCommand',
                    command: cmd,
                });
            }

            // Get aggregated stats
            const kpis = agent!.getKPIs();
            const commandsExecuted = kpis.find((k: AgentKPI) => k.name === 'Commands Executed');

            expect(commandsExecuted?.current).toBeGreaterThanOrEqual(3);
        });

        it('should calculate success rate metrics', async () => {
            const agent = agentRegistry.get('AgencyOS');

            // Execute mix of valid and invalid commands
            await agent!.execute({ action: 'executeCommand', command: '/proposal' });
            await agent!.execute({ action: 'executeCommand', command: '/invalid' });
            await agent!.execute({ action: 'executeCommand', command: '/invoice' });

            const kpis = agent!.getKPIs();
            const successRate = kpis.find((k: AgentKPI) => k.name === 'Success Rate');

            expect(successRate).toBeDefined();
            expect(successRate?.current).toBeGreaterThan(0);
            expect(successRate?.current).toBeLessThanOrEqual(100);
        });

        it('should provide command history for audit trail', async () => {
            const agent = agentRegistry.get('AgencyOS');

            // Execute commands
            await agent!.execute({ action: 'executeCommand', command: '/marketing-plan' });
            await agent!.execute({ action: 'executeCommand', command: '/proposal' });

            // Get history (admin view)
            const history = agent!.getCommandHistory();

            expect(history.length).toBeGreaterThanOrEqual(2);
            expect(history[0]).toHaveProperty('command');
            expect(history[0]).toHaveProperty('timestamp');
            expect(history[0]).toHaveProperty('result');
        });
    });

    describe('System Health Monitoring', () => {
        it('should verify all core agents are available', () => {
            const coreAgents = ['AgencyOS', 'Gemini Coach', 'Sales Copilot', 'The Bee'];

            coreAgents.forEach(name => {
                const agent = agentRegistry.get(name);
                expect(agent).toBeDefined();
            });
        });

        it('should report system-wide statistics', () => {
            const allAgents = agentRegistry.listAll();

            const systemStats = {
                totalAgents: allAgents.length,
                agentsByFunction: {} as Record<string, number>,
                totalKPIs: 0,
            };

            allAgents.forEach(agentDef => {
                const func = agentDef.business_function;
                systemStats.agentsByFunction[func] = (systemStats.agentsByFunction[func] || 0) + 1;

                const agent = agentRegistry.get(agentDef.agent_name);
                systemStats.totalKPIs += agent?.getKPIs().length || 0;
            });

            expect(systemStats.totalAgents).toBeGreaterThanOrEqual(5);
            expect(systemStats.totalKPIs).toBeGreaterThan(0);
            expect(Object.keys(systemStats.agentsByFunction).length).toBeGreaterThan(0);
        });

        it('should validate agent registry integrity', () => {
            const allAgents = agentRegistry.listAll();

            // Check for duplicates
            const agentNames = allAgents.map((a: AgentDefinition) => a.agent_name);
            const uniqueNames = new Set(agentNames);

            expect(agentNames.length).toBe(uniqueNames.size);

            // Each agent should have required fields
            allAgents.forEach((agentDef: AgentDefinition) => {
                expect(agentDef.agent_name).toBeDefined();
                expect(agentDef.business_function).toBeDefined();
                expect(agentDef.core_actions).toBeDefined();
                expect(agentDef.success_kpis).toBeDefined();
            });
        });
    });

    describe('Admin Operations Workflow', () => {
        it('should complete full admin monitoring cycle', async () => {
            // 1. List all agents
            const agents = agentRegistry.listAll();
            expect(agents.length).toBeGreaterThan(0);

            // 2. Get specific agent
            const agencyOS = agentRegistry.get('AgencyOS');
            expect(agencyOS).toBeDefined();

            // 3. Check KPIs
            const kpis = agencyOS!.getKPIs();
            expect(kpis.length).toBe(3);

            // 4. Execute test command
            await agencyOS!.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
            });

            // 5. Verify logs updated
            const logs = agencyOS!.getLogs();
            expect(logs.length).toBeGreaterThan(0);

            // 6. Check updated KPIs
            const updatedKPIs = agencyOS!.getKPIs();
            const commandsExecuted = updatedKPIs.find((k: AgentKPI) => k.name === 'Commands Executed');
            expect(commandsExecuted?.current).toBeGreaterThan(0);
        });

        it('should handle multi-agent dashboard view', () => {
            const dashboardData = agentRegistry.listAll().map((agentDef: AgentDefinition) => {
                const agent = agentRegistry.get(agentDef.agent_name);
                return {
                    name: agentDef.agent_name,
                    function: agentDef.business_function,
                    kpis: agent?.getKPIs() || [],
                    logs: agent?.getLogs().length || 0,
                };
            });

            // Should have data for all agents
            expect(dashboardData.length).toBeGreaterThanOrEqual(5);

            // Each should have KPIs
            dashboardData.forEach((data: { name: string; function: string; kpis: AgentKPI[]; logs: number }) => {
                expect(data.kpis).toBeDefined();
            });
        });
    });

    describe('Command Catalog Administration', () => {
        it('should list all available commands across system', async () => {
            const agent = agentRegistry.get('AgencyOS');

            const commandList = await agent!.execute({
                action: 'listCommands',
            });

            expect(commandList.total).toBe(30); // 6 categories × 5 commands
            expect(Object.keys(commandList.categories)).toHaveLength(6);
        });

        it('should search commands for admin review', async () => {
            const agent = agentRegistry.get('AgencyOS');

            const searchResults = await agent!.execute({
                action: 'searchCommands',
                command: 'plan',
            }) as SearchResult;

            expect(searchResults.success).toBe(true);
            expect(Array.isArray(searchResults.suggestion)).toBe(true);
            expect(searchResults.suggestion.length).toBeGreaterThan(0);
        });

        it('should retrieve command documentation for help desk', async () => {
            const agent = agentRegistry.get('AgencyOS');

            const helpInfo = await agent!.execute({
                action: 'getCommandHelp',
                command: '/marketing-plan',
            });

            expect(helpInfo).not.toBeNull();
            expect(helpInfo).toHaveProperty('command');
            expect(helpInfo).toHaveProperty('description');
            expect(helpInfo).toHaveProperty('category');
        });
    });
});
