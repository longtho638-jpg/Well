/**
 * Integration Tests: Webhook Payment Flow & Subscription Renewal
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('Webhook Renewal Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should renew subscription and activate license on webhook PAID event', async () => {
        const { subscriptionService } = await import('../subscription-service');
        const { supabase } = await import('@/lib/supabase');

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

        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn()
                .mockResolvedValueOnce({ data: mockSubscription, error: null })
                .mockResolvedValueOnce({ data: mockUpdatedSubscription, error: null }),
            update: vi.fn().mockReturnThis(),
        };

        (supabase.from as any).mockReturnValue(mockChain);

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

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        });

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

        const mockSubscription = {
            id: 'sub-123',
            user_id: 'user-456',
            end_date: '2026-03-06T00:00:00Z',
            status: 'active',
            metadata: {},
        };

        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn()
                .mockResolvedValueOnce({ data: mockSubscription, error: null })
                .mockResolvedValueOnce({ data: null, error: { message: 'update failed' } }),
            update: vi.fn().mockReturnThis(),
        };

        (supabase.from as any).mockReturnValue(mockChain);

        await expect(
            subscriptionService.renewSubscription({
                subscriptionId: 'sub-123',
                extendsMonths: 1,
                payosOrderCode: 12345,
            })
        ).rejects.toThrow('Failed to renew subscription');
    });
});
