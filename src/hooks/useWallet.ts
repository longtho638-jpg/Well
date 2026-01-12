import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { walletAPI } from '../services/api';
import { Transaction } from '../types';
import { walletLogger } from '../utils/logger';

interface WalletData {
  balance: number;
  totalEarnings: number;
  pendingPayout: number;
  taxWithheldTotal: number;
}

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
 * Custom hook for wallet operations
 * Provides real-time wallet data and transaction management
 */
export function useWallet(userId: string | null): WalletState & WalletActions {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to wallet changes
    const unsubscribe = onSnapshot(
      doc(db, 'wallets', userId),
      (doc) => {
        if (doc.exists()) {
          setWallet(doc.data() as WalletData);
        } else {
          setWallet(null);
        }
        setLoading(false);
      },
      (err) => {
        walletLogger.error('Subscription error', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Load transactions
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      return;
    }

    loadTransactions();
  }, [userId]);

  /**
   * Load user transactions
   */
  const loadTransactions = async () => {
    if (!userId) return;

    try {
      const txs = await walletAPI.getTransactions(userId);
      setTransactions(txs);
    } catch (e) {
      const err = e as Error;
      walletLogger.error('Loading transactions failed', err);
      setError(err.message || 'Failed to load transactions');
    }
  };

  /**
   * Refresh transactions
   */
  const refreshTransactions = async (): Promise<void> => {
    await loadTransactions();
  };

  /**
   * Request payout
   */
  const requestPayout = async (amount: number): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!wallet) {
      throw new Error('Wallet not loaded');
    }

    if (amount > wallet.balance) {
      throw new Error('Insufficient balance');
    }

    if (amount <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      setLoading(true);
      setError(null);

      // Call Firebase function to process payout
      // In a real app, you would import and use the Firebase Functions SDK
      // For now, we'll create a local transaction
      // const functions = getFunctions();
      // const requestPayoutFn = httpsCallable(functions, 'requestPayout');
      // await requestPayoutFn({ amount });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh transactions to show new payout request
      await refreshTransactions();
    } catch (e) {
      const err = e as Error;
      walletLogger.error('Payout request failed', err);
      setError(err.message || 'Failed to request payout');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    wallet,
    transactions,
    loading,
    error,
    refreshTransactions,
    requestPayout,
  };
}
