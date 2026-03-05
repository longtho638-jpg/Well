/**
 * useCommissionDashboard Hook
 * Real-time commission data aggregation with PayOS integration
 *
 * Features:
 * - Wallet balance sync from Supabase
 * - Commission breakdown by period (day/week/month)
 * - Direct sales vs team volume calculation
 * - Trend indicators (period-over-period growth)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { walletService } from '../services/walletService';
import { createLogger } from '../utils/logger';
import { calculatePIT } from '../utils/tax';
import type { Transaction } from '../types';

const logger = createLogger('useCommissionDashboard');


interface CommissionPeriod {
  label: string;
  amount: number;
  trend: number;
  startDate: Date;
  endDate: Date;
}

interface CommissionBreakdown {
  directSales: number;
  teamVolume: number;
  bonusRevenue: number;
  totalGross: number;
  totalTax: number;
  totalNet: number;
}

interface DashboardData {
  periods: CommissionPeriod[];
  breakdown: CommissionBreakdown;
  walletBalance: number;
  pendingPayout: number;
  totalEarnings: number;
  loading: boolean;
  error: string | null;
}


/**
 * Calculate period start/end dates
 */
function getPeriodDates(periodIndex: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (periodIndex === 0) {
    return { start: today, end: now, label: 'Hôm nay' };
  }
  if (periodIndex === 1) {
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return { start: startOfWeek, end: now, label: 'Tuần này' };
  }
  if (periodIndex === 2) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfMonth, end: now, label: 'Tháng này' };
  }
  return { start: today, end: now, label: '' };
}

/**
 * Calculate commission for a specific period
 */
function calculatePeriodCommission(
  transactions: Transaction[],
  start: Date,
  end: Date
): { amount: number; directSales: number; teamVolume: number; bonusRevenue: number } {
  const filtered = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= start && txDate <= end;
  });

  return filtered.reduce(
    (acc, tx) => {
      const amount = typeof tx.amount === 'number' ? tx.amount : 0;
      const type = typeof tx.type === 'string' ? tx.type.toLowerCase() : '';
      const metadata = tx.metadata || {};

      acc.amount += amount;

      if (type.includes('direct') || type.includes('sale')) {
        acc.directSales += amount;
      } else if (type.includes('sponsor') || type.includes('team') || type.includes('level')) {
        acc.teamVolume += amount;
      }

      if (metadata?.trigger_agent === 'the_bee') {
        acc.bonusRevenue += amount;
      }

      return acc;
    },
    { amount: 0, directSales: 0, teamVolume: 0, bonusRevenue: 0 }
  );
}

/**
 * Calculate trend percentage (current vs previous period)
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function useCommissionDashboard(userId: string | null): DashboardData {
  const { transactions } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);

  // Load wallet data
  const loadWallet = useCallback(async (uid: string) => {
    try {
      const wallet = await walletService.getWallet(uid);
      if (wallet) {
        setWalletBalance(wallet.balance);
        setPendingPayout(wallet.pendingPayout);
      }
    } catch (err) {
      logger.error('Failed to load wallet', err as Error);
      setError('Không thể tải ví');
    }
  }, []);

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!userId) {
      setWalletBalance(0);
      setPendingPayout(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadWallet(userId);

    const unsubscribe = walletService.subscribeToWallet(
      userId,
      (data) => {
        if (data) {
          setWalletBalance(data.balance);
          setPendingPayout(data.pendingPayout);
        }
      },
      (err) => {
        logger.error('Wallet subscription error', err);
        setError('Lỗi kết nối real-time');
      }
    );

    return () => unsubscribe();
  }, [userId, loadWallet]);

  // Calculate period stats
  const periods: CommissionPeriod[] = useMemo(() => {
    if (!transactions.length) {
      return [
        { label: 'Hôm nay', amount: 0, trend: 0, startDate: new Date(), endDate: new Date() },
        { label: 'Tuần này', amount: 0, trend: 0, startDate: new Date(), endDate: new Date() },
        { label: 'Tháng này', amount: 0, trend: 0, startDate: new Date(), endDate: new Date() },
      ];
    }

    return [0, 1, 2].map((idx) => {
      const { start, end, label } = getPeriodDates(idx);
      const current = calculatePeriodCommission(transactions, start, end);

      // Calculate previous period for trend
      const periodDuration = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodDuration);
      const prevEnd = new Date(start.getTime() - 1);
      const previous = calculatePeriodCommission(transactions, prevStart, prevEnd);

      return {
        label,
        amount: current.amount,
        trend: calculateTrend(current.amount, previous.amount),
        startDate: start,
        endDate: end,
      };
    });
  }, [transactions]);

  // Calculate breakdown
  const breakdown: CommissionBreakdown = useMemo(() => {
    const monthPeriod = periods[2];
    if (!monthPeriod) {
      return {
        directSales: 0,
        teamVolume: 0,
        bonusRevenue: 0,
        totalGross: 0,
        totalTax: 0,
        totalNet: 0,
      };
    }

    const monthData = calculatePeriodCommission(
      transactions,
      monthPeriod.startDate,
      monthPeriod.endDate
    );

    const totalGross = monthData.amount;
    const { taxAmount } = calculatePIT(totalGross);

    return {
      directSales: monthData.directSales,
      teamVolume: monthData.teamVolume,
      bonusRevenue: monthData.bonusRevenue,
      totalGross,
      totalTax: taxAmount,
      totalNet: totalGross - taxAmount,
    };
  }, [transactions, periods]);

  useEffect(() => {
    setLoading(false);
  }, [walletBalance, periods, breakdown]);

  return {
    periods,
    breakdown,
    walletBalance,
    pendingPayout,
    totalEarnings: walletBalance + pendingPayout,
    loading,
    error,
  };
}
