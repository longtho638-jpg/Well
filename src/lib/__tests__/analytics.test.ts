import { describe, it, expect, vi, beforeEach } from 'vitest';
import analytics from '../analytics';

// Mock window.va
const mockVa = vi.fn();

describe('Analytics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('window', { va: mockVa });
    });

    describe('event', () => {
        it('should call window.va in production', () => {
            // Mock production environment
            vi.stubEnv('PROD', true);
            vi.stubEnv('DEV', false);

            analytics.event('test_event', { key: 'value' });

            expect(mockVa).toHaveBeenCalledWith('event', {
                name: 'test_event',
                data: { key: 'value' },
            });
        });

        it('should not call window.va in development', () => {
            vi.stubEnv('PROD', false);
            vi.stubEnv('DEV', true);

            analytics.event('test_event', { key: 'value' });

            expect(mockVa).not.toHaveBeenCalled();
        });
    });

    describe('trackCommand', () => {
        it('should track successful command execution', () => {
            vi.stubEnv('PROD', true);

            analytics.trackCommand('/marketing-plan', true, 250);

            expect(mockVa).toHaveBeenCalledWith('event', {
                name: 'agencyos_command',
                data: {
                    command: '/marketing-plan',
                    success: true,
                    executionTime: 250,
                },
            });
        });

        it('should track failed command execution', () => {
            vi.stubEnv('PROD', true);

            analytics.trackCommand('/invalid-command', false, 100);

            expect(mockVa).toHaveBeenCalledWith('event', {
                name: 'agencyos_command',
                data: {
                    command: '/invalid-command',
                    success: false,
                    executionTime: 100,
                },
            });
        });
    });

    describe('trackAgent', () => {
        it('should track agent interactions', () => {
            vi.stubEnv('PROD', true);

            analytics.trackAgent('AgencyOS', 'executeCommand', {
                command: '/proposal',
            });

            expect(mockVa).toHaveBeenCalledWith('event', {
                name: 'agent_interaction',
                data: {
                    agentName: 'AgencyOS',
                    action: 'executeCommand',
                    command: '/proposal',
                },
            });
        });
    });

    describe('trackError', () => {
        it('should track errors with context', () => {
            vi.stubEnv('PROD', true);

            const error = new Error('Test error');
            analytics.trackError(error, { component: 'CommandPalette' });

            expect(mockVa).toHaveBeenCalledWith('event', {
                name: 'error',
                data: {
                    message: 'Test error',
                    stack: error.stack,
                    component: 'CommandPalette',
                },
            });
        });
    });

    describe('trackPerformance', () => {
        it('should track performance metrics', () => {
            vi.stubEnv('PROD', true);

            analytics.trackPerformance('pageLoad', 1234, 'ms');

            expect(mockVa).toHaveBeenCalledWith('event', {
                name: 'performance',
                data: {
                    metric: 'pageLoad',
                    value: 1234,
                    unit: 'ms',
                },
            });
        });
    });

    describe('pageView', () => {
        it('should track page views', () => {
            vi.stubEnv('PROD', true);

            analytics.pageView('/agencyos-demo');

            expect(mockVa).toHaveBeenCalledWith('pageview', {
                path: '/agencyos-demo',
            });
        });
    });
});
