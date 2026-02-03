/**
 * Leaderboard Challenge Modal Component
 * Popup modal for challenging other partners
 * Features:
 * - Gradient header with target user info
 * - Gap calculation display
 * - Motivational messages
 * - Battle-themed design with swords icon
 * - Backdrop blur overlay
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Swords, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { formatVND } from '@/utils/format';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  shopTokens: number;
  growTokens: number;
  isCurrentUser?: boolean;
}

interface Props {
  challengeTarget: LeaderboardEntry | null;
  onClose: () => void;
  calculateGap: (target: LeaderboardEntry) => number;
  MedalIcon: React.ComponentType<{ rank: number }>;
}

export default function LeaderboardChallengeModal({
  challengeTarget,
  onClose,
  calculateGap,
  MedalIcon,
}: Props) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {challengeTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass-ultra rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{t('leaderboard.challengeTitle')}</h2>
                  <p className="text-sm text-orange-100">{t('leaderboard.challengeSubtitle')}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <img
                  src={challengeTarget.avatarUrl}
                  alt={challengeTarget.name}
                  className="w-16 h-16 rounded-full border-4 border-orange-500/50 shadow-lg"
                />
                <div>
                  <p className="font-bold text-white text-lg">{challengeTarget.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MedalIcon rank={challengeTarget.rank} />
                    <span className="text-sm text-white/60">{t('leaderboard.rankLabel', { rank: challengeTarget.rank })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 mb-4 border border-orange-500/30">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 rounded-full p-2 mt-1 shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white mb-2">{t('leaderboard.yourGoal')}</p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {t('leaderboard.goalText', {
                        amount: formatVND(calculateGap(challengeTarget)),
                        name: challengeTarget.name
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                  <span className="text-white/80">{t('leaderboard.motivation1')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  <span className="text-white/80">{t('leaderboard.motivation2')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                  <span className="text-white/80">{t('leaderboard.motivation3')}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all shadow-lg border border-orange-400/30"
              >
                {t('leaderboard.readyToFight')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
