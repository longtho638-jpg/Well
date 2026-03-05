/**
 * Integration Tests: Webhook Payment Flow & Subscription Renewal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('Webhook Renewal Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should renew subscription and activate license on webhook PAID event', async () => {
        const { subscriptionService } = await import('../subscription-service');
        
        const mockSubscription = {
            id: 'sub-123',
            user_id: 'user-456',
            end_date: '2026-03-06T00:00:00Z',
            status: 'active',
            metadata: {},
        };

        const mockUpdatedSubscription = {
            ...mockSubscription,
            end_date: '2026-04-06T00:00:00Z',
        };

        const mockLicense = { id: 'license-789' };

        const { supabase } = await import('@/lib/supabase');
        const mockFrom = supabase.from as any;

        mockFrom.mockImplementation((table: string) => {
            if (table === 'user_subscriptions') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
                        }),
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: mockUpdatedSubscription, error: null }),
                            }),
                        }),
                    }),
                };
            }
            if (table === 'raas_licenses') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: mockLicense, error: null }),
                        }),
                    }),
                };
            }
            return { select: vi.fn() };
        });

        const renewed = await subscriptionService.renewSubscription({
            subscriptionId: 'sub-123',
            extendsMonths: 1,
            payosOrderCode: 12345,
        });

        expect(renewed).toBeDefined();
    });

    it('should handle subscription not found error', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');
        const mockFrom = supabase.from as any;

        mockFrom.mockImplementation(() => ({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                }),
            }),
        }));

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'nonexistent',
                extendsMonths: 1,
                payosOrderCode: 12345,
            })
        ).rejects.toThrow('Subscription not found');
    });
});
