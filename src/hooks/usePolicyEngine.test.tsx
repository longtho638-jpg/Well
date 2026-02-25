import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePolicyEngine } from './usePolicyEngine';
import { policyService } from '@/services/policyService';
import { adminLogger } from '@/utils/logger';

// Mock dependencies
vi.mock('@/services/policyService', () => ({
  policyService: {
    fetchPolicy: vi.fn(),
    savePolicy: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  adminLogger: {
    error: vi.fn(),
  },
}));

describe('usePolicyEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (policyService.fetchPolicy as any).mockResolvedValue({});
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.simulation.simPartners).toBe(1000);
    expect(result.current.rules.whiteLabelGMV).toBe(1000000000);
  });

  it('should calculate strategic metrics correctly', async () => {
    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check default calculation
    // simPartners = 1000
    // strategicCandidates = 1000 * 0.015 = 15
    // whiteLabelGMV = 1,000,000,000
    // projectedSaaSRevenue = 15 * 1,000,000,000 * 0.20 = 3,000,000,000

    const sim = result.current.simulation as any;

    // These assertions are expected to fail before implementation
    expect(sim.strategicCandidates).toBe(15);
    expect(sim.projectedSaaSRevenue).toBe(3000000000);
  });

  it('should update metrics when simPartners changes', async () => {
    const { result } = renderHook(() => usePolicyEngine());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.simulation.setSimPartners(2000);
    });

    const sim = result.current.simulation as any;

    // simPartners = 2000
    // strategicCandidates = 2000 * 0.015 = 30
    // projectedSaaSRevenue = 30 * 1,000,000,000 * 0.20 = 6,000,000,000
    expect(sim.strategicCandidates).toBe(30);
    expect(sim.projectedSaaSRevenue).toBe(6000000000);
  });
});
