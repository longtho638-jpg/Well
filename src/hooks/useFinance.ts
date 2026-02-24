import { useState, useEffect, useCallback, useMemo } from 'react';
import { financeService, FinanceTransaction } from '@/services/financeService';
import { useToast } from '@/components/ui/Toast';
import { adminLogger } from '@/utils/logger';

export interface FinanceStats {
    totalRevenue: number;
    totalPayout: number;
    pendingCount: number;
}

export function useFinance() {
    const [activeTab, setActiveTab] = useState<'revenue' | 'payout'>('payout');
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [filterRisk, setFilterRisk] = useState<'all' | 'safe' | 'risky'>('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showToast } = useToast();

    /**
     * Platform Ledger Synchronizer
     */
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await financeService.getTransactions();
            setTransactions(data);
            adminLogger.info(`Finance: Synced ${data.length} ledger items`);
        } catch (error) {
            showToast('Strategic ledger sync failed', 'error');
            adminLogger.error('Critical: Failed to load transactions', error);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((t) => t.type === activeTab)
            .filter((t) => {
                if (filterRisk === 'safe') return t.fraudScore < 40;
                if (filterRisk === 'risky') return t.fraudScore >= 70;
                return true;
            });
    }, [transactions, activeTab, filterRisk]);

    const pendingTransactions = useMemo(() =>
        filteredTransactions.filter((t) => t.status === 'Pending'),
        [filteredTransactions]);

    const safeTransactions = useMemo(() =>
        pendingTransactions.filter((t) => t.fraudScore < 40),
        [pendingTransactions]);

    const handleApprove = async (id: string): Promise<void> => {
        setActionLoading(id);
        try {
            await financeService.updateTransactionStatus(id, 'approved');
            setTransactions((prev) =>
                prev.map((t) => (t.id === id ? { ...t, status: 'Approved' as const } : t))
            );
            showToast('Transaction integrity verified and committed', 'success');
        } catch (error) {
            adminLogger.error('Failed to approve transaction', error);
            showToast('Failed to commit transaction', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string): Promise<void> => {
        setActionLoading(id);
        try {
            await financeService.updateTransactionStatus(id, 'rejected');
            setTransactions((prev) =>
                prev.map((t) => (t.id === id ? { ...t, status: 'Rejected' as const } : t))
            );
            showToast('Transaction security blockade enforced', 'info');
        } catch (error) {
            adminLogger.error('Failed to reject transaction', error);
            showToast('Blockade enforcement failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    /**
     * Batch Security Commitment
     */
    const handleBatchApprove = async (): Promise<void> => {
        const targetCount = safeTransactions.length;
        if (targetCount === 0) return;

        if (!confirm(`Commit safety validation for ${targetCount} verified items?`)) return;

        // Perform sequentially to maintain data integrity and avoid API pressure
        for (const tx of safeTransactions) {
            await handleApprove(tx.id);
        }
        showToast(`Batch security commit finalized for ${targetCount} units`, 'success');
    };

    const stats = useMemo<FinanceStats>(() => {
        return {
            totalRevenue: transactions
                .filter((t) => t.type === 'revenue' && t.status === 'Completed')
                .reduce((sum, t) => sum + t.amount, 0),
            totalPayout: transactions
                .filter((t) => t.type === 'payout' && t.status === 'Approved')
                .reduce((sum, t) => sum + (t.net || 0), 0),
            pendingCount: transactions.filter((t) => t.status === 'Pending').length
        };
    }, [transactions]);

    return {
        activeTab,
        setActiveTab,
        filteredTransactions,
        filterRisk,
        setFilterRisk,
        loading,
        actionLoading,
        stats,
        safeTransactions,
        refresh: fetchTransactions,
        handleApprove,
        handleReject,
        handleBatchApprove,
        transactions
    };
}
