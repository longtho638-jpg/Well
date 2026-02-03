/**
 * Leaderboard Header Stats Component
 * Gradient hero section with stats overview
 * Features:
 * - Trophy icon with title
 * - Three stat cards: highest sales, your position, your GROW tokens
 * - Gradient background with glow effects
 * - Responsive grid layout
 */

import { Trophy, TrendingUp, Zap, Coins } from 'lucide-react';
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
  currentUserEntry: LeaderboardEntry | undefined;
}

export default function LeaderboardHeaderStats({
  top10,
  currentUserEntry,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-teal-500/20 via-teal-600/20 to-teal-500/20 rounded-2xl p-8 text-white mb-6 relative overflow-hidden border border-white/10 backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{t('leaderboard.title')}</h1>
            <p className="text-white/60 text-sm mt-1">
              {t('leaderboard.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              <span className="text-sm font-medium text-white/80">{t('leaderboard.highestSales')}</span>
            </div>
            <p className="text-2xl font-bold">
              {top10[0] ? formatVND(top10[0].shopTokens) : '0 ₫'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-white/80">{t('leaderboard.yourPosition')}</span>
            </div>
            <p className="text-2xl font-bold">
              {currentUserEntry ? (
                currentUserEntry.rank <= 10 ? `#${currentUserEntry.rank}` : t('leaderboard.topHundredPlus')
              ) : (
                t('leaderboard.topHundredPlus')
              )}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-white/80">{t('leaderboard.yourGrowTokens')}</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(currentUserEntry?.growTokens || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
