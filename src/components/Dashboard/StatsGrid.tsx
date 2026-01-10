
import React from 'react';
import { User } from '@/types';
import { formatVND, formatPercent } from '@/utils/format';
import { calculatePIT } from '@/utils/tax';
import { useTranslation } from '@/hooks';
import { TrendingUp, Users, CalendarClock, ArrowUpRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  user: User;
}

export const StatsGrid: React.FC<Props> = ({ user }) => {
  const { t } = useTranslation();

  // Pre-calculate tax for the estimated bonus to show transparently
  const estimatedBonus = user.estimatedBonus || 0;
  const taxInfo = calculatePIT(estimatedBonus);

  return (
    <>
      {/* Card 1: Personal Sales - Clean White Card style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary dark:text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {formatPercent(12.5)}
          </span>
        </div>
        <p className="text-gray-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
          {t('dashboard.stats.totalSales')}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatVND(user.totalSales)}</h3>
      </motion.div>

      {/* Card 2: Team Volume - Clean White Card style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {formatPercent(8.2)}
          </span>
        </div>
        <p className="text-gray-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
          {t('dashboard.stats.teamVolume')}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatVND(user.teamVolume)}</h3>
      </motion.div>

      {/* Card 3: Next Payout - Dark Theme for Contrast + Tax Logic Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-brand-dark dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group border border-gray-800 dark:border-slate-700"
      >
        {/* Decorative BG */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-brand-primary dark:bg-teal-500 opacity-20 rounded-bl-full transition-transform group-hover:scale-110"></div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-xl flex items-center justify-center text-brand-accent dark:text-yellow-400 backdrop-blur-sm border border-white/5">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-gray-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest">Pay Date</p>
            <p className="font-bold text-brand-accent dark:text-yellow-400 text-sm">{user.nextPayoutDate || 'TBD'}</p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
            {t('dashboard.stats.commission')}
          </p>
          <h3 className="text-2xl font-bold text-white dark:text-slate-100 mb-2">{formatVND(estimatedBonus)}</h3>

          {/* Tax Warning Micro-copy (Step 5 Compliance) */}
          {taxInfo.isTaxable && (
            <div className="flex items-center gap-1.5 bg-red-500/10 dark:bg-red-500/20 px-2 py-1 rounded text-[10px] text-red-200 dark:text-red-300 w-fit border border-red-500/20 dark:border-red-500/30">
              <Info className="w-3 h-3" />
              <span>Includes 10% PIT deduction (&gt; 2M)</span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
