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
        it('should generate event_id if not provided', () => {
            const event = (emitter as any).createEvent({
                event_type: 'feature_used',
                feature: 'test_feature',
                success: true,
            });

            expect(event.event_id).toBeDefined();
            expect(event.event_id).toMatch(/^evt_[a-zA-Z0-9]+$/);
        });

        it('should set timestamp to current ISO string', () => {
            const before = Date.now();
            const event = (emitter as any).createEvent({
                event_type: 'feature_used',
                feature: 'test_feature',
                success: true,
            });
            const after = Date.now();

            const eventTime = new Date(event.timestamp).getTime();
            expect(eventTime).toBeGreaterThanOrEqual(before);
            expect(eventTime).toBeLessThanOrEqual(after);
        });

        it('should include mk_api_key in metadata if provided', () => {
            const event = (emitter as any).createEvent(
                {
                    event_type: 'feature_used',
                    feature: 'test_feature',
                    success: true,
                },
                {
                    mkApiKey: 'mk_test_key_123',
                }
            );

            expect(event.metadata?.mk_api_key).toBe('mk_test_key_123');
        });

        it('should include jwt_session in metadata if provided', () => {
            const event = (emitter as any).createEvent(
                {
                    event_type: 'feature_used',
                    feature: 'test_feature',
                    success: true,
                },
                {
                    jwtSession: 'jwt_session_abc',
                }
            );

            expect(event.metadata?.jwt_session).toBe('jwt_session_abc');
        });
    });

    describe('Event Batching', () => {
        it('should batch events within 5 second window', async () => {
            vi.spyOn(emitter as any, 'flushEvents').mockResolvedValue(undefined);

            // Emit first event
            await emitter.emit('feature_used', {
                feature: 'feature_1',
                success: true,
            });

            // Flush should not have been called yet (within 5s window)
            expect((emitter as any).flushEvents).not.toHaveBeenCalled();

            // Wait for batch window
            vi.advanceTimersByTime(5100);

            // Flush should have been called
            expect((emitter as any).flushEvents).toHaveBeenCalled();
        });

        it('should flush immediately when batch reaches max size (20 events)', async () => {
            vi.spyOn(emitter as any, 'flushEvents').mockResolvedValue(undefined);

            // Emit 20 events rapidly
            for (let i = 0; i < 20; i++) {
                await emitter.emit('feature_used', {
                    feature: `feature_${i}`,
                    success: true,
                });
            }

            // Should have flushed immediately
            expect((emitter as any).flushEvents).toHaveBeenCalled();
        });

        it('should clear batch after flush', async () => {
            vi.spyOn(emitter as any, 'flushEvents').mockResolvedValue(undefined);

            // Add events to batch
            await emitter.emit('feature_used', { feature: 'f1', success: true });
            await emitter.emit('feature_used', { feature: 'f2', success: true });

            expect((emitter as any).eventBatch.length).toBe(2);

            // Manually flush
            await (emitter as any).flushEvents();

            // Batch should be empty
            expect((emitter as any).eventBatch.length).toBe(0);
        });
    });

    describe('Rate Limiting', () => {
        it('should allow events within rate limit (100 events/min)', async () => {
            vi.spyOn(emitter as any, 'flushEvents').mockResolvedValue(undefined);

            // Emit 50 events (within limit)
            for (let i = 0; i < 50; i++) {
                const allowed = await emitter.emit('feature_used', {
                    feature: `feature_${i}`,
                    success: true,
                });
                expect(allowed).toBe(true);
            }
        });

        it('should reject events exceeding rate limit', async () => {
            vi.spyOn(emitter as any, 'flushEvents').mockResolvedValue(undefined);

            // Set rate limiter state to exceed limit
            (emitter as any).rateLimiter = {
                tokens: 0,
                lastUpdate: Date.now(),
            };

            // This should fail due to rate limit
            const allowed = await emitter.emit('feature_used', {
                feature: 'over_limit',
                success: true,
            });

            expect(allowed).toBe(false);
        });

        it('should refill tokens over time', async () => {
            (emitter as any).rateLimiter = {
                tokens: 0,
                lastUpdate: Date.now() - 60000, // 1 minute ago
            };

            // Tokens should have refilled
            const currentTokens = (emitter as any).getAvailableTokens();
            expect(currentTokens).toBeGreaterThan(0);
        });
    });

    describe('Emit Methods', () => {
        describe('emitFeatureUsed', () => {
            it('should emit feature_used event with correct structure', async () => {
                vi.spyOn(emitter, 'emit').mockResolvedValue(true);

                await emitter.emitFeatureUsed({
                    orgId: 'org_123',
                    feature: 'agent_chat',
                    success: true,
                    executionTimeMs: 150,
                });

                expect(emitter.emit).toHaveBeenCalledWith('feature_used', expect.objectContaining({
                    feature: 'agent_chat',
                    success: true,
                    execution_time_ms: 150,
                }));
            });

            it('should handle feature_used error events', async () => {
                vi.spyOn(emitter, 'emit').mockResolvedValue(true);

                await emitter.emitFeatureUsed({
                    orgId: 'org_123',
                    feature: 'agent_chat',
                    success: false,
                    errorMessage: 'Connection timeout',
                });

                expect(emitter.emit).toHaveBeenCalledWith('feature_used', expect.objectContaining({
                    success: false,
                    error_message: 'Connection timeout',
                }));
            });
        });

        describe('emitQuotaCheck', () => {
            it('should emit quota_check event with correct structure', async () => {
                vi.spyOn(emitter, 'emit').mockResolvedValue(true);

                await emitter.emitQuotaCheck({
                    orgId: 'org_123',
                    metricType: 'tokens',
                    currentUsage: 8000,
                    quotaLimit: 10000,
                    tier: 'pro',
                });

                expect(emitter.emit).toHaveBeenCalledWith('quota_check', expect.objectContaining({
                    metric_type: 'tokens',
                    current_usage: 8000,
                    quota_limit: 10000,
                    usage_percentage: 80,
                    exceeded: false,
                }));
            });

            it('should calculate correct usage percentage', async () => {
                vi.spyOn(emitter, 'emit').mockResolvedValue(true);

                await emitter.emitQuotaCheck({
                    orgId: 'org_123',
                    metricType: 'api_calls',
                    currentUsage: 15000,
                    quotaLimit: 10000,
                    tier: 'enterprise',
                });

                expect(emitter.emit).toHaveBeenCalledWith('quota_check', expect.objectContaining({
                    usage_percentage: 150,
                    exceeded: true,
                }));
            });
        });

        describe('emitAccessDenied', () => {
            it('should emit access_denied event with correct structure', async () => {
                vi.spyOn(emitter, 'emit').mockResolvedValue(true);

                await emitter.emitAccessDenied({
                    orgId: 'org_123',
                    reason: 'license_expired',
                    feature: 'premium_analytics',
                });

                expect(emitter.emit).toHaveBeenCalledWith('access_denied', expect.objectContaining({
                    reason: 'license_expired',
                }));
            });
        });

        describe('emitQuotaWarning', () => {
            it('should emit quota_warning event with correct structure', async () => {
                vi.spyOn(emitter, 'emit').mockResolvedValue(true);

                await emitter.emitQuotaWarning({
                    orgId: 'org_123',
                    warningType: 'approaching_limit',
                    quotaPercentage: 92,
                });

                expect(emitter.emit).toHaveBeenCalledWith('quota_warning', expect.objectContaining({
                    warning_type: 'approaching_limit',
                    quota_percentage: 92,
                }));
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

describe('Event Metadata Enrichment', () => {
    it('should enrich event with org context', () => {
        const event = (raasEventEmitter as any).createEvent(
            {
                event_type: 'feature_used',
                feature: 'test',
                success: true,
            },
            {
                orgId: 'org_123',
            }
        );

        expect(event.org_id).toBe('org_123');
    });

    it('should enrich event with IP address', () => {
        const event = (raasEventEmitter as any).createEvent(
            {
                event_type: 'feature_used',
                feature: 'test',
                success: true,
            },
            {
                ipAddress: '192.168.1.1',
            }
        );

        expect(event.ip_address).toBe('192.168.1.1');
    });

    it('should enrich event with request ID', () => {
        const event = (raasEventEmitter as any).createEvent(
            {
                event_type: 'feature_used',
                feature: 'test',
                success: true,
            },
            {
                requestId: 'req_abc123',
            }
        );

        expect(event.request_id).toBe('req_abc123');
    });
});
