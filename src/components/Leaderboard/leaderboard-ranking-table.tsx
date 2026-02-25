/**
 * Leaderboard Ranking Table Component
 * Displays top 10 ranked partners with animations
 * Features:
 * - Medal icons for top 3
 * - Animated rows with stagger effect
 * - Current user highlighting
 * - Challenge button for competitors
 * - SHOP and GROW token displays
 * - Responsive grid layout
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Coins, Swords } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { formatVND, formatNumber } from '@/utils/format';

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
  top10: LeaderboardEntry[];
  onChallenge: (entry: LeaderboardEntry) => void;
  currentUserEntry: LeaderboardEntry | undefined;
  MedalIcon: React.ComponentType<{ rank: number }>;
}

export default function LeaderboardRankingTable({
  top10,
  onChallenge,
  currentUserEntry,
  MedalIcon,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="glass-ultra rounded-2xl shadow-2xl overflow-hidden">
      {/* Table Header */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-4">
        <div className="grid grid-cols-12 gap-4 items-center text-sm font-bold text-white/60 uppercase tracking-wide">
          <div className="col-span-1 text-center">{t('leaderboard.rank')}</div>
          <div className="col-span-5">{t('leaderboard.partner')}</div>
          <div className="col-span-3 text-right">{t('leaderboard.shopSales')}</div>
          <div className="col-span-3 text-right">{t('leaderboard.growToken')}</div>
        </div>
      </div>

      {/* Table Body - Top 10 */}
      <div className="divide-y divide-white/10">
        <AnimatePresence>
          {top10.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: entry.rank <= 3 ? [1, 1.01, 1] : 1
              }}
              transition={{
                delay: index * 0.05,
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
              className={`px-6 py-5 hover:bg-white/5 transition-all duration-200 ${
                entry.isCurrentUser
                  ? 'bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border-l-4 border-teal-500'
                  : ''
              } ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent relative' : ''}`}
            >
              {/* Pulse glow effect for top 3 */}
              {entry.rank <= 3 && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/5 via-amber-400/5 to-yellow-400/5"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              <div className="grid grid-cols-12 gap-4 items-center relative z-10">
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  <MedalIcon rank={entry.rank} />
                </div>

                {/* Partner Info */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={entry.avatarUrl}
                      alt={entry.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-md"
                    />
                    {entry.rank <= 3 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white/20 flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white truncate flex items-center gap-2">
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            {t('leaderboard.you')}
                          </span>
                        )}
                      </p>
                      {!entry.isCurrentUser && currentUserEntry && (
                        <button
                          onClick={() => onChallenge(entry)}
                          className="ml-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-md hover:from-orange-600 hover:to-red-600 transition-all shadow-sm flex items-center gap-1"
                        >
                          <Swords className="w-3 h-3" />
                          {t('leaderboard.challenge')}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-white/60">{t('leaderboard.partnerIdLabel', { id: entry.userId })}</p>
                  </div>
                </div>

                {/* SHOP Tokens (Sales) */}
                <div className="col-span-3 text-right">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-2 rounded-lg shadow-md border border-teal-400/30">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-bold text-sm">
                      {formatVND(entry.shopTokens)}
                    </span>
                  </div>
                </div>

                {/* GROW Tokens (Rewards) */}
                <div className="col-span-3 text-right">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg shadow-md border border-yellow-400/30">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold text-sm">
                      {formatNumber(entry.growTokens)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
