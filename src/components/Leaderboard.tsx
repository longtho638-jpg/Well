import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Award, Medal } from 'lucide-react';
import { useStore } from '../store';
import { formatVND } from '../utils/format';

export default function Leaderboard() {
  const { leaderboard, user } = useStore();

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Award className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-orange-500" size={24} />;
      default:
        return <span className="text-xl font-bold text-gray-600">{position}</span>;
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
          <TrendingUp size={16} />
          <span>+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-sm font-semibold">
          <TrendingDown size={16} />
          <span>{change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Minus size={16} />
          <span>-</span>
        </div>
      );
    }
  };

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'Founder Club':
        return 'bg-gradient-to-r from-purple-600 to-purple-800 text-white';
      case 'Partner':
        return 'bg-gradient-to-r from-blue-600 to-blue-800 text-white';
      case 'Member':
        return 'bg-gradient-to-r from-gray-600 to-gray-800 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-600 rounded-xl flex items-center justify-center">
          <Trophy size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-gray-600">Top performers this month</p>
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const position = index + 1;
          const isCurrentUser = entry.userId === user.id;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                isCurrentUser
                  ? 'border-primary bg-gradient-to-r from-primary/10 to-transparent'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Position */}
                <div className="w-12 flex items-center justify-center">{getRankIcon(position)}</div>

                {/* Avatar */}
                <img
                  src={entry.avatarUrl}
                  alt={entry.userName}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{entry.userName}</h3>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRankBadgeColor(entry.rank)}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm text-gray-600">{formatVND(entry.score)} team volume</span>
                  </div>
                </div>

                {/* Change Indicator */}
                <div className="flex flex-col items-end gap-1">
                  {getChangeIndicator(entry.change)}
                  <div className="flex gap-1">
                    {entry.badges.slice(0, 3).map((badgeId) => (
                      <div
                        key={badgeId}
                        className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center"
                        title="Badge"
                      >
                        <Trophy size={12} className="text-white" />
                      </div>
                    ))}
                    {entry.badges.length > 3 && (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                        +{entry.badges.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Your current position:</span>
          <span className="font-bold text-primary">
            #{leaderboard.findIndex((e) => e.userId === user.id) + 1} of {leaderboard.length}
          </span>
        </div>
      </div>
    </div>
  );
}
