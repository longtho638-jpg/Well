import { renderHook, act, waitFor } from '@testing-library/react';
import { usePolicyEngine } from './usePolicyEngine';
import { policyService } from '@/services/policyService';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

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

  it('should initialize with default simulation values', async () => {
    (policyService.fetchPolicy as Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePolicyEngine());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Default simPartners is 1000
    // Strategic Candidates = 1000 * 1.5% = 15
    expect(result.current.simulation.strategicCandidates).toBe(15);
  });

  it('should calculate projected SaaS revenue correctly', async () => {
    (policyService.fetchPolicy as Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Default White Label GMV is 1,000,000,000 (1 billion)
    // Strategic Candidates = 15
    // Projected Revenue = 15 * 1,000,000,000 * 0.20 = 3,000,000,000 (3 billion)

    expect(result.current.simulation.projectedSaaSRevenue).toBe(3000000000);
  });

  it('should update calculations when simulation inputs change', async () => {
    (policyService.fetchPolicy as Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change simPartners to 2000
    act(() => {
      result.current.simulation.setSimPartners(2000);
    });

    // Strategic Candidates = 2000 * 1.5% = 30
    expect(result.current.simulation.strategicCandidates).toBe(30);

    // Projected Revenue = 30 * 1,000,000,000 * 0.20 = 6,000,000,000
    expect(result.current.simulation.projectedSaaSRevenue).toBe(6000000000);
  });

  it('should update calculations when white label GMV rule changes', async () => {
    (policyService.fetchPolicy as Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change White Label GMV to 2 billion
    act(() => {
        result.current.rules.setWhiteLabelGMV(2000000000);
    });

    // Strategic Candidates = 15 (still 1000 partners)
    // Projected Revenue = 15 * 2,000,000,000 * 0.20 = 6,000,000,000
    expect(result.current.simulation.projectedSaaSRevenue).toBe(6000000000);
  });
});
