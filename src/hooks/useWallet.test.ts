import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from './useWallet';
import { walletService, WalletData } from '../services/walletService';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Mock với promises có thể resolve thủ công để control timing
vi.mock('../services/walletService', () => ({
  walletService: {
    getTransactions: vi.fn(),
    getWallet: vi.fn(),
    subscribeToWallet: vi.fn().mockReturnValue(vi.fn()),
    requestPayout: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

describe('useWallet', () => {
  const mockTransactions = [
    { id: '1', amount: 100, type: 'Deposit', date: '2025-01-01', status: 'completed', currency: 'USD' },
  ];
  const mockWallet: WalletData = { balance: 1000, totalEarnings: 0, pendingPayout: 0, taxWithheldTotal: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (walletService.getTransactions as Mock).mockResolvedValue([]);
    (walletService.getWallet as Mock).mockResolvedValue(mockWallet);
    const { result } = renderHook(() => useWallet('user-1'));
    // Hook starts with loading = true
    expect(result.current.loading).toBe(true);
  });

  it('should load transactions and subscribe to wallet updates', async () => {
    // Create promises that we can control timing for
    let resolveTxs: (value: unknown) => void;
    let resolveWallet: (value: unknown) => void;
    const txsPromise = new Promise(resolve => { resolveTxs = resolve; });
    const walletPromise = new Promise(resolve => { resolveWallet = resolve; });

    (walletService.getTransactions as Mock).mockReturnValue(txsPromise);
    (walletService.getWallet as Mock).mockReturnValue(walletPromise);

    const { result } = renderHook(() => useWallet('user-1'));

    // Resolve both promises (simulating parallel completion)
    resolveTxs!(mockTransactions);  // eslint-disable-line @typescript-eslint/no-non-null-assertion
    resolveWallet!(mockWallet);  // eslint-disable-line @typescript-eslint/no-non-null-assertion

    // Wait for loading to become false (both promises resolved)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    // Verify state updated correctly
    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.wallet).toEqual(mockWallet);
    expect(walletService.getTransactions).toHaveBeenCalledWith('user-1');
    expect(walletService.subscribeToWallet).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should handle errors when loading transactions', async () => {
    let resolveWallet: (value: unknown) => void;
    const walletPromise = new Promise(resolve => { resolveWallet = resolve; });

    (walletService.getTransactions as Mock).mockRejectedValue(new Error('Fetch failed'));
    (walletService.getWallet as Mock).mockReturnValue(walletPromise);

    const { result } = renderHook(() => useWallet('user-1'));

    // Resolve wallet to complete loading
    resolveWallet!(mockWallet);  // eslint-disable-line @typescript-eslint/no-non-null-assertion

    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Fetch failed');
    }, { timeout: 1000 });
  });

  it('should request payout successfully', async () => {
    // Initial load
    (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
    (walletService.getWallet as Mock).mockResolvedValue(mockWallet);
    (walletService.requestPayout as Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useWallet('user-1'));

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    // Execute payout
    await act(async () => {
      await result.current.requestPayout(500);
    });

    expect(walletService.requestPayout).toHaveBeenCalledWith('user-1', 500);
    expect(walletService.getTransactions).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should fail payout if invalid amount or insufficient balance', async () => {
    (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
    (walletService.getWallet as Mock).mockResolvedValue({ ...mockWallet, balance: 100 });

    const { result } = renderHook(() => useWallet('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    // Test validation errors
    await expect(result.current.requestPayout(0))
      .rejects.toThrow('Invalid payout requested');
    await expect(result.current.requestPayout(200))
      .rejects.toThrow('Insufficient node Liquidity');
  });
});
