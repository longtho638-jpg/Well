import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Coins, Zap, Crown } from 'lucide-react';
import { useStore } from '@/store';
import { formatVND, formatNumber } from '@/utils/format';

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
  const { user } = useStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-amber-50 p-6 relative overflow-hidden">
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
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-teal-600 to-primary rounded-2xl p-8 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Trophy className="w-10 h-10 text-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Bảng Xếp Hạng</h1>
                <p className="text-teal-100 text-sm mt-1">
                  Top 10 Partners xuất sắc nhất tháng này
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-teal-100">Doanh số cao nhất</span>
                </div>
                <p className="text-2xl font-bold">
                  {top10[0] ? formatVND(top10[0].shopTokens) : '0 ₫'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium text-teal-100">Vị trí của bạn</span>
                </div>
                <p className="text-2xl font-bold">
                  #{currentUserEntry?.rank || 'N/A'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-teal-100">GROW Tokens của bạn</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(currentUserEntry?.growTokens || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-teal-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-bold text-gray-600 uppercase tracking-wide">
              <div className="col-span-1 text-center">Hạng</div>
              <div className="col-span-5">Partner</div>
              <div className="col-span-3 text-right">SHOP (Doanh số)</div>
              <div className="col-span-3 text-right">GROW (Token)</div>
            </div>
          </div>

          {/* Table Body - Top 10 */}
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {top10.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`px-6 py-5 hover:bg-gray-50 transition-all duration-200 ${
                    entry.isCurrentUser
                      ? 'bg-gradient-to-r from-primary/5 via-teal-50/50 to-accent/5 border-l-4 border-primary shadow-inner'
                      : ''
                  } ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent' : ''}`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
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
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                        {entry.rank <= 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                            <Trophy className="w-3 h-3 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-semibold">
                              Bạn
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">Partner ID: {entry.userId}</p>
                      </div>
                    </div>

                    {/* SHOP Tokens (Sales) */}
                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-teal-600 text-white px-4 py-2 rounded-lg shadow-md">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold text-sm">
                          {formatVND(entry.shopTokens)}
                        </span>
                      </div>
                    </div>

                    {/* GROW Tokens (Rewards) */}
                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-yellow-500 text-primary px-4 py-2 rounded-lg shadow-md">
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
            className="mt-6 bg-gradient-to-r from-primary via-teal-600 to-primary rounded-2xl shadow-2xl overflow-hidden sticky bottom-4"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="font-bold text-sm uppercase tracking-wide">
                      Vị trí của bạn
                    </span>
                  </div>
                  <span className="text-white/60 text-xs">
                    Còn {currentUserEntry.rank - 10} vị trí nữa để lọt Top 10!
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-accent">
                      <span className="text-lg font-bold text-accent">
                        #{currentUserEntry.rank}
                      </span>
                    </div>
                  </div>

                  {/* Partner Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <img
                      src={currentUserEntry.avatarUrl}
                      alt={currentUserEntry.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-accent shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate flex items-center gap-2">
                        {currentUserEntry.name}
                        <span className="text-xs bg-accent text-primary px-2 py-0.5 rounded-full font-semibold">
                          Bạn
                        </span>
                      </p>
                      <p className="text-xs text-white/60">Keep pushing! 💪</p>
                    </div>
                  </div>

                  {/* SHOP Tokens */}
                  <div className="col-span-3 text-right">
                    <div className="inline-flex items-center gap-2 bg-white/90 text-primary px-4 py-2 rounded-lg shadow-md">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold text-sm">
                        {formatVND(currentUserEntry.shopTokens)}
                      </span>
                    </div>
                  </div>

                  {/* GROW Tokens */}
                  <div className="col-span-3 text-right">
                    <div className="inline-flex items-center gap-2 bg-accent text-primary px-4 py-2 rounded-lg shadow-md">
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
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">💡 Lưu ý:</span> Bảng xếp hạng được cập nhật
              theo thời gian thực. SHOP tokens tính theo tổng doanh số bán hàng, GROW tokens
              là phần thưởng hiệu suất.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
