import { renderHook, act } from '@testing-library/react';
import { usePolicyEngine } from './usePolicyEngine';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { policyService } from '@/services/policyService';

// Mock policyService
vi.mock('@/services/policyService', () => ({
    policyService: {
        fetchPolicy: vi.fn(),
        savePolicy: vi.fn(),
    },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
    adminLogger: {
        error: vi.fn(),
    },
}));

describe('usePolicyEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', async () => {
        (policyService.fetchPolicy as any).mockResolvedValue(null);

        const { result } = renderHook(() => usePolicyEngine());

        // Wait for async effect - fetch happens on mount
        // We need to wait for state updates
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.commissions.retailComm).toBe(25);
    });

    it('should calculate simulation metrics correctly', async () => {
        (policyService.fetchPolicy as any).mockResolvedValue(null);
        const { result } = renderHook(() => usePolicyEngine());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const sim = result.current.simulation;

        // GMV = 1000 * 1,500,000 = 1,500,000,000
        expect(sim.simGMV).toBe(1500000000);

        // Payout = 1.5B * 38% = 570,000,000 (25+10+3 = 38%)
        expect(sim.simTotalPayout).toBe(570000000);

        // Profit = 1.5B - 570M - 500M = 430,000,000
        expect(sim.simProfit).toBe(430000000);

        // Strategic Candidates = floor(1000 * 0.015) = 15
        expect(sim.strategicCandidates).toBe(15);

        // Projected SaaS Revenue = 15 * 1,000,000,000 (whiteLabelGMV default) * 0.20 = 3,000,000,000
        expect(sim.projectedSaaSRevenue).toBe(3000000000);
    });

    it('should handle save correctly', async () => {
        (policyService.fetchPolicy as any).mockResolvedValue(null);
        (policyService.savePolicy as any).mockResolvedValue(true);

        const { result } = renderHook(() => usePolicyEngine());

        await act(async () => {
            const success = await result.current.handleSave();
            expect(success).toBe(true);
        });

        expect(policyService.savePolicy).toHaveBeenCalled();
        expect(result.current.lastSaved).not.toBeNull();
    });
});
