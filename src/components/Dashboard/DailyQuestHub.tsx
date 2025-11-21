import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Coins,
  Sunrise,
  Share2,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { useTranslation } from '../../hooks';

// Daily Quest Interface with navigation
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward: number; // GROW tokens
  icon: React.ElementType;
  status: 'done' | 'ready' | 'claimable';
  navigationPath?: string; // Where to navigate when "Go" is clicked
  color: string;
  bgGradient: string;
}

// Function to get daily quests data with translations
const getDailyQuestsData = (t: (key: string) => string): DailyQuest[] => [
  {
    id: 'daily-1',
    title: t('dashboard.dailyQuest.quests.dailyCheckIn.title'),
    description: t('dashboard.dailyQuest.quests.dailyCheckIn.description'),
    reward: 50,
    icon: Sunrise,
    status: 'done',
    color: 'text-green-600',
    bgGradient: 'from-green-400 to-emerald-500'
  },
  {
    id: 'daily-2',
    title: t('dashboard.dailyQuest.quests.shareHealthCheck.title'),
    description: t('dashboard.dailyQuest.quests.shareHealthCheck.description'),
    reward: 100,
    icon: Share2,
    status: 'ready',
    navigationPath: '/dashboard/marketplace', // Navigate to marketplace/marketing tools
    color: 'text-blue-600',
    bgGradient: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'daily-3',
    title: t('dashboard.dailyQuest.quests.watchTraining.title'),
    description: t('dashboard.dailyQuest.quests.watchTraining.description'),
    reward: 75,
    icon: GraduationCap,
    status: 'ready',
    navigationPath: '/dashboard', // Could navigate to learning page in future
    color: 'text-purple-600',
    bgGradient: 'from-purple-400 to-pink-500'
  }
];

interface TokenFlyAnimationProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

const TokenFlyAnimation: React.FC<TokenFlyAnimationProps> = ({ startX, startY, onComplete }) => {
  return (
    <motion.div
      initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
      animate={{
        x: window.innerWidth - 100, // Fly to top-right (wallet area)
        y: -100,
        opacity: 0,
        scale: 0.3
      }}
      transition={{
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1]
      }}
      onAnimationComplete={onComplete}
      className="fixed z-50 pointer-events-none"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl">
        <Coins className="w-6 h-6 text-white" />
      </div>
    </motion.div>
  );
};

export const DailyQuestHub: React.FC = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<DailyQuest[]>(() => getDailyQuestsData(t));
  const [flyingTokens, setFlyingTokens] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [claimedToday, setClaimedToday] = useState(0);

  const handleQuestAction = (quest: DailyQuest, event: React.MouseEvent) => {
    if (quest.status === 'ready' && quest.navigationPath) {
      // Navigate to the appropriate page
      navigate(quest.navigationPath);

      // Simulate quest completion after navigation
      // In real app, this would be triggered when user returns
      setTimeout(() => {
        setQuests(prev => prev.map(q =>
          q.id === quest.id ? { ...q, status: 'claimable' as const } : q
        ));
      }, 2000);
    } else if (quest.status === 'claimable') {
      // Claim reward - trigger token animation
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();

      const newToken = {
        id: `token-${Date.now()}`,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      setFlyingTokens(prev => [...prev, newToken]);

      // Update quest status to done
      setQuests(prev => prev.map(q =>
        q.id === quest.id ? { ...q, status: 'done' as const } : q
      ));

      setClaimedToday(prev => prev + quest.reward);
    }
  };

  const handleTokenAnimationComplete = (tokenId: string) => {
    setFlyingTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  const completedCount = quests.filter(q => q.status === 'done').length;
  const totalRewards = quests.reduce((sum, q) => sum + (q.status === 'done' ? q.reward : 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg"
            >
              <Target className="w-5 h-5 text-amber-600" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {t('dashboard.dailyQuest.title')}
                {completedCount === quests.length && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-xs bg-white text-amber-600 px-2 py-0.5 rounded-full font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    {t('dashboard.dailyQuest.completedAll')}
                  </motion.span>
                )}
              </h3>
              <p className="text-xs text-white/90">
                {t('dashboard.dailyQuest.questsProgress', { completed: completedCount, total: quests.length })} • {t('dashboard.dailyQuest.tokensEarned', { amount: formatNumber(totalRewards) })}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1 text-white"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-lg font-bold">+{formatNumber(totalRewards)}</span>
            </motion.div>
            <p className="text-xs text-white/80">{t('dashboard.dailyQuest.tokensToday')}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Quest Cards */}
      <div className="p-6">
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {quests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[280px] snap-start"
            >
              <div className={`
                relative bg-white rounded-xl border-2 shadow-lg overflow-hidden
                transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                ${quest.status === 'done' ? 'border-green-300 opacity-90' : 'border-gray-200'}
              `}>
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${quest.bgGradient}`} />

                {/* Content */}
                <div className="p-5">
                  {/* Icon & Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      bg-gradient-to-br ${quest.bgGradient} shadow-md
                    `}>
                      <quest.icon className="w-6 h-6 text-white" />
                    </div>

                    {quest.status === 'done' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="bg-green-500 text-white rounded-full p-1"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.div>
                    )}
                  </div>

                  {/* Quest Info */}
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">
                    {quest.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {quest.description}
                  </p>

                  {/* Reward Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 px-3 py-1.5 rounded-full">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-700">
                        +{formatNumber(quest.reward)} GROW
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {quest.status === 'done' ? (
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-lg font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('dashboard.dailyQuest.questCompleted')}</span>
                    </div>
                  ) : quest.status === 'ready' ? (
                    <button
                      onClick={(e) => handleQuestAction(quest, e)}
                      className={`
                        w-full py-3 rounded-lg font-bold text-white
                        bg-gradient-to-r ${quest.bgGradient}
                        hover:shadow-lg hover:scale-105
                        transition-all duration-200
                        flex items-center justify-center gap-2 group
                      `}
                    >
                      <span>{t('dashboard.dailyQuest.startQuest')}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <motion.button
                      onClick={(e) => handleQuestAction(quest, e)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>{t('dashboard.dailyQuest.claim')}</span>
                    </motion.button>
                  )}
                </div>

                {/* Completion Confetti Effect */}
                {quest.status === 'done' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: '50%', x: '50%', opacity: 1, scale: 1 }}
                        animate={{
                          y: ['50%', '-100%'],
                          x: `${50 + (Math.random() - 0.5) * 100}%`,
                          opacity: [1, 0],
                          scale: [1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                        className="absolute"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {quests.map((quest, index) => (
            <motion.div
              key={quest.id}
              animate={{
                scale: quest.status === 'done' ? 1 : 0.8,
                backgroundColor: quest.status === 'done' ? '#10b981' : '#d1d5db'
              }}
              className="w-2 h-2 rounded-full transition-colors"
            />
          ))}
        </div>
      </div>

      {/* Flying Token Animations */}
      <AnimatePresence>
        {flyingTokens.map(token => (
          <TokenFlyAnimation
            key={token.id}
            startX={token.x}
            startY={token.y}
            onComplete={() => handleTokenAnimationComplete(token.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
