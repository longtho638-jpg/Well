/**
 * Commission Widget (Aura Elite)
 * High-visibility earnings dashboard for distributor motivation
 * Shows real-time commission breakdown with trend indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { useCommissionWidgetPeriodCalculator } from './use-commission-widget-period-calculator';

export const CommissionWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { periods, breakdown, user } = useCommissionWidgetPeriodCalculator();

  const totalCommission = periods[2].amount; // Month total

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />

      {/* Card */}
      <div className="relative bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">
                  {t('dashboard.commission.title')}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  {t('dashboard.commission.subtitle')}
                </p>
              </div>
            </div>

            {/* Available Balance & Withdraw CTA */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  {t('dashboard.commission.availableBalance')}
                </p>
                <p className="text-xl font-black text-emerald-400">
                  {formatVND(user?.shopBalance || 0)}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/withdrawal')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Wallet className="w-4 h-4" />
                {t('dashboard.commission.withdraw')}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Period Stats */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {periods.map((period, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center bg-white/5 rounded-2xl p-4 border border-white/5"
            >
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                {period.label}
              </p>
              <p className="text-2xl font-black text-white mb-1 tracking-tight">
                {formatVND(period.amount)}
              </p>
              <div className={`flex items-center justify-center gap-1 text-xs font-bold ${
                period.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {period.trend >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{period.trend >= 0 ? '+' : ''}{period.trend.toFixed(1)}%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="px-6 pb-6">
          <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {t('dashboard.commission.breakdown')}
            </h4>

            {/* Direct Sales */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm text-zinc-300">
                  {t('dashboard.commission.directSales')}
                </span>
              </div>
              <span className="text-sm font-bold text-white">
                {formatVND(breakdown.directSales)}
              </span>
            </div>

            {/* Team Volume */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                <span className="text-sm text-zinc-300">
                  {t('dashboard.commission.teamVolume')}
                </span>
              </div>
              <span className="text-sm font-bold text-white">
                {formatVND(breakdown.teamVolume)}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 pt-3 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  {t('dashboard.commission.total')}
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {formatVND(totalCommission)}
                </span>
              </div>
            </div>

            {/* View Details */}
            <button
              onClick={() => navigate('/dashboard/wallet')}
              className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              {t('dashboard.commission.viewDetails')}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommissionWidget;
