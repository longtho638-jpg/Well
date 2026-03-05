/**
 * Commission Stats Grid (Aura Elite)
 * Period stats with trend indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Calendar, Sun } from 'lucide-react';
import { formatVND } from '@/utils/format';

interface CommissionPeriod {
  label: string;
  amount: number;
  trend: number;
}

interface CommissionStatsGridProps {
  periods: CommissionPeriod[];
}

const periodIcons = [Sun, Clock, Calendar];

export const CommissionStatsGrid: React.FC<CommissionStatsGridProps> = ({ periods }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {periods.map((period, idx) => {
        const IconComponent = periodIcons[idx] || Sun;
        const trend = period.trend;
        const isPositive = trend >= 0;

        return (
          <motion.div
            key={period.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative group"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />

            {/* Card */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
              {/* Icon + Label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {period.label}
                </span>
              </div>

              {/* Amount */}
              <div className="text-2xl font-black text-white dark:text-slate-100 tracking-tight mb-2">
                {formatVND(period.amount)}
              </div>

              {/* Trend */}
              <div className={`flex items-center gap-1.5 text-xs font-bold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
                <span className="text-gray-500 dark:text-slate-500 font-medium">vs kỳ trước</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CommissionStatsGrid;
