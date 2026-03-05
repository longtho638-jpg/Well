/**
 * Commission Breakdown Card (Aura Elite)
 * Visual breakdown of commission sources with animated progress bars
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, Sparkles } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface CommissionBreakdownCardProps {
  directSales: number;
  teamVolume: number;
  bonusRevenue: number;
  totalGross: number;
  totalTax: number;
  totalNet: number;
}

export const CommissionBreakdownCard: React.FC<CommissionBreakdownCardProps> = ({
  directSales,
  teamVolume,
  bonusRevenue,
  totalGross,
  totalTax,
  totalNet,
}) => {
  const { t } = useTranslation();

  const total = directSales + teamVolume + bonusRevenue || 1; // Avoid division by zero
  const directPercent = (directSales / total) * 100;
  const teamPercent = (teamVolume / total) * 100;
  const bonusPercent = (bonusRevenue / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg">
            {t('dashboard.commission.breakdown')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('dashboard.commission.breakdownSubtitle')}
          </p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        {/* Direct Sales */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {t('dashboard.commission.directSales')}
              </span>
            </div>
            <span className="text-sm font-bold text-white dark:text-slate-100">
              {formatVND(directSales)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${directPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            />
          </div>
        </div>

        {/* Team Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {t('dashboard.commission.teamVolume')}
              </span>
            </div>
            <span className="text-sm font-bold text-white dark:text-slate-100">
              {formatVND(teamVolume)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${teamPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            />
          </div>
        </div>

        {/* Bonus Revenue (The Bee) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {t('dashboard.commission.bonusRevenue')}
              </span>
            </div>
            <span className="text-sm font-bold text-white dark:text-slate-100">
              {formatVND(bonusRevenue)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bonusPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-slate-400">{t('commissionwallet.total_earnings_gross')}</span>
          <span className="font-bold text-white dark:text-slate-100">{formatVND(totalGross)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-slate-400">{t('commissionwallet.withheld_tax_pit_10')}</span>
          <span className="font-bold text-red-400">-{formatVND(totalTax)}</span>
        </div>
        <div className="flex items-center justify-between text-base pt-2 border-t border-gray-100 dark:border-slate-700">
          <span className="font-bold text-gray-800 dark:text-slate-200">{t('dashboard.commission.total')}</span>
          <span className="font-black text-emerald-400">{formatVND(totalNet)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CommissionBreakdownCard;
