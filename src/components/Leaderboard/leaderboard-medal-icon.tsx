/**
 * Leaderboard Medal Icon Component
 * Displays rank badges for leaderboard entries
 * Features:
 * - Crown for rank 1 (gold)
 * - Medal for rank 2 (silver)
 * - Award for rank 3 (bronze)
 * - Number badge for rank 4+
 * - Glow effects for top 3
 */

import { Crown, Medal, Award } from 'lucide-react';

interface Props {
  rank: number;
}

export default function LeaderboardMedalIcon({ rank }: Props) {
  if (rank === 1) {
    return (
      <div className="relative">
        <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
        <div className="absolute inset-0 bg-yellow-400 opacity-20 blur-md rounded-full" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative">
        <Medal className="w-7 h-7 text-gray-400 drop-shadow-lg" />
        <div className="absolute inset-0 bg-gray-400 opacity-20 blur-md rounded-full" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="relative">
        <Award className="w-7 h-7 text-amber-600 drop-shadow-lg" />
        <div className="absolute inset-0 bg-amber-600 opacity-20 blur-md rounded-full" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <span className="text-lg font-bold text-gray-400">#{rank}</span>
    </div>
  );
}
