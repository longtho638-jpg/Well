import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Award,
  Crown,
  Target,
  Activity,
  DollarSign,
  Brain,
  Zap,
} from 'lucide-react';
const NetworkTree = lazy(() => import('@/components/NetworkTree'));
import { StatCard, TeamTable, PerformanceChart } from '@/components/LeaderDashboard';
import LeaderboardTop3PerformersPodium from '@/components/LeaderDashboard/leaderboard-top-3-performers-podium';
import InsightsRiskOverviewCards from '@/components/LeaderDashboard/insights-risk-overview-cards';
import AtRiskMembersListWithActions from '@/components/LeaderDashboard/at-risk-members-list-with-actions';
import { formatVND } from '@/utils/format';
import { useLeaderDashboardTeamFiltersAndActions } from './LeaderDashboard/use-leader-dashboard-team-filters-and-actions';

function LeaderDashboard() {
  const {
    t,
    teamInsights,
    teamMetrics,
    filteredMembers,
    top3Performers,
    networkHealthData,
    rankDistribution,
    searchTerm, setSearchTerm,
    filterRank, setFilterRank,
    sortBy, setSortBy,
    activeTab, setActiveTab,
    actionLoading,
    getRankBadgeColor,
    getGrowthColor,
    handleSendReminder,
    handleSendGift,
    RANK_NAMES,
    UserRank,
  } = useLeaderDashboardTeamFiltersAndActions();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6 pb-20 transition-colors duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-zinc-900 to-black rounded-3xl" />
        <div className="relative p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">{t('team.leaderDashboard')}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('team.subtitle')}</p>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 max-w-2xl mt-2">{t('team.description')}</p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-2 flex gap-2 border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'team'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
            : 'text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          <Users className="w-5 h-5" />
          {t('leaderdashboard.qu_n_l_i_nh_m')}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'insights'
            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10'
            : 'text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          <Brain className="w-5 h-5" />
          {t('leaderdashboard.ai_insights')}
          {teamInsights.highRiskCount > 0 && (
            <span className="bg-white text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {teamInsights.highRiskCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'tree'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
            : 'text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          <Zap className="w-5 h-5" />
          {t('leaderdashboard.s_h_th_ng')}
        </button>
      </motion.div>

      {/* Team Tab */}
      {activeTab === 'team' && (
        <>
          <LeaderboardTop3PerformersPodium top3Performers={top3Performers} />

          <div className="grid md:grid-cols-4 gap-4">
            <StatCard icon={Users} iconColor="text-blue-400" value={teamMetrics.totalMembers} label={t('team.metrics.totalMembers')} delay={0.3}
              gradientFrom="from-blue-500/10" gradientTo="to-blue-600/10"
              badge={<span className="text-xs font-bold bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">{teamMetrics.activeMembers}/{teamMetrics.totalMembers} {t('team.metrics.active')}</span>} />
            <StatCard icon={DollarSign} iconColor="text-emerald-400" value={formatVND(teamMetrics.totalTeamVolume)} label={t('team.metrics.teamVolume')} delay={0.4}
              gradientFrom="from-emerald-500/10" gradientTo="to-emerald-600/10" badge={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
            <StatCard icon={Target} iconColor="text-purple-400" value={formatVND(teamMetrics.averageSalesPerMember)} label={t('team.metrics.averageSales')} delay={0.5}
              gradientFrom="from-purple-500/10" gradientTo="to-purple-600/10"
              badge={<span className="text-xs font-bold bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20">+{teamMetrics.monthlyGrowth}%</span>} />
            <StatCard icon={Award} iconColor="text-orange-400" value={teamMetrics.topPerformers.length} label={t('team.metrics.topPerformers')} delay={0.6}
              gradientFrom="from-orange-500/10" gradientTo="to-orange-600/10" badge={<Activity className="w-5 h-5 text-orange-400" />} />
          </div>

          <PerformanceChart networkHealthData={networkHealthData} rankDistribution={rankDistribution} />

          <TeamTable
            filteredMembers={filteredMembers}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filterRank={filterRank} setFilterRank={setFilterRank}
            sortBy={sortBy} setSortBy={setSortBy}
            getRankBadgeColor={getRankBadgeColor}
            getGrowthColor={getGrowthColor}
          />
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <InsightsRiskOverviewCards teamInsights={teamInsights} />
          <AtRiskMembersListWithActions
            atRiskMembers={teamInsights.atRiskMembers}
            actionLoading={actionLoading}
            onSendReminder={handleSendReminder}
            onSendGift={handleSendGift}
          />
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00575A] focus:border-transparent outline-none"
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value === 'all' ? 'all' : Number(e.target.value) as typeof UserRank[keyof typeof UserRank])}
          >
            <option value="all">{t('leaderdashboard.all_ranks')}</option>
            <option value={UserRank.THIEN_LONG}>{t(RANK_NAMES[UserRank.THIEN_LONG])}</option>
            <option value={UserRank.PHUONG_HOANG}>{t(RANK_NAMES[UserRank.PHUONG_HOANG])}</option>
            <option value={UserRank.DAI_SU}>{t(RANK_NAMES[UserRank.DAI_SU])}</option>
            <option value={UserRank.KHOI_NGHIEP}>{t(RANK_NAMES[UserRank.KHOI_NGHIEP])}</option>
            <option value={UserRank.CTV}>{t(RANK_NAMES[UserRank.CTV])}</option>
          </select>
        </motion.div>
      )}

      {/* Network Tree Tab */}
      {activeTab === 'tree' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-400">Đang tải sơ đồ...</div>}>
            <NetworkTree />
          </Suspense>
        </motion.div>
      )}
    </div>
  );
}

export default React.memo(LeaderDashboard);
