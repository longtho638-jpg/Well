/**
 * Daily Quest Hub (Refactored)
 * Phase 4: High-Performance Gamification Lab for VC/IPO readiness.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Coins,
  TrendingUp,
  Sparkles,
  Trophy
} from 'lucide-react';

// Hooks & Orchestration
import { useQuests, FullQuest } from '@/hooks/useQuests';
import { formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';

// ============================================================
// SUB-COMPONENTS
// ============================================================

const TokenFlyAnimation: React.FC<{ startX: number; startY: number; onComplete: () => void }> = ({ startX, startY, onComplete }) => (
  <motion.div
    initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
    animate={{
      x: window.innerWidth - 100,
      y: -100,
      opacity: 0,
      scale: 0.3
    }}
    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
    onAnimationComplete={onComplete}
    className="fixed z-[100] pointer-events-none"
  >
    <div className="w-14 h-14 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)] border-2 border-white/20">
      <Coins className="w-7 h-7 text-white" />
    </div>
  </motion.div>
);

const QuestCard: React.FC<{
  quest: FullQuest;
  onStart: (id: string, path?: string) => boolean;
  onClaim: (id: string, rect: DOMRect) => void;
}> = ({ quest, onStart, onClaim }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    if (quest.status === 'ready') {
      const started = onStart(quest.id, quest.navigationPath);
      if (started && quest.navigationPath) navigate(quest.navigationPath);
    } else if (quest.status === 'claimable') {
      onClaim(quest.id, (e.currentTarget as HTMLElement).getBoundingClientRect());
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`min-w-[300px] snap-start bg-white dark:bg-zinc-900 border rounded-[2rem] overflow-hidden transition-all duration-500 shadow-xl shadow-zinc-500/5 ${quest.status === 'done' ? 'border-emerald-500/20 opacity-80' : 'border-zinc-100 dark:border-white/5'
        }`}
    >
      <div className={`h-2 bg-gradient-to-r ${quest.bgGradient}`} />
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${quest.bgGradient} shadow-lg shadow-zinc-500/10`}>
            <quest.icon className="w-7 h-7 text-white" />
          </div>
          {quest.status === 'done' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 text-white p-2 rounded-full shadow-lg">
              <CheckCircle2 size={18} />
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">{quest.title}</h4>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed italic line-clamp-2">"{quest.description}"</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-500/5 border border-amber-500/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Coins size={16} className="text-amber-500" />
            <span className="text-xs font-black text-amber-600">+{formatNumber(quest.reward)} {t('dailyquesthub.grow')}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{quest.type}</span>
        </div>

        <button
          onClick={handleAction}
          disabled={quest.status === 'done'}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all duration-300 flex items-center justify-center gap-3 ${quest.status === 'done'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            : quest.status === 'claimable'
              ? 'bg-[#00575A] text-white shadow-xl shadow-teal-500/20 hover:scale-[1.02]'
              : `bg-gradient-to-r ${quest.bgGradient} text-white shadow-lg hover:shadow-xl hover:scale-[1.02]`
            }`}
        >
          {quest.status === 'done' ? (
            <>{t('dailyquesthub.completed')}</>
          ) : quest.status === 'claimable' ? (
            <><Sparkles size={14} className="animate-pulse" /> {t('dailyquesthub.claim_reward')}</>
          ) : (
            <>{t('dailyquesthub.start_quest')}<ArrowRight size={14} /></>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================
// MAIN HUB component
// ============================================================

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