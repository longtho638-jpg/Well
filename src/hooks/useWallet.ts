import { useState, useEffect, useCallback, useMemo } from 'react';
import { walletService, WalletData } from '../services/walletService';
import { Transaction } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('useWalletHook');

interface WalletState {
  wallet: WalletData | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

interface WalletActions {
  refreshTransactions: () => Promise<void>;
  requestPayout: (amount: number) => Promise<void>;
}

/**
 * useWallet - Central Orchestrator for Financial Telemetry
 * Deployed to stabilize ledger interactions and real-time balance synchronization.
 */
export function useWallet(userId: string | null): WalletState & WalletActions {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async (uid: string) => {
    try {
      const txs = await walletService.getTransactions(uid);
      setTransactions(txs);
    } catch (e) {
      const err = e as Error;
      logger.error('Loading transactions failed', err);
      setError(err.message || 'Failed to sync ledger');
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    if (userId) {
      setLoading(true);
      await loadTransactions(userId);
      setLoading(false);
    }
  }, [userId, loadTransactions]);

  // Financial Orchestration: Sync & Subscribe
  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let txsDone = false;
    let walletDone = false;
    let cancelled = false;

    const checkLoading = () => {
      if (txsDone && walletDone && !cancelled) {
        setLoading(false);
      }
    };

    loadTransactions(userId).finally(() => {
      txsDone = true;
      checkLoading();
    });

    // Initial wallet fetch — subscription alone never fires on first load
    walletService.getWallet(userId).then((data) => {
      if (!cancelled) {
        setWallet(data);
        walletDone = true;
        checkLoading();
      }
    }).catch((err: Error) => {
      if (!cancelled) {
        logger.error('Initial wallet fetch failed', err);
        setError(err.message);
        walletDone = true;
        checkLoading();
      }
    });

    // Real-time telemetry subscription for subsequent updates
    const unsubscribe = walletService.subscribeToWallet(
      userId,
      (data) => {
        if (!cancelled) setWallet(data);
      },
      (err) => {
        if (!cancelled) {
          logger.error('Financial heartbeat failed', err);
          setError(err.message);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId, loadTransactions]);

  const requestPayout = useCallback(async (amount: number) => {
    if (!userId || !wallet) throw new Error('Financial node not provisioned');
    if (amount <= 0) throw new Error('Invalid payout requested');
    if (amount > wallet.balance) throw new Error('Insufficient node Liquidity');

    try {
      setLoading(true);
      await walletService.requestPayout(userId, amount);
      await refreshTransactions();
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'Payout operation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, wallet, refreshTransactions]);

  const derivedState = useMemo(() => ({
    wallet,
    transactions,
    loading,
    error,
    refreshTransactions,
    requestPayout
  }), [wallet, transactions, loading, error, refreshTransactions, requestPayout]);

  return derivedState;
}
