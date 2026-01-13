/**
 * Stats Grid (Refactored - Aura Standard)
 * Decomposed dashboard cards using high-grade Aura design tokens and refined typography.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, CalendarClock, ArrowUpRight, Info, ShieldCheck } from 'lucide-react';
import { User } from '@/types';
import { formatVND, formatPercent } from '@/utils/format';
import { useTranslation, TranslationKey } from '@/hooks/useTranslation';

// Hooks
import { useStatsGrid } from '../../hooks/useStatsGrid';

interface Props {
  user: User;
}

const StatIcon: React.FC<{ icon: string; color: string }> = ({ icon, color }) => {
  const icons: Record<string, React.ElementType> = { TrendingUp, Users, CalendarClock };
  const Icon = icons[icon] || TrendingUp;

  const colors: Record<string, string> = {
    teal: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    blue: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[color] || colors.teal} shadow-2xl`}>
      <Icon className="w-7 h-7" />
    </div>
  );
};

export const StatsGrid: React.FC<Props> = ({ user }) => {
  const { t } = useTranslation();
  const {
    estimatedBonus,
    taxInfo,
    statsConfig,
    nextPayoutDate
  } = useStatsGrid(user);

  return (
    <>
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-zinc-950/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl group hover:border-teal-500/30 transition-all duration-700 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
            {stat.icon === 'TrendingUp' ? <TrendingUp className="w-32 h-32" /> : <Users className="w-32 h-32" />}
          </div>

          <div className="flex justify-between items-start mb-10 relative z-10">
            <StatIcon icon={stat.icon} color={stat.color} />
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-4 py-2 rounded-full border border-emerald-500/10 shadow-xl">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {formatPercent(stat.trend)}
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">
              {t(stat.label as TranslationKey)}
            </p>
            <h3 className="text-4xl font-black text-white tracking-tighter italic">
              {formatVND(stat.value)}
            </h3>
          </div>
        </motion.div>
      ))}

      {/* Financial Payout Card - Aura Specialized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#00575A]/10 backdrop-blur-3xl border border-teal-500/20 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,87,90,0.2)] relative overflow-hidden group/payout"
      >
        <div className="absolute right-0 top-0 w-48 h-48 bg-amber-400 opacity-[0.05] rounded-bl-full group-hover/payout:scale-110 transition-transform duration-1000 blur-2xl" />

        <div className="flex justify-between items-start mb-10 relative z-10">
          <StatIcon icon="CalendarClock" color="amber" />
          <div className="text-right space-y-1 bg-zinc-950/40 px-5 py-2.5 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Next Cycle</p>
            <p className="font-black text-amber-400 text-sm tracking-tighter uppercase italic">{nextPayoutDate}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">
                {t('dashboard.stats.commission')}
              </p>
              <ShieldCheck size={12} className="text-emerald-500/50" />
            </div>
            <h3 className="text-4xl font-black text-white tracking-tighter italic">
              {formatVND(estimatedBonus)}
            </h3>
          </div>

          {taxInfo.isTaxable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-white/5 shadow-inner"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Info size={16} />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">
                10% PIT <span className="text-zinc-600">Reserved Tier (&gt; 2M)</span>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};
