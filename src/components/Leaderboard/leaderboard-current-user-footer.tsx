/**
 * Leaderboard Current User Footer Component
 * Sticky footer displaying current user when outside top 10
 * Features:
 * - Gradient background with glassmorphism
 * - User rank badge
 * - SHOP and GROW token displays
 * - Motivational text
 * - Sticky positioning at bottom
 */

import { motion } from 'framer-motion';
import { Zap, TrendingUp, Coins } from 'lucide-react';
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
  currentUserEntry: LeaderboardEntry;
}

export default function LeaderboardCurrentUserFooter({
  currentUserEntry,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 bg-gradient-to-r from-teal-600/50 via-teal-500/50 to-teal-600/50 rounded-2xl shadow-2xl overflow-hidden sticky bottom-4 backdrop-blur-xl border border-white/20"
    >
      <div className="bg-white/5 backdrop-blur-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-sm uppercase tracking-wide">
                {t('leaderboard.yourPosition')}
              </span>
            </div>
            <span className="text-white/60 text-xs">
              {t('leaderboard.toTop10', { count: currentUserEntry.rank - 10 })}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Rank */}
            <div className="col-span-1 flex justify-center">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-yellow-400">
                <span className="text-lg font-bold text-yellow-400">
                  #{currentUserEntry.rank}
                </span>
              </div>
            </div>

            {/* Partner Info */}
            <div className="col-span-5 flex items-center gap-3">
              <img
                src={currentUserEntry.avatarUrl}
                alt={currentUserEntry.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate flex items-center gap-2">
                  {currentUserEntry.name}
                  <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full font-semibold">
                    {t('leaderboard.you')}
                  </span>
                </p>
                <p className="text-xs text-white/60">{t('leaderboard.keepPushing')}</p>
              </div>
            </div>

            {/* SHOP Tokens */}
            <div className="col-span-3 text-right">
              <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-md border border-white/10">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold text-sm">
                  {formatVND(currentUserEntry.shopTokens)}
                </span>
              </div>
            </div>

            {/* GROW Tokens */}
            <div className="col-span-3 text-right">
              <div className="inline-flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md border border-white/10">
                <Coins className="w-4 h-4" />
                <span className="font-bold text-sm">
                  {formatNumber(currentUserEntry.growTokens)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
