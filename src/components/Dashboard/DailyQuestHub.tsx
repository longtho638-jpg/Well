/**
 * Daily Quest Hub (Refactored)
 * Phase 4: High-Performance Gamification Lab for VC/IPO readiness.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy } from 'lucide-react';

import { useQuests } from '@/hooks/useQuests';
import { formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { QuestCard, TokenFlyAnimation } from './daily-quest-card-and-token-fly-animation';

// ── Main hub ─────────────────────────────────────────────────

export const DailyQuestHub: React.FC = () => {
  const { t } = useTranslation();
  const {
    quests,
    stats,
    flyingTokens,
    handleStartQuest,
    handleClaimReward,
    handleTokenAnimationComplete
  } = useQuests();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 rounded-[3rem] shadow-2xl shadow-zinc-500/5 overflow-hidden"
    >
      {/* Header Stage */}
      <div className="bg-[#00575A] p-8 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="p-4 bg-white/10 backdrop-blur-md rounded-[1.5rem] border border-white/20 shadow-2xl"
            >
              <Trophy className="text-white w-8 h-8" />
            </motion.div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                {t('dashboard.dailyQuest.title')}
                {stats.isAllCompleted && (
                  <motion.span initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">{t('dailyquesthub.mastered')}</motion.span>
                )}
              </h3>
              <div className="flex items-center gap-4 text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                <span>{stats.completedCount}/{stats.totalCount} {t('dailyquesthub.completed_1')}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-emerald-400">{t('dailyquesthub.yield')}{formatNumber(stats.totalRewards)} {t('dailyquesthub.grow_1')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
            <TrendingUp className="text-emerald-400" size={20} />
            <div className="text-right">
              <p className="text-white font-black text-lg tracking-widest">+{formatNumber(stats.totalRewards)}</p>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('dailyquesthub.accumulated_today')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quests Carousel */}
      <div className="p-10 space-y-8">
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onStart={handleStartQuest}
              onClaim={handleClaimReward}
            />
          ))}
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-3">
          {quests.map((q) => (
            <motion.div
              key={q.id}
              animate={{
                width: q.isCompleted ? 24 : 8,
                backgroundColor: q.isCompleted ? '#059669' : '#d4d4d8',
                opacity: q.isCompleted ? 1 : 0.3
              }}
              className="h-2 rounded-full transition-all duration-500"
            />
          ))}
        </div>
      </div>

      {/* Visual Feedback Layer */}
      <AnimatePresence>
        {flyingTokens.map(token => (
          <TokenFlyAnimation
            key={token.id}
            startX={token.x}
            startY={token.y}
            onComplete={() => handleTokenAnimationComplete(token.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};