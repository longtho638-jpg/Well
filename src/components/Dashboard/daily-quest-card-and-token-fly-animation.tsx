/**
 * DailyQuestHub sub-components: QuestCard and TokenFlyAnimation.
 * Extracted from DailyQuestHub.tsx to keep parent under 200 LOC.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { FullQuest } from '@/hooks/useQuests';
import { formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';

// ── Token fly animation ──────────────────────────────────────

interface TokenFlyAnimationProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

export const TokenFlyAnimation: React.FC<TokenFlyAnimationProps> = ({ startX, startY, onComplete }) => (
  <motion.div
    initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
    animate={{ x: window.innerWidth - 100, y: -100, opacity: 0, scale: 0.3 }}
    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
    onAnimationComplete={onComplete}
    className="fixed z-[100] pointer-events-none"
  >
    <div className="w-14 h-14 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)] border-2 border-white/20">
      <Coins className="w-7 h-7 text-white" />
    </div>
  </motion.div>
);

// ── Quest card ───────────────────────────────────────────────

interface QuestCardProps {
  quest: FullQuest;
  onStart: (id: string, path?: string) => boolean;
  onClaim: (id: string, rect: DOMRect) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onStart, onClaim }) => {
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
      className={`min-w-[300px] snap-start bg-white dark:bg-zinc-900 border rounded-[2rem] overflow-hidden transition-all duration-500 shadow-xl shadow-zinc-500/5 ${
        quest.status === 'done' ? 'border-emerald-500/20 opacity-80' : 'border-zinc-100 dark:border-white/5'
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
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all duration-300 flex items-center justify-center gap-3 ${
            quest.status === 'done'
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
