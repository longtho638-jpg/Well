import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePolicyEngine } from './usePolicyEngine';
import { policyService } from '@/services/policyService';

// Mock policyService
vi.mock('@/services/policyService', () => ({
    policyService: {
        fetchPolicy: vi.fn(),
        savePolicy: vi.fn(),
    },
}));

// Mock adminLogger to avoid console spam
vi.mock('@/utils/logger', () => ({
    adminLogger: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('usePolicyEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load policy configuration on mount', async () => {
        const mockPolicy = {
            commissions: { retailComm: 30, agencyBonus: 15, elitePool: 5 },
            rules: { activationThreshold: 5000000, whiteLabelGMV: 2000000000, whiteLabelPartners: 100 },
            beeAgentPolicy: { ctvCommission: 20, startupCommission: 25, sponsorBonus: 10, rankUpThreshold: 10000000 },
            rankUpgrades: [],
        };

        (policyService.fetchPolicy as any).mockResolvedValue(mockPolicy);

        const { result } = renderHook(() => usePolicyEngine());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.commissions.retailComm).toBe(30);
        expect(result.current.rules.whiteLabelGMV).toBe(2000000000);
    });

    it('should calculate simulation metrics including strategic forecasts', async () => {
        // Ensure fetchPolicy returns null to use default state values
        (policyService.fetchPolicy as any).mockResolvedValue(null);

        const { result } = renderHook(() => usePolicyEngine());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Default values: simPartners = 1000, simAOV = 1500000
        // simGMV = 1000 * 1500000 = 1,500,000,000
        expect(result.current.simulation.simGMV).toBe(1500000000);

        // Check for strategic metrics
        const simulation = result.current.simulation;

        // Strategic Candidates = 1.5% of Partners (1000) = 15
        expect(simulation.strategicCandidates).toBe(15);

        // Projected SaaS Revenue = Strategic Candidates (15) * WhiteLabelGMV (default 1,000,000,000) * 20%
        // = 15 * 1,000,000,000 * 0.20 = 3,000,000,000
        expect(simulation.projectedSaaSRevenue).toBe(3000000000);
    });
});
