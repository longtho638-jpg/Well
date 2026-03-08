import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Brain,
  Mail,
  Gift as GiftIcon,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { AtRiskMember } from '@/types';

interface Props {
  atRiskMembers: AtRiskMember[];
  actionLoading: string | null;
  onSendReminder: (memberId: string) => void;
  onSendGift: (memberId: string) => void;
}

/**
 * At-Risk Members List with Actions Component
 * Displays list of team members flagged as at-risk by AI
 * Features:
 * - Risk level badge (high/medium/low)
 * - Risk reasons list
 * - AI-suggested actions
 * - Action buttons: Send Reminder, Send Gift
 */
export default function AtRiskMembersListWithActions({
  atRiskMembers,
  actionLoading,
  onSendReminder,
  onSendGift,
}: Props) {
  const { t } = useTranslation();

  const getRiskBadgeColor = (riskLevel: 'high' | 'medium' | 'low') => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl blur-xl opacity-50" />
      <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            {t('leaderdashboard.thanh_vien_can_ch')} ({atRiskMembers.length})
          </h3>
          <p className="text-sm text-zinc-500 dark:text-gray-300 mt-1">
            {t('leaderdashboard.ai_phat_hien_nhung_thanh_vien')}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {atRiskMembers.map((atRiskMember, index) => (
            <motion.div
              key={atRiskMember.member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-50 dark:bg-white/5 rounded-2xl p-6 border border-zinc-200 dark:border-white/20 hover:border-orange-500/40 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <img
                  src={atRiskMember.member.avatarUrl}
                  alt={atRiskMember.member.name}
                  className="w-16 h-16 rounded-full ring-4 ring-white/20 shadow-lg"
                />

                {/* Member Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-lg">
                        {atRiskMember.member.name}
                      </h4>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">{atRiskMember.member.email}</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${getRiskBadgeColor(atRiskMember.riskLevel)}`}>
                      {atRiskMember.riskLevel === 'high' && t('leaderdashboard.risk_levels.high')}
                      {atRiskMember.riskLevel === 'medium' && t('leaderdashboard.risk_levels.medium')}
                      {atRiskMember.riskLevel === 'low' && t('leaderdashboard.risk_levels.low')}
                    </span>
                  </div>

                  {/* Risk Reasons */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-orange-300 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('leaderdashboard.li_do_can_ch')}
                    </p>
                    <ul className="text-xs text-orange-200 space-y-1">
                      {atRiskMember.riskReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-orange-400 rounded-full"></span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Actions */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-blue-300 mb-2 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      {t('leaderdashboard.ai_xuat')}
                    </p>
                    <ul className="text-xs text-blue-200 space-y-1">
                      {atRiskMember.suggestedActions.map((action, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => onSendReminder(atRiskMember.member.id)}
                      disabled={actionLoading === `reminder-${atRiskMember.member.id}`}
                      className="flex-1 py-2.5 bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === `reminder-${atRiskMember.member.id}` ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {t('leaderdashboard.goi_y_nhanh')}
                    </button>
                    <button
                      onClick={() => onSendGift(atRiskMember.member.id)}
                      disabled={actionLoading === `gift-${atRiskMember.member.id}`}
                      className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                      {actionLoading === `gift-${atRiskMember.member.id}` ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <GiftIcon className="w-4 h-4" />
                      )}
                      {t('leaderdashboard.tong_quan_khach_lo')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
