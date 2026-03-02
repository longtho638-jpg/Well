/**
 * Overview AI Action Item — individual AI recommendation card with approve/reject controls
 */

import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Wallet, ShieldAlert, Activity, Clock } from 'lucide-react';
import { AIAction } from '@/hooks/useAdminOverview';
import { useTranslation } from '@/hooks';

export const AIActionItem: React.FC<{
  action: AIAction;
  onAction: (id: string, decision: 'approve' | 'reject') => void;
}> = ({ action, onAction }) => {
  const { t } = useTranslation();

  const icons = {
    kyc: UserCheck,
    withdrawal: Wallet,
    fraud: ShieldAlert,
    policy: Activity,
  };
  const Icon = icons[action.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5 rounded-3xl group hover:border-[#00575A]/30 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-2xl ${
          action.priority === 'high'
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            : 'bg-[#00575A]/10 text-[#00575A] border-[#00575A]/20'
        } border`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{action.title}</h4>
              <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={10} /> {action.timestamp}
              </p>
            </div>
            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${
              action.priority === 'high'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
            }`}>
              {action.priority} {t('overview.risk')}
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">"{action.description}"</p>

          {/* Confidence Meter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${action.aiConfidence}%` }}
                className="h-full bg-[#00575A]"
              />
            </div>
            <span className="text-[10px] font-black text-[#00575A] uppercase tracking-tighter">
              {t('overview.ai')}{action.aiConfidence}{t('overview.confident')}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onAction(action.id, 'approve')}
              className="flex-1 bg-[#00575A] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-all"
            >
              {t('overview.resolve')}
            </button>
            <button
              onClick={() => onAction(action.id, 'reject')}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-200 dark:border-white/5"
            >
              {t('overview.reject')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
