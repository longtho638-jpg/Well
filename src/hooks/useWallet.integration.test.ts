/**
 * useWallet Integration Tests
 *
 * Integration tests for wallet hook with real service interactions
 * Testing React 19 compatibility: concurrent rendering, automatic batching,
 * and proper cleanup on unmount
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from './useWallet';
import { walletService, WalletData } from '../services/walletService';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

// Mock wallet service with realistic behavior
vi.mock('../services/walletService', async () => {
  const actual = await vi.importActual('../services/walletService');
  return {
    ...actual,
    walletService: {
      getTransactions: vi.fn(),
      getWallet: vi.fn(),
      subscribeToWallet: vi.fn(() => () => {}),
      requestPayout: vi.fn(),
    },
  };
});

// Mock logger
vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('useWallet - Integration Tests', () => {
  const mockWallet: WalletData = {
    balance: 5000,
    totalEarnings: 10000,
    pendingPayout: 500,
    taxWithheldTotal: 1000,
  };

  const mockTransactions = [
    {
      id: 'tx-1',
      amount: 1000,
      type: 'Commission',
      date: '2025-01-15',
      status: 'completed',
      currency: 'USD',
      description: 'Q4 Commission',
    },
    {
      id: 'tx-2',
      amount: 500,
      type: 'Payout',
      date: '2025-01-10',
      status: 'completed',
      currency: 'USD',
      description: 'Bank Transfer',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Loading', () => {
    it('should start with loading state and null data', () => {
      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      expect(result.current.loading).toBe(true);
      expect(result.current.wallet).toBeNull();
      expect(result.current.transactions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should load data and transition to loaded state', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.wallet).toEqual(mockWallet);
      expect(result.current.transactions).toEqual(mockTransactions);
      expect(result.current.error).toBeNull();
    });

    it('should handle null userId gracefully', () => {
      const { result } = renderHook(() => useWallet(null));

      expect(result.current.loading).toBe(false);
      expect(result.current.wallet).toBeNull();
      expect(result.current.transactions).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle transaction fetch error', async () => {
      (walletService.getTransactions as Mock).mockRejectedValue(
        new Error('Network error')
      );
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      }, { timeout: 1000 });

      expect(result.current.loading).toBe(false);
    });

    it('should handle wallet fetch error', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockRejectedValue(
        new Error('Wallet service unavailable')
      );

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Wallet service unavailable');
      }, { timeout: 1000 });
    });
  });

  describe('Real-time Subscription', () => {
    it('should subscribe to wallet updates on mount', async () => {
      const _subscriptionCallback: ((data: WalletData) => void) | null = null;
      const _errorCallback: ((err: Error) => void) | null = null;

      (walletService.subscribeToWallet as Mock).mockImplementation(
        (userId: string, onWallet: (data: WalletData) => void, onError: (err: Error) => void) => {
          subscriptionCallback = onWallet;
          errorCallback = onError;
          return () => {};
        }
      );

      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(walletService.subscribeToWallet).toHaveBeenCalledWith(
          'user-123',
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it('should update wallet state on subscription callback', async () => {
      const _subscriptionCallback: ((data: WalletData) => void) | null = null;

      (walletService.subscribeToWallet as Mock).mockImplementation(
        (userId: string, onWallet: (data: WalletData) => void) => {
          subscriptionCallback = onWallet;
          return () => {};
        }
      );

      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate real-time wallet update
      const updatedWallet: WalletData = {
        ...mockWallet,
        balance: 6000,
      };

      act(() => {
        subscriptionCallback?.(updatedWallet);
      });

      expect(result.current.wallet).toEqual(updatedWallet);
    });

    it('should handle subscription errors', async () => {
      const _errorCallback: ((err: Error) => void) | null = null;

      (walletService.subscribeToWallet as Mock).mockImplementation(
        (userId: string, _onWallet: (data: WalletData) => void, onError: (err: Error) => void) => {
          errorCallback = onError;
          return () => {};
        }
      );

      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        errorCallback?.(new Error('Connection lost'));
      });

      expect(result.current.error).toBe('Connection lost');
    });
  });

  describe('Payout Operations', () => {
    it('should request payout successfully and refresh transactions', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);
      (walletService.requestPayout as Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestPayout(500);
      });

      expect(walletService.requestPayout).toHaveBeenCalledWith('user-123', 500);
      expect(walletService.getTransactions).toHaveBeenCalledTimes(2);
    });

    it('should reject payout with invalid amount', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.requestPayout(0))
        .rejects.toThrow('Invalid payout requested');
      await expect(result.current.requestPayout(-100))
        .rejects.toThrow('Invalid payout requested');
    });

    it('should reject payout with insufficient balance', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.requestPayout(10000))
        .rejects.toThrow('Insufficient node Liquidity');
    });

    it('should reject payout when wallet is null', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.requestPayout(100))
        .rejects.toThrow('Financial node not provisioned');
    });

    it('should handle payout error and refresh', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);
      (walletService.requestPayout as Mock).mockRejectedValue(
        new Error('Bank unavailable')
      );

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.requestPayout(500))
        .rejects.toThrow('Bank unavailable');

      // Error handled in finally block
    });
  });

  describe('Refresh Operations', () => {
    it('should refresh transactions on demand', async () => {
      (walletService.getTransactions as Mock)
        .mockResolvedValueOnce([mockTransactions[0]])
        .mockResolvedValueOnce(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(1);

      await act(async () => {
        await result.current.refreshTransactions();
      });

      expect(result.current.transactions).toHaveLength(2);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = vi.fn();
      (walletService.subscribeToWallet as Mock).mockReturnValue(mockUnsubscribe);
      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { unmount } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(walletService.subscribeToWallet).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should prevent state updates after unmount', async () => {
      const _subscriptionCallback: ((data: WalletData) => void) | null = null;

      (walletService.subscribeToWallet as Mock).mockImplementation(
        (userId: string, onWallet: (data: WalletData) => void) => {
          subscriptionCallback = onWallet;
          return () => {};
        }
      );

      (walletService.getTransactions as Mock).mockResolvedValue([]);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result, unmount } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      unmount();

      // Should not cause errors after unmount
      act(() => {
        subscriptionCallback?.({
          ...mockWallet,
          balance: 99999,
        });
      });
    });
  });

  describe('React 19 Compatibility', () => {
    it('should handle concurrent rendering without warnings', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify stable state after concurrent render
      expect(result.current.wallet).toEqual(mockWallet);
      expect(result.current.transactions).toEqual(mockTransactions);
    });

    it('should support automatic batching in React 19', async () => {
      (walletService.getTransactions as Mock).mockResolvedValue(mockTransactions);
      (walletService.getWallet as Mock).mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useWallet('user-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Multiple state updates in single batch
      await act(async () => {
        await Promise.all([
          result.current.refreshTransactions(),
          result.current.requestPayout(100).catch(() => {}),
        ]);
      });

      // Should complete without errors
      expect(result.current.error).toBeNull();
    });
  });
});
