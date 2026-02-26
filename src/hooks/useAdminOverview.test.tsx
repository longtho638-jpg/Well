import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminOverview } from './useAdminOverview';
import { adminLogger } from '@/utils/logger';

// Mock dependencies
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('@/utils/logger', () => ({
  adminLogger: {
    error: vi.fn(),
  },
}));

describe('useAdminOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementation for select
    mockSelect.mockReset();
    mockEq.mockReset();

    // Default mock implementation
    mockSelect.mockImplementation((query, options) => {
      // Mock chaining for orders query which has .eq()
      if (options && options.count) {
          return {
              eq: mockEq,
              // Return promise-like object directly if no .eq needed
              then: (resolve) => resolve({ count: 10, error: null }),
          }
      }
      return {
          then: (resolve) => resolve({ data: [], error: null }),
      };
    });

    // Mock .eq implementation
    mockEq.mockImplementation(() => Promise.resolve({ count: 5, error: null }));
  });

  it('should log errors when fetchMetrics fails partially', async () => {
    // Setup specific failure for one call
    mockSelect.mockImplementationOnce(() => Promise.resolve({ count: null, error: { message: 'User fetch failed' } }));
    mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockResolvedValue({ count: 5, error: null })
    }));
    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));

    const { result } = renderHook(() => useAdminOverview());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Expect error to be set
    expect(result.current.error).toBeDefined();

    // Expect logger to be called with specific error
    // Note: The current implementation throws only the first error, so maybe it logs only one?
    // We want to verify that *all* errors are logged after our fix.

    // Let's create a test case where MULTIPLE fail.
    mockSelect.mockReset();
    mockSelect.mockImplementationOnce(() => Promise.resolve({ count: null, error: { message: 'User error' } }));
    mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Order error' } })
    }));
    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: null, error: { message: 'Sales error' } }));

    const { result: result2 } = renderHook(() => useAdminOverview());
    await waitFor(() => expect(result2.current.loading).toBe(false));

    // Desired behavior: Log 'User error', 'Order error', 'Sales error' individually.
    expect(adminLogger.error).toHaveBeenCalledWith('Failed to fetch users count', expect.objectContaining({ message: 'User error' }));
    expect(adminLogger.error).toHaveBeenCalledWith('Failed to fetch pending orders', expect.objectContaining({ message: 'Order error' }));
    expect(adminLogger.error).toHaveBeenCalledWith('Failed to fetch total sales', expect.objectContaining({ message: 'Sales error' }));
  });
});
