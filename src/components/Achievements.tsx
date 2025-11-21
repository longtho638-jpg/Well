import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useStore } from '../store';
import { Achievement } from '../types';

export default function Achievements() {
  const { achievements, user } = useStore();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-gradient-to-br from-orange-400 to-orange-600';
      case 'silver':
        return 'bg-gradient-to-br from-gray-300 to-gray-500';
      case 'gold':
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'bg-gradient-to-br from-purple-400 to-purple-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <p className="text-gray-600 mt-1">
            Unlocked {unlockedCount} of {totalCount}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{user.level}</div>
          <div className="text-sm text-gray-600">Level</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-primary">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full"
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => {
          const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;
          const progress = achievement.isUnlocked
            ? 100
            : (achievement.progress / achievement.requirement) * 100;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.isUnlocked
                  ? 'border-accent bg-gradient-to-br from-amber-50 to-white'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    achievement.isUnlocked ? getTierColor(achievement.tier) : 'bg-gray-300'
                  } ${!achievement.isUnlocked && 'opacity-50'}`}
                >
                  <IconComponent size={32} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`font-semibold ${
                        achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getTierBadge(
                        achievement.tier
                      )}`}
                    >
                      {achievement.tier}
                    </span>
                  </div>

                  <p
                    className={`text-sm mb-2 ${
                      achievement.isUnlocked ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {!achievement.isUnlocked && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">
                          {achievement.progress.toLocaleString()} / {achievement.requirement.toLocaleString()}
                        </span>
                        <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.isUnlocked && achievement.unlockedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <Icons.Check size={14} className="text-green-600" />
                      Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-semibold">
                    <Icons.Sparkles size={14} />
                    +{achievement.reward} XP
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
