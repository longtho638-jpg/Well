/**
 * Commission Dashboard Page (Aura Elite)
 * Real-time ROI visibility with PayOS data integration
 *
 * Features:
 * - Period stats (today/week/month) with trends
 * - Commission breakdown (direct sales, team volume, bonus)
 * - Wallet balance sync
 * - Export functionality (CSV/PDF)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Wallet, ArrowDownLeft } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useCommissionDashboard } from '@/hooks/use-commission-dashboard';
import { useStore } from '@/store';
import { formatVND } from '@/utils/format';
import { CommissionStatsGrid } from '@/components/commission/CommissionStatsGrid';
import { CommissionBreakdownCard } from '@/components/commission/CommissionBreakdownCard';
import { useCommissionWalletExportHandlers } from '@/components/commission/use-commission-wallet-export-handlers';
import { WithdrawalModal } from '@/components/WithdrawalModal';

const CommissionDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const {
    periods,
    breakdown,
    walletBalance,
    pendingPayout,
    totalEarnings,
    loading,
    error,
  } = useCommissionDashboard(user?.id || null);

  const {
    processedTransactions,
    isGenerating,
    handleExportCSV,
    handleExportPDF,
  } = useCommissionWalletExportHandlers();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.commission.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {t('dashboard.commission.description')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
                  {t('commissionwallet.withdrawable_balance')}
                </p>
                <h2 className="text-4xl font-black tracking-tight">
                  {formatVND(walletBalance)}
                </h2>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-white font-bold transition-all flex items-center gap-2"
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span>{t('commissionwallet.request_withdrawal')}</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-emerald-100 text-xs mb-1">Tổng thu nhập</p>
              <p className="text-xl font-bold">{formatVND(totalEarnings)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs mb-1">Đang chờ</p>
              <p className="text-xl font-bold">{formatVND(pendingPayout)}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-emerald-100 text-xs mb-1">Thuế 10% PIT</p>
              <p className="text-xl font-bold text-red-300">-{formatVND(breakdown.totalTax)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Period Stats Grid */}
      <CommissionStatsGrid periods={periods} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Breakdown */}
        <CommissionBreakdownCard
          directSales={breakdown.directSales}
          teamVolume={breakdown.teamVolume}
          bonusRevenue={breakdown.bonusRevenue}
          totalGross={breakdown.totalGross}
          totalTax={breakdown.totalTax}
          totalNet={breakdown.totalNet}
        />

        {/* Recent Transactions Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg">
              Giao dịch gần đây
            </h3>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {processedTransactions.length} giao dịch
            </span>
          </div>

          <div className="space-y-3">
            {processedTransactions.slice(0, 5).map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.type.includes('Bonus') ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                      {tx.type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{tx.date}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-500">
                  {formatVND(tx.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableBalance={walletBalance}
      />
    </div>
  );
};

export default CommissionDashboard;
