/**
 * Hero Card (Refactored - Aura Elite)
 * Premium gamification dashboard component using high-fidelity Aura design tokens.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Trophy, Zap, ChevronRight, Check } from 'lucide-react';
import { User } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

// Hooks
import { useHeroCard } from '../../hooks/useHeroCard';

interface Props {
  user: User;
}

export const HeroCard: React.FC<Props> = ({ user }) => {
  const { t } = useTranslation();
  const {
    progressPercent,
    remaining,
    referralLink,
    copied,
    handleCopyLink,
    handleShare
  } = useHeroCard(user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 md:col-span-2 lg:col-span-3 relative overflow-hidden rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] group border border-white/5"
    >
      {/* Ultra-High Fidelity Background Layer */}
      <div className="absolute inset-0 bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00575A]/40 via-teal-900/20 to-zinc-950" />
        {/* Dynamic Aura Glows */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 -top-20 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/4 -bottom-40 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-12 flex flex-col xl:flex-row justify-between items-end gap-12">
        <div className="flex-1 w-full space-y-10">
          {/* Header & Elite Badges */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-amber-400 text-zinc-950 text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.25em] flex items-center gap-2 shadow-[0_0_30px_rgba(251,191,36,0.3)] border border-amber-300/50"
              >
                <Zap className="w-4 h-4 fill-current" />
                {t('herocard.founders_pathway')}</motion.div>
              <span className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] border border-teal-500/20 px-5 py-2.5 rounded-xl backdrop-blur-2xl bg-white/5">
                {t('dashboard.hero.daysLeft', { days: 18 })}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
                {t('dashboard.hero.ipoPathway')}
              </h2>
              <p className="text-zinc-400 font-medium text-xl max-w-xl leading-relaxed">
                {t('herocard.reach')}<span className="text-white font-black underline underline-offset-8 decoration-teal-500/50">{t('herocard.100m_vnd_revenue')}</span> {t('herocard.to_unlock')}<span className="text-white font-black italic">{t('herocard.venture_partner_status')}</span>.
              </p>
            </div>
          </div>

          {/* Gamification Progress Lab */}
          <div className="max-w-xl space-y-5 bg-zinc-900/40 p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group/lab">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

            <div className="flex justify-between items-end relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t('herocard.achievement_logic')}</span>
                <h4 className="text-white font-black text-lg uppercase tracking-tight">{t('herocard.ecosystem_scaling')}</h4>
              </div>
              <span className="text-5xl font-black text-amber-400 tracking-tighter leading-none italic">{progressPercent.toFixed(1)}%</span>
            </div>

            <div className="bg-zinc-950 rounded-2xl h-8 w-full overflow-hidden border border-white/5 p-1.5 relative shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-amber-400 rounded-lg relative shadow-[0_0_30px_rgba(45,212,191,0.4)]"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
            </div>

            <div className="flex items-center gap-4 pt-2 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shadow-xl shadow-teal-500/5">
                <Trophy size={20} />
              </div>
              <p className="text-sm font-bold text-zinc-400 tracking-tight">
                <span className="text-white font-black text-lg mr-2">{formatVND(remaining)}</span> {t('dashboard.hero.remaining')} {t('herocard.to_hit_next_milestone')}</p>
            </div>
          </div>
        </div>

        {/* Global Access Link (Glassmorphism) */}
        <div className="w-full xl:w-[400px] bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] space-y-10 relative overflow-hidden group/share">
          <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover/share:scale-125 transition-transform duration-1000 rotate-12">
            <Zap size={200} className="text-white" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">{t('referral.link.title')}</h4>
              <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[9px] font-black uppercase">{t('herocard.live')}</span>
              </div>
            </div>
            <div className="relative group/input">
              <div className="bg-zinc-950/80 border border-white/10 p-5 rounded-[1.5rem] font-mono text-[11px] text-zinc-500 truncate overflow-hidden transition-all group-hover/input:border-teal-500/40 shadow-inner">
                {referralLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/10 transition-all text-zinc-400 hover:text-white shadow-2xl"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full bg-[#00575A] text-white font-black py-6 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(0,87,90,0.4)] flex items-center justify-center gap-4 group/btn border border-teal-500/20"
          >
            {copied ? t('herocard.access_secured') : t('referral.link.share')}
            <ChevronRight size={20} className="group-hover/btn:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
