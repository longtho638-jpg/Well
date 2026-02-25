import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import LeaderboardHeaderStats from '@/components/Leaderboard/leaderboard-header-stats';
import LeaderboardRankingTable from '@/components/Leaderboard/leaderboard-ranking-table';
import LeaderboardCurrentUserFooter from '@/components/Leaderboard/leaderboard-current-user-footer';
import LeaderboardChallengeModal from '@/components/Leaderboard/leaderboard-challenge-modal';
import LeaderboardConfettiParticle from '@/components/Leaderboard/leaderboard-confetti-particle';
import LeaderboardMedalIcon from '@/components/Leaderboard/leaderboard-medal-icon';
import LeaderboardInfoFooter from '@/components/Leaderboard/leaderboard-info-footer';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  shopTokens: number; // SHOP tokens (sales revenue)
  growTokens: number; // GROW tokens (rewards)
  isCurrentUser?: boolean;
}

// Seeded variance per person index — stable across renders (deterministic)
const SHOP_VARIANCE = Array.from({ length: 15 }, (_, i) => 0.9 + ((i * 17 + 7) % 20) / 100);
const GROW_VARIANCE = Array.from({ length: 15 }, (_, i) => 0.9 + ((i * 13 + 3) % 20) / 100);

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
    shopTokens: Math.floor((150000000 - index * 8000000) * SHOP_VARIANCE[index]),
    growTokens: Math.floor((5000 - index * 200) * GROW_VARIANCE[index]),
    isCurrentUser: false,
  }));

  // Find current user and mark them
  const currentUserIndex = leaderboard.findIndex(entry => entry.userId === currentUserId);
  if (currentUserIndex !== -1) {
    leaderboard[currentUserIndex].isCurrentUser = true;
  }

  return leaderboard;
};

export default function Leaderboard() {
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
            <LeaderboardConfettiParticle key={i} delay={i * 0.05} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto relative z-10"
      >
        {/* Header */}
        <LeaderboardHeaderStats
          top10={top10}
          currentUserEntry={currentUserEntry}
        />

        {/* Leaderboard Table */}
        <LeaderboardRankingTable
          top10={top10}
          onChallenge={handleChallenge}
          currentUserEntry={currentUserEntry}
          MedalIcon={LeaderboardMedalIcon}
        />

        {/* Current User Footer (if not in top 10) */}
        {currentUserEntry && !currentUserInTop10 && (
          <LeaderboardCurrentUserFooter currentUserEntry={currentUserEntry} />
        )}

        {/* Info Footer */}
        <LeaderboardInfoFooter />
      </motion.div>

      {/* Challenge Popup Modal */}
      <LeaderboardChallengeModal
        challengeTarget={challengeTarget}
        onClose={() => setChallengeTarget(null)}
        calculateGap={calculateGap}
        MedalIcon={LeaderboardMedalIcon}
      />
    </div>
  );
}
