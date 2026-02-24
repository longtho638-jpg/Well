import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from './useWallet';
import { walletService, WalletData } from '../services/walletService';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

vi.mock('../services/walletService', () => ({
  walletService: {
    getTransactions: vi.fn(),
    subscribeToWallet: vi.fn().mockReturnValue(() => {}),
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
    const { result } = renderHook(() => useWallet('user-1'));
    expect(result.current.loading).toBe(true);
  });

  it('should load transactions and subscribe to wallet updates', async () => {
    (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
    (walletService.subscribeToWallet as Mock).mockImplementation((uid: string, onData: (data: WalletData) => void) => {
      onData(mockWallet);
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useWallet('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.wallet).toEqual(mockWallet);
    expect(walletService.getTransactions).toHaveBeenCalledWith('user-1');
    expect(walletService.subscribeToWallet).toHaveBeenCalledWith('user-1', expect.any(Function), expect.any(Function));
  });

  it('should handle errors when loading transactions', async () => {
    (walletService.getTransactions as Mock).mockRejectedValue(new Error('Fetch failed'));
    (walletService.subscribeToWallet as Mock).mockReturnValue(vi.fn());

    const { result } = renderHook(() => useWallet('user-1'));

    await waitFor(() => {
      expect(result.current.error).toBe('Fetch failed');
    });
  });

  it('should request payout successfully', async () => {
    (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
    (walletService.subscribeToWallet as Mock).mockImplementation((uid: string, onData: (data: WalletData) => void) => {
      onData(mockWallet); // balance 1000
      return vi.fn();
    });
    (walletService.requestPayout as Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useWallet('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.requestPayout(500);
    });

    expect(walletService.requestPayout).toHaveBeenCalledWith('user-1', 500);
    expect(walletService.getTransactions).toHaveBeenCalledTimes(2); // Initial + Refresh
  });

  it('should fail payout if invalid amount or insufficient balance', async () => {
    (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
    (walletService.subscribeToWallet as Mock).mockImplementation((uid: string, onData: (data: WalletData) => void) => {
      onData({ ...mockWallet, balance: 100 });
      return vi.fn();
    });

    const { result } = renderHook(() => useWallet('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.requestPayout(0)).rejects.toThrow('Invalid payout requested');
    await expect(result.current.requestPayout(200)).rejects.toThrow('Insufficient node Liquidity');
  });
});
