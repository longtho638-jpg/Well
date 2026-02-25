import { renderHook, waitFor, act } from '@testing-library/react';
import { usePolicyEngine } from './usePolicyEngine';
import { policyService } from '../services/policyService';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

vi.mock('../services/policyService', () => ({
  policyService: {
    fetchPolicy: vi.fn(),
    savePolicy: vi.fn(),
  },
}));

vi.mock('../utils/logger', () => ({
  adminLogger: {
    error: vi.fn(),
  },
}));

describe('usePolicyEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (policyService.fetchPolicy as Mock).mockResolvedValue({});
  });

  it('should calculate strategic forecast metrics correctly', async () => {
    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    // Default values:
    // simPartners = 1000
    // whiteLabelGMV = 1000000000 (1B)

    // strategicCandidates = 1000 * 0.015 = 15
    // projectedSaaSRevenue = 15 * 1000000000 * 0.20 = 3000000000 (3B)

    expect(result.current.simulation.strategicCandidates).toBe(15);
    expect(result.current.simulation.projectedSaaSRevenue).toBe(3000000000);
  });

  it('should update strategic forecast when partners change', async () => {
    const { result } = renderHook(() => usePolicyEngine());
     await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    // Update simPartners to 2000
    act(() => {
        result.current.simulation.setSimPartners(2000);
    });

    // strategicCandidates = 2000 * 0.015 = 30
    // projectedSaaSRevenue = 30 * 1000000000 * 0.20 = 6000000000 (6B)

    expect(result.current.simulation.strategicCandidates).toBe(30);
    expect(result.current.simulation.projectedSaaSRevenue).toBe(6000000000);
  });

    it('should update strategic forecast when whiteLabelGMV changes', async () => {
    const { result } = renderHook(() => usePolicyEngine());
     await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    // Update whiteLabelGMV to 2B
    act(() => {
        result.current.rules.setWhiteLabelGMV(2000000000);
    });

    // simPartners = 1000 (default)
    // strategicCandidates = 15
    // projectedSaaSRevenue = 15 * 2000000000 * 0.20 = 6000000000 (6B)

    expect(result.current.simulation.strategicCandidates).toBe(15);
    expect(result.current.simulation.projectedSaaSRevenue).toBe(6000000000);
  });
});
