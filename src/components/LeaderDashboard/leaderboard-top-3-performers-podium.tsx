import React from 'react';
import { motion } from 'framer-motion';
import { Award, Crown, Star } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { TeamMember } from '@/types';

interface Props {
  top3Performers: TeamMember[];
}

/**
 * Leaderboard Top 3 Performers Podium Component
 * Displays podium-style ranking of top 3 team members by personal sales
 * Features: 1st place (center, scaled), 2nd place (left), 3rd place (right)
 */
export default function LeaderboardTop3PerformersPodium({ top3Performers }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-3xl blur-2xl" />

      {/* Card container */}
      <div className="relative bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-xl">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              {t('leaderdashboard.top_3_tang_tai')}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">{t('leaderdashboard.doanh_s_cao_nhat_thang_nay')}</p>
          </div>
        </div>

        {/* Podium grid */}
        <div className="grid grid-cols-3 gap-6 items-end">
          {/* 2nd Place */}
          {top3Performers[1] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="relative mb-4 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full blur-xl opacity-50" />
                <img
                  src={top3Performers[1].avatarUrl}
                  alt={top3Performers[1].name}
                  className="relative w-24 h-24 rounded-full border-4 border-gray-400 shadow-2xl mx-auto"
                />
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{top3Performers[1].name}</h3>
              <p className="text-zinc-400 text-sm mb-2">{top3Performers[1].rank}</p>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-300 dark:border-zinc-700">
                <p className="text-zinc-400 text-xs mb-1">{t('leaderdashboard.doanh_s')}</p>
                <p className="text-white font-bold">{formatVND(top3Performers[1].personalSales)}</p>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {top3Performers[0] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center transform scale-110"
            >
              <div className="relative mb-4 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full blur-2xl opacity-70 animate-pulse" />
                <img
                  src={top3Performers[0].avatarUrl}
                  alt={top3Performers[0].name}
                  className="relative w-32 h-32 rounded-full border-4 border-yellow-400 shadow-2xl mx-auto ring-4 ring-yellow-400/30"
                />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Crown className="w-10 h-10 text-yellow-400 drop-shadow-2xl animate-pulse" fill="currentColor" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">{top3Performers[0].name}</h3>
              <p className="text-yellow-400 text-sm mb-2 flex items-center justify-center gap-1">
                <Star className="w-4 h-4" fill="currentColor" />
                {top3Performers[0].rank}
              </p>
              <div className="bg-yellow-500/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                <p className="text-yellow-200 text-xs mb-1">{t('leaderdashboard.doanh_s_1')}</p>
                <p className="text-white font-bold text-lg">{formatVND(top3Performers[0].personalSales)}</p>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3Performers[2] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="relative mb-4 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full blur-xl opacity-50" />
                <img
                  src={top3Performers[2].avatarUrl}
                  alt={top3Performers[2].name}
                  className="relative w-24 h-24 rounded-full border-4 border-orange-400 shadow-2xl mx-auto"
                />
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-300 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{top3Performers[2].name}</h3>
              <p className="text-zinc-400 text-sm mb-2">{top3Performers[2].rank}</p>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 border border-zinc-300 dark:border-zinc-700">
                <p className="text-zinc-400 text-xs mb-1">{t('leaderdashboard.doanh_s_2')}</p>
                <p className="text-white font-bold">{formatVND(top3Performers[2].personalSales)}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
