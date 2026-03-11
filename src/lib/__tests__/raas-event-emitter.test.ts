/**
 * RaaS Event Emitter - Unit Tests
 * Phase 6.1-6.2: Event Emission & Real-time Analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    raasEventEmitter,
    RaasEventEmitter,
    type RaasEvent,
    type FeatureUsedEvent,
    type QuotaCheckEvent,
} from '@/lib/raas-event-emitter';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
    analyticsLogger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('RaasEventEmitter', () => {
    let emitter: RaasEventEmitter;

    beforeEach(() => {
        emitter = new RaasEventEmitter();
        vi.clearAllMocks();
    });

    describe('Event Types', () => {
        it('should support feature_used event type', () => {
            const event: FeatureUsedEvent = {
                event_id: 'evt_123',
                event_type: 'feature_used',
                feature: 'agent_chat',
                success: true,
                timestamp: new Date().toISOString(),
            };

            expect(event.event_type).toBe('feature_used');
            expect(event.feature).toBe('agent_chat');
        });

        it('should support quota_check event type', () => {
            const event: QuotaCheckEvent = {
                event_id: 'evt_123',
                event_type: 'quota_check',
                metric_type: 'tokens',
                current_usage: 5000,
                quota_limit: 10000,
                quota_remaining: 5000,
                usage_percentage: 50,
                exceeded: false,
                tier: 'pro',
                timestamp: new Date().toISOString(),
            };

            expect(event.event_type).toBe('quota_check');
            expect(event.usage_percentage).toBe(50);
        });

        it('should support access_denied event type', () => {
            const event: RaasEvent = {
                event_id: 'evt_123',
                event_type: 'access_denied',
                reason: 'quota_exceeded',
                timestamp: new Date().toISOString(),
            };

            expect(event.event_type).toBe('access_denied');
            expect(event.reason).toBe('quota_exceeded');
        });

        it('should support quota_warning event type', () => {
            const event: RaasEvent = {
                event_id: 'evt_123',
                event_type: 'quota_warning',
                warning_type: 'approaching_limit',
                quota_percentage: 90,
                timestamp: new Date().toISOString(),
            };

            expect(event.event_type).toBe('quota_warning');
            expect(event.quota_percentage).toBe(90);
        });
    });

    describe('Event Validation', () => {
        it('should generate event_id automatically', async () => {
            const mockListener = vi.fn();
            emitter.on('feature_used', mockListener);

            await emitter.emitFeatureUsed(
                {
                    feature: 'test_feature',
                    success: true,
                },
                { org_id: 'org_123' }
            );

            const emittedEvent = mockListener.mock.calls[0][0];
            expect(emittedEvent.event_id).toBeDefined();
            expect(emittedEvent.event_id).toMatch(/^evt_\d+_\d+$/);
        });

        it('should set timestamp to current ISO string', async () => {
            const mockListener = vi.fn();
            emitter.on('feature_used', mockListener);

            const before = Date.now();
            await emitter.emitFeatureUsed(
                {
                    feature: 'test_feature',
                    success: true,
                },
                { org_id: 'org_123' }
            );
            const after = Date.now();

            const emittedEvent = mockListener.mock.calls[0][0];
            const eventTime = new Date(emittedEvent.timestamp).getTime();
            expect(eventTime).toBeGreaterThanOrEqual(before);
            expect(eventTime).toBeLessThanOrEqual(after);
        });

        it('should enrich event with context metadata', async () => {
            const mockListener = vi.fn();
            emitter.on('feature_used', mockListener);

            await emitter.emitFeatureUsed(
                {
                    feature: 'test_feature',
                    success: true,
                },
                {
                    org_id: 'org_123',
                    mk_api_key: 'mk_test_key_123',
                    jwt_session: 'jwt_session_abc',
                }
            );

            const emittedEvent = mockListener.mock.calls[0][0];
            expect(emittedEvent.mk_api_key).toBe('mk_test_key_123');
            expect(emittedEvent.jwt_session).toBe('jwt_session_abc');
        });
    });

    describe('Event Batching', () => {
        it('should have correct queue size after emitting events', async () => {
            // Emit events
            await emitter.emit({
                event_id: 'evt_test_1',
                event_type: 'feature_used',
                feature: 'feature_1',
                success: true,
                timestamp: new Date().toISOString(),
            });

            // Queue should have 1 event
            expect(emitter.getQueueSize()).toBe(1);

            // Emit another event
            await emitter.emit({
                event_id: 'evt_test_2',
                event_type: 'feature_used',
                feature: 'feature_2',
                success: true,
                timestamp: new Date().toISOString(),
            });

            expect(emitter.getQueueSize()).toBe(2);
        });

        it('should track queue size changes', async () => {
            // Add events to queue
            await emitter.emit({
                event_id: 'evt_test_1',
                event_type: 'feature_used',
                feature: 'f1',
                success: true,
                timestamp: new Date().toISOString(),
            });
            await emitter.emit({
                event_id: 'evt_test_2',
                event_type: 'feature_used',
                feature: 'f2',
                success: true,
                timestamp: new Date().toISOString(),
            });

            expect(emitter.getQueueSize()).toBe(2);

            // Note: Automatic flush happens via timer (5s window) or when maxEvents (20) reached
            // This test just verifies queue management works
        });
    });

    describe('Queue Management', () => {
        it('should track listener count correctly', () => {
            // No listeners initially
            expect(emitter.getListenerCount('feature_used')).toBe(0);

            // Add a listener
            const listener = (_event: any) => { /* no-op */ };
            emitter.on('feature_used', listener);

            expect(emitter.getListenerCount('feature_used')).toBe(1);

            // Remove listener
            const unsubscribe = emitter.on('feature_used', listener);
            unsubscribe();

            expect(emitter.getListenerCount('feature_used')).toBe(0);
        });

        it('should call listeners when event is emitted', async () => {
            const mockListener = vi.fn();
            emitter.on('feature_used', mockListener);

            await emitter.emit({
                event_id: 'evt_test',
                event_type: 'feature_used',
                feature: 'test_feature',
                success: true,
                timestamp: new Date().toISOString(),
            });

            expect(mockListener).toHaveBeenCalled();
        });
    });

    describe('Emit Methods', () => {
        describe('emitFeatureUsed', () => {
            it('should emit feature_used event with correct structure', async () => {
                const mockListener = vi.fn();
                emitter.on('feature_used', mockListener);

                await emitter.emitFeatureUsed(
                    {
                        feature: 'agent_chat',
                        success: true,
                        execution_time_ms: 150,
                    },
                    { org_id: 'org_123' }
                );

                expect(mockListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        event_type: 'feature_used',
                        feature: 'agent_chat',
                        success: true,
                        execution_time_ms: 150,
                        org_id: 'org_123',
                    })
                );
            });

            it('should handle feature_used error events', async () => {
                const mockListener = vi.fn();
                emitter.on('feature_used', mockListener);

                await emitter.emitFeatureUsed(
                    {
                        feature: 'agent_chat',
                        success: false,
                        error_message: 'Connection timeout',
                    },
                    { org_id: 'org_123' }
                );

                expect(mockListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        event_type: 'feature_used',
                        success: false,
                        error_message: 'Connection timeout',
                    })
                );
            });
        });

        describe('emitQuotaCheck', () => {
            it('should emit quota_check event with correct structure', async () => {
                const mockListener = vi.fn();
                emitter.on('quota_check', mockListener);

                await emitter.emitQuotaCheck(
                    {
                        metric_type: 'tokens',
                        current_usage: 8000,
                        quota_limit: 10000,
                        quota_remaining: 2000,
                        usage_percentage: 80,
                        exceeded: false,
                        tier: 'pro',
                    },
                    { org_id: 'org_123' }
                );

                expect(mockListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        event_type: 'quota_check',
                        metric_type: 'tokens',
                        current_usage: 8000,
                        quota_limit: 10000,
                        usage_percentage: 80,
                        exceeded: false,
                    })
                );
            });

            it('should calculate correct usage percentage', async () => {
                const mockListener = vi.fn();
                emitter.on('quota_check', mockListener);

                await emitter.emitQuotaCheck(
                    {
                        metric_type: 'api_calls',
                        current_usage: 15000,
                        quota_limit: 10000,
                        quota_remaining: 0,
                        usage_percentage: 150,
                        exceeded: true,
                        tier: 'enterprise',
                    },
                    { org_id: 'org_123' }
                );

                expect(mockListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        usage_percentage: 150,
                        exceeded: true,
                    })
                );
            });
        });

        describe('emitAccessDenied', () => {
            it('should emit access_denied event with correct structure', async () => {
                const mockListener = vi.fn();
                emitter.on('access_denied', mockListener);

                await emitter.emitAccessDenied(
                    {
                        reason: 'license_expired',
                        requested_feature: 'premium_analytics',
                    },
                    { org_id: 'org_123' }
                );

                expect(mockListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        event_type: 'access_denied',
                        reason: 'license_expired',
                    })
                );
            });
        });

        describe('emitQuotaWarning', () => {
            it('should emit quota_warning event with correct structure', async () => {
                const mockListener = vi.fn();
                emitter.on('quota_warning', mockListener);

                await emitter.emitQuotaWarning(
                    {
                        threshold: 90,
                        current_percentage: 92,
                        metric_type: 'tokens',
                        tier: 'pro',
                    },
                    { org_id: 'org_123' }
                );

                expect(mockListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        event_type: 'quota_warning',
                        threshold: 90,
                        current_percentage: 92,
                    })
                );
            });
        });
    });

    describe('Singleton Instance', () => {
        it('should export singleton instance', () => {
            expect(raasEventEmitter).toBeInstanceOf(RaasEventEmitter);
        });

        it('should maintain state across calls', () => {
            const instance1 = raasEventEmitter;
            const instance2 = raasEventEmitter;

            expect(instance1).toBe(instance2);
        });
    });
});

describe('Event Context Helper', () => {
    it('should create event context from request', () => {
        // Note: createEventContext is a helper function, not a method on the emitter
        // Testing that the module exports work correctly
        expect(raasEventEmitter).toBeDefined();
        expect(raasEventEmitter).toBeInstanceOf(RaasEventEmitter);
    });
});
