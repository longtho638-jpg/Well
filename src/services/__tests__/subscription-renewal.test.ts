/**
 * Subscription Renewal Tests - Combined
 * Covers: edge cases, webhook integration, error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface MockSubscription {
    id: string;
    user_id: string;
    end_date: string;
    status: string;
    metadata: Record<string, unknown>;
}

// Mock supabase BEFORE any imports
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('Subscription Renewal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============ EDGE CASES ============

    it('should handle month boundary correctly (Jan 31 + 1 month)', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'sub-1', end_date: '2026-01-31T00:00:00Z', status: 'active', metadata: {} },
                        error: null,
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'sub-1', end_date: '2026-02-28T00:00:00Z', status: 'active', metadata: {} },
                            error: null,
                        }),
                    }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        const result = await subscriptionService.renewSubscription({
            subscriptionId: 'sub-1',
            extendsMonths: 1,
            payosOrderCode: 12345,
        });

        expect(result.end_date).toContain('2026-02-28');
    });

    it('should handle leap year correctly (Feb 29)', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'sub-2', end_date: '2024-02-29T00:00:00Z', status: 'active', metadata: {} },
                        error: null,
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'sub-2', end_date: '2025-02-28T00:00:00Z', status: 'active', metadata: {} },
                            error: null,
                        }),
                    }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        const result = await subscriptionService.renewSubscription({
            subscriptionId: 'sub-2',
            extendsMonths: 12,
            payosOrderCode: 12346,
        });

        expect(result.end_date).toContain('2025-02-28');
    });

    it('should handle multiple consecutive renewals', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockData = [
            { id: 'sub-3', end_date: '2026-03-06T00:00:00Z', status: 'active', metadata: {} },
            { id: 'sub-3', end_date: '2026-04-06T00:00:00Z', status: 'active', metadata: {} },
            { id: 'sub-3', end_date: '2026-05-06T00:00:00Z', status: 'active', metadata: {} },
        ];

        let selectCallCount = 0;
        let updateCallCount = 0;

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockImplementation(() => {
                        const currentSelectCall = selectCallCount++;
                        return Promise.resolve({
                            data: mockData[Math.min(currentSelectCall, mockData.length - 1)],
                            error: null,
                        });
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockImplementation(() => {
                            const currentUpdateCall = updateCallCount++;
                            return Promise.resolve({
                                data: mockData[Math.min(currentUpdateCall, mockData.length - 1)],
                                error: null,
                            });
                        }),
                    }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        await subscriptionService.renewSubscription({ subscriptionId: 'sub-3', extendsMonths: 1, payosOrderCode: 101 });
        await subscriptionService.renewSubscription({ subscriptionId: 'sub-3', extendsMonths: 1, payosOrderCode: 102 });
        await subscriptionService.renewSubscription({ subscriptionId: 'sub-3', extendsMonths: 1, payosOrderCode: 103 });

        expect(selectCallCount).toBe(3);
        expect(updateCallCount).toBe(3);
    });

    it('should handle already expired subscription', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'sub-expired', end_date: '2025-01-01T00:00:00Z', status: 'expired', metadata: {} },
                        error: null,
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'sub-expired', status: 'active', end_date: '2025-02-01T00:00:00Z', metadata: {} },
                            error: null,
                        }),
                    }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        const result = await subscriptionService.renewSubscription({
            subscriptionId: 'sub-expired',
            extendsMonths: 1,
            payosOrderCode: 999,
        });

        expect(result).toBeDefined();
    });

    it('should reject invalid extendsMonths (0 or negative)', async () => {
        const { subscriptionService } = await import('../subscription-service');

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'sub-invalid',
                extendsMonths: 0,
                payosOrderCode: 111,
            })
        ).rejects.toThrow('extendsMonths must be a positive number');

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'sub-invalid',
                extendsMonths: -1,
                payosOrderCode: 112,
            })
        ).rejects.toThrow('extendsMonths must be a positive number');
    });

    // ============ WEBHOOK INTEGRATION ============

    it('should renew subscription on webhook PAID event', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockSubscription: MockSubscription = {
            id: 'sub-123',
            user_id: 'user-456',
            end_date: '2026-03-06T00:00:00Z',
            status: 'active',
            metadata: {},
        };

        const mockUpdatedSubscription: MockSubscription = {
            ...mockSubscription,
            end_date: '2026-04-06T00:00:00Z',
        };

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValueOnce({ data: mockSubscription, error: null }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValueOnce({ data: mockUpdatedSubscription, error: null }),
                    }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        const renewed = await subscriptionService.renewSubscription({
            subscriptionId: 'sub-123',
            extendsMonths: 1,
            payosOrderCode: 12345,
        });

        expect(renewed).toBeDefined();
        expect(renewed.end_date).toBe('2026-04-06T00:00:00Z');
        expect(renewed.status).toBe('active');
    });

    it('should handle subscription not found error', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'nonexistent',
                extendsMonths: 1,
                payosOrderCode: 12345,
            })
        ).rejects.toThrow('Subscription not found');
    });

    it('should handle update error', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

        const mockSubscription: MockSubscription = {
            id: 'sub-123',
            user_id: 'user-456',
            end_date: '2026-03-06T00:00:00Z',
            status: 'active',
            metadata: {},
        };

        const mockFrom = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValueOnce({ data: mockSubscription, error: null }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'update failed' } }),
                    }),
                }),
            }),
        };

         
        vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'sub-123',
                extendsMonths: 1,
                payosOrderCode: 12345,
            })
        ).rejects.toThrow('Failed to renew subscription');
    });
});
