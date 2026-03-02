/**
 * WellNexus Finance Mission Control (Max Level)
 * Strategic Ledger verification with real-time fraud detection and high-fidelity analytics.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Clock, Filter, Loader2, ShieldCheck } from 'lucide-react';

import { useFinance } from '@/hooks/useFinance';
import { useToast } from '@/components/ui/Toast';
import { StatBoard } from '@/components/admin/finance/StatBoard';
import { TransactionCard } from '@/components/admin/finance/TransactionCard';
import { FinancePageHeader } from '@/components/admin/finance/finance-page-header-with-export-button';
import { useTranslation } from '@/hooks';

const Finance: React.FC = () => {
    const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    filteredTransactions,
    filterRisk,
    setFilterRisk,
    loading,
    actionLoading,
    stats,
    safeTransactions,
    refresh,
    handleApprove,
    handleReject,
    handleBatchApprove,
    transactions
  } = useFinance();

  const { showToast } = useToast();

  /**
   * Strategic Data Export
   */
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Partner', 'Amount', 'Status', 'Risk Score', 'Date'];
    const csv = [
      headers.join(','),
      ...transactions.map(t => [
        t.id, t.type, t.partnerName, t.amount, t.status, t.fraudScore, t.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WellNexus_Treasury_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Treasury report exported to secure storage', 'success');
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <FinancePageHeader loading={loading} onRefresh={refresh} onExportCSV={handleExportCSV} />

      {/* Performance StatBoard */}
      <StatBoard
        stats={stats}
        icons={{
          revenue: TrendingUp,
          payout: TrendingDown,
          pending: Clock
        }}
      />

      {/* Verification Control Bar */}
      <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="flex p-2 bg-zinc-950 rounded-[1.5rem] border border-white/5 gap-2">
            {[
              { id: 'revenue', label: 'Revenue Inflow', active: activeTab === 'revenue' },
              { id: 'payout', label: 'Treasury Payout', active: activeTab === 'payout' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id as 'revenue' | 'payout')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all italic ${btn.active
                  ? 'bg-[#00575A] text-white shadow-xl shadow-teal-900/20'
                  : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4 px-6 py-3 border border-white/5 rounded-2xl bg-zinc-950">
              <Filter className="w-4 h-4 text-zinc-600" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as 'all' | 'safe' | 'risky')}
                className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none text-zinc-400 italic cursor-pointer"
              >
                <option value="all">{t('finance.analyze_all')}</option>
                <option value="safe">{t('finance.security_passed')}</option>
                <option value="risky">{t('finance.quarantined_items')}</option>
              </select>
            </div>

            <AnimatePresence>
              {safeTransactions.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBatchApprove}
                  className="px-8 py-4 bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 shadow-2xl shadow-emerald-500/20 italic"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t('finance.security_batch_commit')}{safeTransactions.length})
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center bg-zinc-900/30 rounded-[3rem] border border-white/5">
          <Loader2 className="w-12 h-12 text-[#00575A] animate-spin mb-6" />
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse text-[10px]">{t('finance.verifying_digital_ledgers')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-800/50 backdrop-blur-sm"
              >
                <Wallet className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{t('finance.ledger_synchronized')}</h3>
                <p className="text-zinc-500 font-medium mt-2">{t('finance.no_items_in_the_current_filter')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Finance;
