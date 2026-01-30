import { describe, it, expect, beforeEach, vi } from 'vitest';
import { agentRegistry } from '@/agents';
import { commandRateLimiter } from '@/lib/rate-limiter';
import analytics from '@/lib/analytics';
import type { AgentKPI } from '@/types/agentic';

interface SearchResult {
  success: boolean;
  suggestion: string[];
}

interface ExecuteResult {
  success: boolean;
  [key: string]: unknown;
}

/**
 * Integration tests simulating real user workflows
 */
describe('User Flow Integration Tests', () => {
    beforeEach(() => {
        // Reset state between tests
        commandRateLimiter.resetAll();
        vi.clearAllMocks();
    });

    describe('Single User Journey', () => {
        it('should complete full command execution workflow', async () => {
            const userId = 'user_001';
            const agent = agentRegistry.get('AgencyOS');

            // 1. User searches for marketing commands
            const searchResults = await agent!.execute({
                action: 'searchCommands',
                command: 'marketing',
            }) as SearchResult;

            expect(searchResults.success).toBe(true);
            expect(searchResults.suggestion.length).toBeGreaterThan(0);

            // 2. User gets help for a specific command
            const helpResult = await agent!.execute({
                action: 'getCommandHelp',
                command: '/marketing-plan',
            });

            expect(helpResult).not.toBeNull();
            expect(helpResult.command).toBe('/marketing-plan');

            // 3. User executes the command
            const execResult = await agent!.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
                context: { budget: 50000 },
            });

            expect(execResult.success).toBe(true);
            expect(execResult.output).toBeDefined();

            // 4. Verify command history
            const history = agent!.getCommandHistory();
            expect(history.length).toBe(1);
            expect(history[0].command).toBe('/marketing-plan');
        });

        it('should handle error recovery gracefully', async () => {
            const agent = agentRegistry.get('AgencyOS');

            // 1. User tries invalid command
            const invalidResult = await agent!.execute({
                action: 'executeCommand',
                command: '/nonexistent-command',
            });

            expect(invalidResult.success).toBe(false);
            expect(invalidResult.error).toContain('Unknown command');

            // 2. User gets suggestion and tries valid command
            const validResult = await agent!.execute({
                action: 'executeCommand',
                command: '/proposal',
            });

            expect(validResult.success).toBe(true);
        });
    });

    describe('Multi-User Scenarios', () => {
        it('should handle multiple users executing commands concurrently', async () => {
            const agent = agentRegistry.get('AgencyOS');
            const users = ['user_001', 'user_002', 'user_003'];

            // Simulate 3 users executing commands simultaneously
            const results = await Promise.all(
                users.map(userId =>
                    agent!.execute({
                        action: 'executeCommand',
                        command: '/marketing-plan',
                        context: { userId },
                    })
                )
            );

            // All should succeed
            results.forEach((result: ExecuteResult) => {
                expect(result.success).toBe(true);
            });

            // Command history should have all executions
            const history = agent!.getCommandHistory();
            expect(history.length).toBeGreaterThanOrEqual(3); // At least 3 from this test
        });

        it('should enforce rate limits independently per user', async () => {
            const user1 = 'user_001';
            const user2 = 'user_002';

            // User 1 hits rate limit (10 commands)
            for (let i = 0; i < 10; i++) {
                expect(commandRateLimiter.isAllowed(user1)).toBe(true);
            }
            expect(commandRateLimiter.isAllowed(user1)).toBe(false);

            // User 2 should still be able to execute
            expect(commandRateLimiter.isAllowed(user2)).toBe(true);
            expect(commandRateLimiter.getRemaining(user2)).toBe(9);
        });
    });

    describe('Rate Limiting User Flow', () => {
        it('should guide user through rate limit scenario', async () => {
            const userId = 'power_user';
            const agent = agentRegistry.get('AgencyOS');

            // Power user  executes many commands quickly
            const commands = [
                '/marketing-plan',
                '/content-calendar',
                '/social-post',
                '/proposal',
                '/pitch-deck',
                '/invoice',
                '/runway-calc',
                '/sop-gen',
                '/workflow',
                '/binh-phap',
            ];

            // Execute first 10 commands (at limit)
            for (const cmd of commands) {
                if (commandRateLimiter.isAllowed(userId, cmd)) {
                    const result = await agent!.execute({
                        action: 'executeCommand',
                        command: cmd,
                    });
                    expect(result.success).toBe(true);
                }
            }

            // 11th command should be rate limited
            expect(commandRateLimiter.isAllowed(userId, '/swot')).toBe(false);

            // Check remaining and reset time
            expect(commandRateLimiter.getRemaining(userId)).toBe(0);
            expect(commandRateLimiter.getResetTime(userId)).toBeGreaterThan(0);
        });
    });

    describe('Analytics Integration', () => {
        it('should track complete user session', async () => {
            const agent = agentRegistry.get('AgencyOS');

            // User session: 2 successful commands, 1 error
            const result1 = await agent!.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
            });
            expect(result1.success).toBe(true);

            const result2 = await agent!.execute({
                action: 'executeCommand',
                command: '/proposal',
            });
            expect(result2.success).toBe(true);

            const result3 = await agent!.execute({
                action: 'executeCommand',
                command: '/invalid-command',
            });
            expect(result3.success).toBe(false);

            // Verify history tracked all attempts
            const history = agent!.getCommandHistory();
            expect(history.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('New User Onboarding Flow', () => {
        it('should guide new user through first command', async () => {
            const newUser = 'new_user_001';
            const agent = agentRegistry.get('AgencyOS');

            // 1. New user lists all available commands
            const allCommands = await agent!.execute({
                action: 'listCommands',
            });

            expect(allCommands.total).toBe(30); // 6 categories × 5 commands
            expect(Object.keys(allCommands.categories)).toHaveLength(6);

            // 2. User explores a category
            const marketingCommands = await agent!.execute({
                action: 'listCommands',
                category: 'marketing',
            });

            expect(marketingCommands.total).toBe(5);

            // 3. User executes first command
            const firstCommand = await agent!.execute({
                action: 'executeCommand',
                command: '/marketing-plan',
            });

            expect(firstCommand.success).toBe(true);

            // 4. Verify KPIs updated
            const kpis = agent!.getKPIs();
            const commandsExecuted = kpis.find((k: AgentKPI) => k.name === 'Commands Executed');
            expect(commandsExecuted?.current).toBeGreaterThan(0);
        });
    });

    describe('Power User Workflow', () => {
        it('should handle rapid sequential command execution', async () => {
            const powerUser = 'power_user_001';
            const agent = agentRegistry.get('AgencyOS');
            const startTime = Date.now();

            // Execute commands from different categories
            const commands = [
                '/marketing-plan',
                '/proposal',
                '/invoice',
                '/sop-gen',
                '/binh-phap',
            ];

            const results = [];
            for (const cmd of commands) {
                if (commandRateLimiter.isAllowed(powerUser, cmd)) {
                    const result = await agent!.execute({
                        action: 'executeCommand',
                        command: cmd,
                    });
                    results.push(result);
                }
            }

            const executionTime = Date.now() - startTime;

            // All commands should succeed
            expect(results.every(r => r.success)).toBe(true);

            // Should be fast (< 1 second for 5 commands)
            expect(executionTime).toBeLessThan(1000);

            // History should track all
            const history = agent!.getCommandHistory();
            expect(history.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('Complete Session Lifecycle', () => {
        it('should simulate full user session from start to finish', async () => {
            const sessionUser = 'session_user_001';
            const agent = agentRegistry.get('AgencyOS');

            // Session start: List commands
            await agent!.execute({ action: 'listCommands' });

            // Search for specific feature
            const searchResults = await agent!.execute({
                action: 'searchCommands',
                command: 'proposal',
            }) as SearchResult;
            expect(searchResults.success).toBe(true);
            expect(searchResults.suggestion.length).toBeGreaterThan(0);

            // Get help
            await agent!.execute({
                action: 'getCommandHelp',
                command: '/proposal',
            });

            // Execute multiple commands
            const commands = ['/proposal', '/invoice', '/marketing-plan'];
            for (const cmd of commands) {
                if (commandRateLimiter.isAllowed(sessionUser, cmd)) {
                    await agent!.execute({
                        action: 'executeCommand',
                        command: cmd,
                    });
                }
            }

            // Verify session state
            const history = agent!.getCommandHistory();
            expect(history.length).toBeGreaterThanOrEqual(3);

            const kpis = agent!.getKPIs();
            const executed = kpis.find((k: AgentKPI) => k.name === 'Commands Executed')?.current || 0;
            expect(executed).toBeGreaterThanOrEqual(3);
        });
    });
});
