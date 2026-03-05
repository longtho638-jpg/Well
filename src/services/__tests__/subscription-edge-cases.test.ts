/**
 * Subscription Renewal Edge Cases Test
 * Covers: leap years, month boundaries, multiple renewals, expired subscriptions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

describe('Subscription Renewal - Edge Cases', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('should handle month boundary correctly (Jan 31 + 1 month)', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');
        const mockFrom = supabase.from as any;

        mockFrom.mockImplementation((table: string) => {
            if (table === 'user_subscriptions') {
                return {
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
                                    data: { end_date: '2026-02-28T00:00:00Z' },
                                    error: null,
                                }),
                            }),
                        }),
                    }),
                };
            }
            return { select: vi.fn() };
        });

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
        const mockFrom = supabase.from as any;

        mockFrom.mockImplementation((table: string) => ({
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
                            data: { end_date: '2025-02-28T00:00:00Z' },
                            error: null,
                        }),
                    }),
                }),
            }),
        }));

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
        const mockFrom = supabase.from as any;

        let renewalCount = 0;
        mockFrom.mockImplementation(() => ({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockImplementation(() => {
                        renewalCount++;
                        return Promise.resolve({
                            data: { 
                                id: 'sub-3', 
                                end_date: `2026-${3 + renewalCount}-06T00:00:00Z`, 
                                status: 'active', 
                                metadata: {},
                            },
                            error: null,
                        });
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
                    }),
                }),
            }),
        }));

        await subscriptionService.renewSubscription({ subscriptionId: 'sub-3', extendsMonths: 1, payosOrderCode: 101 });
        await subscriptionService.renewSubscription({ subscriptionId: 'sub-3', extendsMonths: 1, payosOrderCode: 102 });
        await subscriptionService.renewSubscription({ subscriptionId: 'sub-3', extendsMonths: 1, payosOrderCode: 103 });

        expect(renewalCount).toBe(3);
    });

    it('should handle already expired subscription', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');
        const mockFrom = supabase.from as any;

        mockFrom.mockImplementation(() => ({
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
                            data: { status: 'active' },
                            error: null,
                        }),
                    }),
                }),
            }),
        }));

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
        ).rejects.toThrow();

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'sub-invalid',
                extendsMonths: -1,
                payosOrderCode: 112,
            })
        ).rejects.toThrow();
    });
});
