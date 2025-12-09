import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Coins, Zap, Crown, Swords } from 'lucide-react';
import { useStore } from '@/store';
import { formatVND, formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  shopTokens: number; // SHOP tokens (sales revenue)
  growTokens: number; // GROW tokens (rewards)
  isCurrentUser?: boolean;
}

// Mock leaderboard data
const generateMockLeaderboard = (currentUserId: string): LeaderboardEntry[] => {
  const names = [
    { name: 'Nguyễn Văn Minh', avatar: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Trần Thị Hương', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Lê Quang Hải', avatar: 'https://i.pravatar.cc/150?img=33' },
    { name: 'Phạm Thu Hà', avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Hoàng Minh Tuấn', avatar: 'https://i.pravatar.cc/150?img=15' },
    { name: 'Đỗ Thị Lan', avatar: 'https://i.pravatar.cc/150?img=23' },
    { name: 'Vũ Công Phượng', avatar: 'https://i.pravatar.cc/150?img=52' },
    { name: 'Ngô Thị Mai', avatar: 'https://i.pravatar.cc/150?img=44' },
    { name: 'Bùi Văn Toàn', avatar: 'https://i.pravatar.cc/150?img=56' },
    { name: 'Đinh Thị Ngọc', avatar: 'https://i.pravatar.cc/150?img=47' },
    { name: 'Phan Văn Đức', avatar: 'https://i.pravatar.cc/150?img=68' },
    { name: 'Lý Thị Kim', avatar: 'https://i.pravatar.cc/150?img=31' },
    { name: 'Trịnh Văn Quyết', avatar: 'https://i.pravatar.cc/150?img=59' },
    { name: 'Võ Thị Sáu', avatar: 'https://i.pravatar.cc/150?img=26' },
    { name: 'Mai Văn Thành', avatar: 'https://i.pravatar.cc/150?img=70' },
  ];

  const leaderboard: LeaderboardEntry[] = names.map((person, index) => ({
    rank: index + 1,
    userId: `user-${index + 1}`,
    name: person.name,
    avatarUrl: person.avatar,
    shopTokens: Math.floor((150000000 - index * 8000000) * (0.9 + Math.random() * 0.2)),
    growTokens: Math.floor((5000 - index * 200) * (0.9 + Math.random() * 0.2)),
    isCurrentUser: false,
  }));

  // Find current user and mark them
  const currentUserIndex = leaderboard.findIndex(entry => entry.userId === currentUserId);
  if (currentUserIndex !== -1) {
    leaderboard[currentUserIndex].isCurrentUser = true;
  }

  return leaderboard;
};

// Confetti particle component
const ConfettiParticle = ({ delay }: { delay: number }) => {
  const colors = ['#00575A', '#FFBF00', '#FF6B6B', '#4ECDC4', '#95E1D3'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 1, rotate: 0 }}
      animate={{
        y: '100vh',
        rotate: randomRotation,
        opacity: 0,
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: 'easeIn',
      }}
      className="absolute w-3 h-3 pointer-events-none"
      style={{
        backgroundColor: randomColor,
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
      }}
    />
  );
};

// Medal component for top 3
const MedalIcon = ({ rank }: { rank: number }) => {
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
};

export default function Leaderboard() {
  const t = useTranslation();
  const { user } = useStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [challengeTarget, setChallengeTarget] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    // Generate leaderboard with current user
    const data = generateMockLeaderboard(user.id);
    setLeaderboardData(data);

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [user.id]);

  // Get top 10
  const top10 = leaderboardData.slice(0, 10);

  // Find current user
  const currentUserEntry = leaderboardData.find(entry => entry.isCurrentUser);
  const currentUserInTop10 = currentUserEntry && currentUserEntry.rank <= 10;

  // Calculate gap to target
  const handleChallenge = (target: LeaderboardEntry) => {
    setChallengeTarget(target);
  };

  const calculateGap = (targetEntry: LeaderboardEntry) => {
    if (!currentUserEntry) return 5000000;
    const gap = targetEntry.shopTokens - currentUserEntry.shopTokens;
    return Math.max(gap, 0);
  };

  return (
    <div className="min-h-screen bg-dark-ultra p-6 relative overflow-hidden">
      <ParticleBackground />
      <CursorGlow />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.05} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto relative z-10"
      >
        {/* Header */}
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

        {/* Leaderboard Table */}
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
                              onClick={() => handleChallenge(entry)}
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

        {/* Current User Footer (if not in top 10) */}
        {currentUserEntry && !currentUserInTop10 && (
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
        )}

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-sm text-white/60">
              <span className="font-semibold text-white">{t('leaderboard.noteLabel')}</span> {t('leaderboard.noteText')}
            </p>
            <p className="text-xs text-white/40 mt-2">
              {t('leaderboard.lastUpdate', { time: new Date().toLocaleString('vi-VN') })}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Challenge Popup Modal */}
      <AnimatePresence>
        {challengeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setChallengeTarget(null)}
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
                  onClick={() => setChallengeTarget(null)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all shadow-lg border border-orange-400/30"
                >
                  {t('leaderboard.readyToFight')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
