import { describe, it, expect, beforeEach } from 'vitest';
import { AgencyOSAgent } from '../AgencyOSAgent';
import { AGENCYOS_COMMANDS } from '../commandDefinitions';

describe('AgencyOSAgent', () => {
    let agent: AgencyOSAgent;

    beforeEach(() => {
        agent = new AgencyOSAgent();
    });

    describe('initialization', () => {
        it('should initialize with correct definition', () => {
            const definition = agent.getDefinition();

            expect(definition.agent_name).toBe('AgencyOS');
            expect(definition.business_function).toBe('Operations & Logistics');
            expect(definition.core_actions).toContain('executeCommand');
            expect(definition.core_actions).toContain('listCommands');
            expect(definition.core_actions).toContain('searchCommands');
        });

        it('should have correct KPIs', () => {
            const kpis = agent.getKPIs();

            expect(kpis).toHaveLength(3);
            expect(kpis.find(k => k.name === 'Commands Executed')).toBeDefined();
            expect(kpis.find(k => k.name === 'Success Rate')).toBeDefined();
        });
    });

    describe('execute - listCommands', () => {
        it('should list all commands', async () => {
            const result = await agent.execute({ action: 'listCommands' }) as { total: number; categories: Record<string, unknown> };

            expect(result.total).toBeGreaterThan(0);
            expect(result.categories).toHaveProperty('marketing');
            expect(result.categories).toHaveProperty('sales');
            expect(result.categories).toHaveProperty('finance');
        });

        it('should filter by category', async () => {
            const result = await agent.execute({
                action: 'listCommands',
                category: 'marketing',
            }) as { total: number; categories: Record<string, unknown[]> };

            expect(result.total).toBe(5); // 5 marketing commands
            expect(Object.keys(result.categories)).toHaveLength(1);
            expect(result.categories.marketing).toBeDefined();
        });
    });

    describe('execute - searchCommands', () => {
        it('should search commands by query', async () => {
            const result = await agent.execute({
                action: 'searchCommands',
                command: 'marketing',
            }) as { success: boolean; suggestion: { command: string }[] };

            expect(result.success).toBe(true);
            expect(Array.isArray(result.suggestion)).toBe(true);
            expect(result.suggestion.length).toBeGreaterThan(0);
            expect(result.suggestion.some((cmd) => cmd.command.includes('marketing'))).toBe(true);
        });

        it('should return empty array for no matches', async () => {
            const result = await agent.execute({
                action: 'searchCommands',
                command: 'nonexistent-xyz-123',
            }) as { success: boolean; suggestion: unknown[] };

            expect(result.success).toBe(true);
            expect(Array.isArray(result.suggestion)).toBe(true);
            expect(result.suggestion.length).toBe(0);
        });
    });

    describe('execute - getCommandHelp', () => {
        it('should get help for valid command', async () => {
            const result = await agent.execute({
                action: 'getCommandHelp',
                command: '/marketing-plan',
            }) as { success: boolean; command: string; description: string; category: string };

            expect(result.success).toBe(true);
            expect(result.command).toBe('/marketing-plan');
            expect(result.description).toBeDefined();
            expect(result.category).toBe('marketing');
        });

        it('should throw error for invalid command', async () => {
            const result = await agent.execute({
                action: 'getCommandHelp',
                command: '/invalid-command',
            }) as { success: boolean; error: string };

            expect(result.success).toBe(false);
            expect(result.error).toContain('Command not found');
        });
    });

    describe('execute - executeCommand', () => {
        it('should execute valid command successfully', async () => {
            const result = await agent.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
            }) as { success: boolean; command: string; message: string; output: string };

            expect(result.success).toBe(true);
            expect(result.command).toBe('/marketing-plan');
            expect(result.message).toContain('executed successfully');
            expect(result.output).toBeDefined();
        });

        it('should handle invalid commands', async () => {
            const result = await agent.execute({
                action: 'executeCommand',
                command: '/invalid-command',
            }) as { success: boolean; error: string };

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown command');
        });

        it('should track command execution in KPIs', async () => {
            const kpisBefore = agent.getKPIs();
            const commandsExecutedBefore = kpisBefore.find(k => k.name === 'Commands Executed')?.current || 0;

            await agent.execute({
                action: 'executeCommand',
                command: '/proposal',
            });

            const kpisAfter = agent.getKPIs();
            const commandsExecutedAfter = kpisAfter.find(k => k.name === 'Commands Executed')?.current || 0;

            expect(commandsExecutedAfter).toBe(commandsExecutedBefore + 1);
        });
    });

    describe('command history', () => {
        it('should track command execution history', async () => {
            await agent.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
            });

            await agent.execute({
                action: 'executeCommand',
                command: '/proposal',
            });

            const history = agent.getCommandHistory();

            expect(history.length).toBe(2);
            expect(history[0].command).toBe('/marketing-plan'); // First command first
            expect(history[1].command).toBe('/proposal'); // Second command second
        });
    });

    describe('error handling', () => {
        it('should handle unknown actions', async () => {
            const result = await agent.execute({
                action: 'unknownAction' as 'executeCommand', // Cast to valid string literal to bypass TS
            }) as { error: string };

            expect(result.error).toContain('Unknown action');
        });

        it('should log errors', async () => {
            await agent.execute({
                action: 'executeCommand',
                command: '/invalid',
            });

            const logs = agent.getLogs();
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].action).toBe('executeCommand');
        });
    });
});

describe('AGENCYOS_COMMANDS', () => {
    it('should have all 6 categories', () => {
        expect(Object.keys(AGENCYOS_COMMANDS)).toHaveLength(6);
        expect(AGENCYOS_COMMANDS).toHaveProperty('marketing');
        expect(AGENCYOS_COMMANDS).toHaveProperty('sales');
        expect(AGENCYOS_COMMANDS).toHaveProperty('finance');
        expect(AGENCYOS_COMMANDS).toHaveProperty('operations');
        expect(AGENCYOS_COMMANDS).toHaveProperty('strategy');
        expect(AGENCYOS_COMMANDS).toHaveProperty('agents');
    });

    it('should have correct number of commands per category', () => {
        expect(AGENCYOS_COMMANDS.marketing.length).toBe(5);
        expect(AGENCYOS_COMMANDS.sales.length).toBe(5);
        expect(AGENCYOS_COMMANDS.finance.length).toBe(5);
        expect(AGENCYOS_COMMANDS.operations.length).toBe(5);
        expect(AGENCYOS_COMMANDS.strategy.length).toBe(5);
        expect(AGENCYOS_COMMANDS.agents.length).toBe(5);
    });

    it('should have correct command format', () => {
        AGENCYOS_COMMANDS.marketing.forEach(cmd => {
            expect(cmd.command).toMatch(/^\//); // Starts with /
            expect(cmd.description).toBeDefined();
            expect(cmd.description.length).toBeGreaterThan(0);
        });
    });
});
