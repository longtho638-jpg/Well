import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePolicyEngine } from './usePolicyEngine';
import { policyService } from '@/services/policyService';

// Define simulation interface to avoid 'any'
interface SimulationState {
  simPartners: number;
  strategicCandidates: number;
  projectedSaaSRevenue: number;
  setSimPartners: (count: number) => void;
}

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
    vi.mocked(policyService.fetchPolicy).mockResolvedValue({});
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => usePolicyEngine());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect((result.current.simulation as unknown as SimulationState).simPartners).toBe(1000);
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

    const sim = result.current.simulation as unknown as SimulationState;

    expect(sim.strategicCandidates).toBe(15);
    expect(sim.projectedSaaSRevenue).toBe(3000000000);
  });

  it('should update metrics when simPartners changes', async () => {
    const { result } = renderHook(() => usePolicyEngine());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      // Cast to ensure type safety during test interaction
      (result.current.simulation as unknown as SimulationState).setSimPartners(2000);
    });

    const sim = result.current.simulation as unknown as SimulationState;

    // simPartners = 2000
    // strategicCandidates = 2000 * 0.015 = 30
    // projectedSaaSRevenue = 30 * 1,000,000,000 * 0.20 = 6,000,000,000
    expect(sim.strategicCandidates).toBe(30);
    expect(sim.projectedSaaSRevenue).toBe(6000000000);
  });
});
