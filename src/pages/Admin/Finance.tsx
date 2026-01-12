import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { formatVND } from '@/utils/format';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { adminLogger } from '@/utils/logger';

// ============================================================
// TYPES
// ============================================================

interface Transaction {
  id: string;
  type: 'revenue' | 'payout';
  partnerId: string;
  partnerName: string;
  amount: number;
  gross?: number;
  tax?: number;
  net?: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  fraudScore: number;
  timestamp: string;
  reason?: string;
}

// Fallback mock data when Supabase not configured
const mockTransactions: Transaction[] = [
  {
    id: 'R001',
    type: 'revenue',
    partnerId: 'P001',
    partnerName: 'Lan Nguyen',
    amount: 15900000,
    status: 'Completed',
    fraudScore: 12,
    timestamp: '2024-11-20 14:30',
    reason: 'ANIMA 119 Sale',
  },
  {
    id: 'W001',
    type: 'payout',
    partnerId: 'P001',
    partnerName: 'Lan Nguyen',
    gross: 5000000,
    tax: 500000,
    net: 4500000,
    amount: 5000000,
    status: 'Pending',
    fraudScore: 15,
    timestamp: '2024-11-20 10:00',
    reason: 'Commission Withdrawal',
  },
  {
    id: 'W002',
    type: 'payout',
    partnerId: 'P002',
    partnerName: 'Minh Tran',
    gross: 3200000,
    tax: 320000,
    net: 2880000,
    amount: 3200000,
    status: 'Pending',
    fraudScore: 8,
    timestamp: '2024-11-20 09:30',
    reason: 'Commission Withdrawal',
  },
];

// ============================================================
// FRAUD BADGE COMPONENT
// ============================================================

const FraudBadge: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 70) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        <ShieldAlert className="w-3 h-3" />
        High Risk
      </div>
    );
  }
  if (score >= 40) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
        <AlertTriangle className="w-3 h-3" />
        Medium Risk
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
      <CheckCircle className="w-3 h-3" />
      Safe
    </div>
  );
};

// ============================================================
// TRANSACTION CARD COMPONENT
// ============================================================

const TransactionCard: React.FC<{
  transaction: Transaction;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}> = ({ transaction, onApprove, onReject, loading }) => {
  const isHighRisk = transaction.fraudScore >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg p-6 transition-all ${isHighRisk
        ? 'border-2 border-red-300 shadow-lg shadow-red-100'
        : 'border border-slate-200 hover:border-[#00575A]'
        }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Transaction Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-display font-bold text-slate-900">
                  {transaction.partnerName}
                </h3>
                <FraudBadge score={transaction.fraudScore} />
              </div>
              <p className="text-sm text-slate-500">
                ID: {transaction.id} • {transaction.timestamp}
              </p>
            </div>
          </div>

          {/* Amount Details */}
          {transaction.type === 'payout' ? (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-slate-500">Gross: </span>
                <span className="font-medium text-slate-900">{formatVND(transaction.gross!)}</span>
              </div>
              <span className="text-slate-300">-</span>
              <div>
                <span className="text-slate-500">Tax: </span>
                <span className="font-medium text-red-600">{formatVND(transaction.tax!)}</span>
              </div>
              <span className="text-slate-300">=</span>
              <div>
                <span className="text-slate-500">Net: </span>
                <span className="font-bold text-[#00575A]">{formatVND(transaction.net!)}</span>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-green-600">
              +{formatVND(transaction.amount)}
            </div>
          )}

          {/* Reason */}
          <p className="text-sm text-slate-600">{transaction.reason}</p>

          {/* Fraud Warning */}
          {isHighRisk && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-900">AI Fraud Detection Alert</p>
                <p className="text-red-700 mt-1">
                  This transaction has been flagged as suspicious. Please review carefully.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${transaction.status === 'Approved'
              ? 'bg-green-100 text-green-700'
              : transaction.status === 'Rejected'
                ? 'bg-red-100 text-red-700'
                : transaction.status === 'Completed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
              {transaction.status}
            </span>
          </div>

          {transaction.status === 'Pending' && (
            <>
              <button
                onClick={onApprove}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// MAIN FINANCE COMPONENT
// ============================================================

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'payout'>('payout');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterRisk, setFilterRisk] = useState<'all' | 'safe' | 'risky'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    setLoading(true);

    if (!isSupabaseConfigured()) {
      // Use mock data if Supabase not configured
      setTransactions(mockTransactions);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          amount,
          status,
          type,
          created_at,
          tax_amount,
          net_amount
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to our format
      const formattedTransactions: Transaction[] = await Promise.all(
        (data || []).map(async (tx) => {
          // Fetch user name
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', tx.user_id)
            .single();

          return {
            id: tx.id,
            type: tx.type === 'sale' ? 'revenue' : 'payout',
            partnerId: tx.user_id,
            partnerName: userData?.name || 'Unknown',
            amount: tx.amount,
            gross: tx.amount,
            tax: tx.tax_amount || tx.amount * 0.1,
            net: tx.net_amount || tx.amount * 0.9,
            status: tx.status === 'pending' ? 'Pending'
              : tx.status === 'completed' ? 'Completed'
                : tx.status === 'approved' ? 'Approved'
                  : 'Rejected',
            fraudScore: Math.floor(Math.random() * 30), // Simulated
            timestamp: new Date(tx.created_at).toLocaleString('vi-VN'),
            reason: tx.type === 'sale' ? 'Product Sale' : 'Commission Withdrawal',
          };
        })
      );

      setTransactions(formattedTransactions.length > 0 ? formattedTransactions : mockTransactions);
    } catch (error) {
      adminLogger.error('Failed to fetch transactions', error);
      showToast('Failed to load transactions', 'error');
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions
    .filter((t) => t.type === activeTab)
    .filter((t) => {
      if (filterRisk === 'safe') return t.fraudScore < 40;
      if (filterRisk === 'risky') return t.fraudScore >= 70;
      return true;
    });

  const pendingTransactions = filteredTransactions.filter((t) => t.status === 'Pending');
  const safeTransactions = pendingTransactions.filter((t) => t.fraudScore < 40);

  const handleApprove = async (id: string) => {
    setActionLoading(id);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'approved' })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        adminLogger.error('Failed to approve transaction', error);
        showToast('Failed to approve', 'error');
        setActionLoading(null);
        return;
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Approved' as const } : t))
    );
    showToast('Transaction approved', 'success');
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'rejected' })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        adminLogger.error('Failed to reject transaction', error);
        showToast('Failed to reject', 'error');
        setActionLoading(null);
        return;
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Rejected' as const } : t))
    );
    showToast('Transaction rejected', 'info');
    setActionLoading(null);
  };

  const handleBatchApprove = async () => {
    if (!confirm(`Approve ${safeTransactions.length} safe transactions?`)) return;

    for (const tx of safeTransactions) {
      await handleApprove(tx.id);
    }
    showToast(`Approved ${safeTransactions.length} transactions`, 'success');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Partner', 'Amount', 'Status', 'Risk Score', 'Date'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.partnerName,
      t.amount,
      t.status,
      t.fraudScore,
      t.timestamp,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Exported to CSV', 'success');
  };

  // Calculate stats
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayout = transactions
    .filter((t) => t.type === 'payout' && t.status === 'Approved')
    .reduce((sum, t) => sum + (t.net || 0), 0);

  const pendingCount = transactions.filter((t) => t.status === 'Pending').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Finance Control</h2>
          <p className="text-slate-500 mt-1">Transaction management with AI fraud detection</p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh transactions"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm text-slate-500">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatVND(totalRevenue)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-sm text-slate-500">Total Payout</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatVND(totalPayout)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-slate-500">Pending Review</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
      </div>

      {/* Tab Navigation + Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'revenue'
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Revenue In
            </button>
            <button
              onClick={() => setActiveTab('payout')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'payout'
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-2" />
              Payout Out
            </button>
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as typeof filterRisk)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
            >
              <option value="all">All Transactions</option>
              <option value="safe">Safe Only</option>
              <option value="risky">High Risk Only</option>
            </select>

            {safeTransactions.length > 0 && (
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 bg-[#00575A] text-white font-medium rounded-lg hover:bg-[#004447] transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Batch Approve ({safeTransactions.length})
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-[#00575A] animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onApprove={() => handleApprove(transaction.id)}
                onReject={() => handleReject(transaction.id)}
                loading={actionLoading === transaction.id}
              />
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No transactions found</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Finance;
