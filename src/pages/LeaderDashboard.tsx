import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Award,
  Filter,
  Search,
  Download,
  Mail,
  Phone,
  MoreVertical,
  Crown,
  Target,
  Activity,
  DollarSign,
  AlertTriangle,
  Brain,
  Bell,
  Gift as GiftIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  Sparkles,
  Zap,
} from 'lucide-react';
import NetworkTree from '@/components/NetworkTree';
import { useStore } from '@/store';
import { TeamMember, UserRank, RANK_NAMES } from '@/types';
import { formatVND, formatNumber } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/hooks';

export default function LeaderDashboard() {
  const { t } = useTranslation();
  const { user, teamInsights, teamMembers, teamMetrics, sendReminder, sendGift, fetchTeamData } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<UserRank | 'all'>('all');
  const [sortBy, setSortBy] = useState<'sales' | 'growth' | 'team'>('sales');

  // Tab management - TREE MAX LEVEL
  const [activeTab, setActiveTab] = useState<'team' | 'insights' | 'tree'>('team');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and sort team members
  const filteredMembers = teamMembers
    .filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = filterRank === 'all' || member.rank === filterRank;
      return matchesSearch && matchesRank;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sales':
          return b.personalSales - a.personalSales;
        case 'growth':
          return b.monthlyGrowth - a.monthlyGrowth;
        case 'team':
          return b.teamVolume - a.teamVolume;
        default:
          return 0;
      }
    });

  // Top 3 performers
  const top3Performers = [...teamMembers]
    .sort((a, b) => b.personalSales - a.personalSales)
    .slice(0, 3);

  // Chart data
  const performanceData = teamMembers.slice(0, 5).map(m => ({
    name: m.name.split(' ').pop(),
    sales: m.personalSales / 1000000,
    team: m.teamVolume / 1000000
  }));

  // Network Health Data
  const activeCount = teamMembers.filter(m => m.monthlyGrowth > 0).length;
  const inactiveCount = teamMembers.length - activeCount;

  const networkHealthData = [
    { name: 'Active', value: activeCount, color: '#10B981' },
    { name: 'At Risk', value: Math.floor(teamMembers.length * 0.15), color: '#F59E0B' },
    { name: 'Inactive', value: inactiveCount - Math.floor(teamMembers.length * 0.15), color: '#EF4444' }
  ];

  const rankDistribution = [
    { name: 'Đại Sứ', value: teamMembers.filter(m => m.rank === UserRank.DAI_SU).length, color: '#00575A' },
    { name: 'CTV', value: teamMembers.filter(m => m.rank === UserRank.CTV).length, color: '#FFBF00' }
  ];

  const getRankBadgeColor = (rank: UserRank) => {
    switch (rank) {
      case UserRank.THIEN_LONG:
      case UserRank.PHUONG_HOANG:
        return 'bg-purple-100 text-purple-700';
      case UserRank.DAI_SU_DIAMOND:
      case UserRank.DAI_SU_GOLD:
      case UserRank.DAI_SU_SILVER:
      case UserRank.DAI_SU:
        return 'bg-blue-100 text-blue-700';
      case UserRank.KHOI_NGHIEP:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };


  const getGrowthColor = (growth: number) => {
    if (growth >= 30) return 'text-green-600';
    if (growth >= 15) return 'text-blue-600';
    return 'text-gray-600';
  };

  // AI Insights Handlers - TREE MAX LEVEL
  const handleSendReminder = async (memberId: string) => {
    setActionLoading(`reminder-${memberId}`);
    try {
      await sendReminder(memberId);
      alert('Đã gửi tin nhắn nhắc nhở thành công!');
    } catch (error) {
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendGift = async (memberId: string) => {
    setActionLoading(`gift-${memberId}`);
    try {
      await sendGift(memberId, 200000); // 200k VND voucher
      alert('Đã tặng voucher 200.000đ thành công!');
    } catch (error) {
      alert('Tặng quà thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskBadgeColor = (riskLevel: 'high' | 'medium' | 'low') => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6 pb-20 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-zinc-900 to-black rounded-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        {/* Content */}
        <div className="relative p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">{t('team.leaderDashboard')}</h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('team.subtitle')}</p>
                </div>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 max-w-2xl mt-2">
                {t('team.description')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation - TREE MAX LEVEL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-2 flex gap-2 border border-zinc-200 dark:border-zinc-800"
      >
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'team'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
            : 'text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800'
            }`}
        >
          <Users className="w-5 h-5" />
          {t('leaderdashboard.qu_n_l_i_nh_m')}</button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'insights'
            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10'
            : 'text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800'
            }`}
        >
          <Brain className="w-5 h-5" />
          {t('leaderdashboard.ai_insights')}{teamInsights.highRiskCount > 0 && (
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
          {t('leaderdashboard.s_h_th_ng')}</button>
      </motion.div>

      {activeTab === 'team' && (
        <>
          {/* Top 3 Leaderboard - Podium Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-3xl blur-2xl" />

            {/* Card */}
            <div className="relative bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-xl">
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    {t('leaderdashboard.top_3_t_ng_t_i')}</h2>
                  <p className="text-zinc-400 text-sm mt-1">{t('leaderdashboard.doanh_s_cao_nh_t_th_ng_n_y')}</p>
                </div>
              </div>

              {/* Podium */}
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

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-xs font-bold bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
                    {teamMetrics.activeMembers}/{teamMetrics.totalMembers} {t('team.metrics.active')}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{teamMetrics.totalMembers}</h3>
                <p className="text-sm text-zinc-400">{t('team.metrics.totalMembers')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{formatVND(teamMetrics.totalTeamVolume)}</h3>
                <p className="text-sm text-zinc-400">{t('team.metrics.teamVolume')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <Target className="w-8 h-8 text-purple-400" />
                  <span className="text-xs font-bold bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20">
                    +{teamMetrics.monthlyGrowth}%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{formatVND(teamMetrics.averageSalesPerMember)}</h3>
                <p className="text-sm text-zinc-400">{t('team.metrics.averageSales')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-orange-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-8 h-8 text-orange-400" />
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{teamMetrics.topPerformers.length}</h3>
                <p className="text-sm text-zinc-400">{t('team.metrics.topPerformers')}</p>
              </div>
            </motion.div>
          </div>

          {/* Charts - Network Health & Rank Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Network Health - Donut Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  {t('leaderdashboard.network_health')}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={networkHealthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {networkHealthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4">
                  {networkHealthData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-400 text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Rank Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  {t('team.charts.rankDistribution')}
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={rankDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {rankDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Team Members Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-zinc-800">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {t('team.members.teamMembers')} ({filteredMembers.length})
                    </h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('team.members.search')}
                        className="pl-9 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm"
                      />
                    </div>

                    {/* Filter by Rank */}
                    <select
                      value={filterRank}
                      onChange={(e) => setFilterRank(e.target.value as UserRank | 'all')}
                      className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm"
                    >
                      <option value="all" className="bg-zinc-900">{t('team.filters.allRanks')}</option>
                      <option value="Partner" className="bg-zinc-900">{t('leaderdashboard.partner')}</option>
                      <option value="Member" className="bg-zinc-900">{t('leaderdashboard.member')}</option>
                    </select>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'sales' | 'growth' | 'team')}
                      className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm"
                    >
                      <option value="sales" className="bg-zinc-900">{t('team.filters.sortSales')}</option>
                      <option value="growth" className="bg-zinc-900">{t('team.filters.sortGrowth')}</option>
                      <option value="team" className="bg-zinc-900">{t('team.filters.sortTeam')}</option>
                    </select>

                    {/* Export */}
                    <button className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30">
                      <Download className="w-4 h-4" />
                      {t('team.filters.export')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.member')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.rank')}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.personalSales')}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.teamVolume')}</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.downlines')}</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.growth')}</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('team.members.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredMembers.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-zinc-100 dark:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-10 h-10 rounded-full ring-2 ring-white/20"
                            />
                            <div>
                              <p className="font-medium text-white">{member.name}</p>
                              <p className="text-xs text-zinc-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(member.rank)}`}>
                            {RANK_NAMES[member.rank]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">
                          {formatVND(member.personalSales)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">
                          {formatVND(member.teamVolume)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-zinc-300">{member.activeDownlines}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-bold ${getGrowthColor(member.monthlyGrowth)}`}>
                            +{member.monthlyGrowth}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-all duration-200 group" title={t('team.actions.sendEmail')}>
                              <Mail className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors duration-200" />
                            </button>
                            <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-all duration-200 group" title={t('team.actions.call')}>
                              <Phone className="w-4 h-4 text-zinc-400 group-hover:text-green-400 transition-colors duration-200" />
                            </button>
                            <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-all duration-200 group" title={t('team.actions.moreActions')}>
                              <MoreVertical className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors duration-200" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* AI Insights Tab - TREE MAX LEVEL */}
      {activeTab === 'insights' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Insights Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-4xl font-bold mb-1">{teamInsights.highRiskCount}</h3>
                <p className="text-sm text-red-100">{t('leaderdashboard.th_nh_vi_n_r_i_ro_cao')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
                <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-4xl font-bold mb-1">{teamInsights.mediumRiskCount}</h3>
                <p className="text-sm text-yellow-100">{t('leaderdashboard.th_nh_vi_n_r_i_ro_trung_b_nh')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <CheckCircle2 className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-4xl font-bold mb-1">{teamInsights.retentionRate.toFixed(1)}%</h3>
                <p className="text-sm text-green-100">{t('leaderdashboard.t_l_gi_ch_n')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <Brain className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-4xl font-bold mb-1">{teamInsights.totalAtRisk}</h3>
                <p className="text-sm text-blue-100">{t('leaderdashboard.c_n_ch')}</p>
              </div>
            </motion.div>
          </div>

          {/* At-Risk Members List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-zinc-200 dark:border-white/20 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6">
                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  {t('leaderdashboard.th_nh_vi_n_c_n_ch')}{teamInsights.atRiskMembers.length})
                </h3>
                <p className="text-sm text-zinc-500 dark:text-gray-300 mt-1">
                  {t('leaderdashboard.ai_ph_t_hi_n_nh_ng_th_nh_vi_n')}</p>
              </div>

              <div className="p-6 space-y-4">
                {teamInsights.atRiskMembers.map((atRiskMember, index) => (
                  <motion.div
                    key={atRiskMember.member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-zinc-50 dark:bg-white/5 rounded-2xl p-6 border border-zinc-200 dark:border-white/20 hover:border-orange-500/40 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <img
                        src={atRiskMember.member.avatarUrl}
                        alt={atRiskMember.member.name}
                        className="w-16 h-16 rounded-full ring-4 ring-white/20 shadow-lg"
                      />

                      {/* Member Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white text-lg">
                              {atRiskMember.member.name}
                            </h4>
                            <p className="text-sm text-zinc-500 dark:text-gray-400">{atRiskMember.member.email}</p>
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${getRiskBadgeColor(atRiskMember.riskLevel)}`}>
                            {atRiskMember.riskLevel === 'high' && 'Rủi ro cao'}
                            {atRiskMember.riskLevel === 'medium' && 'Rủi ro trung bình'}
                            {atRiskMember.riskLevel === 'low' && 'Rủi ro thấp'}
                          </span>
                        </div>

                        {/* Risk Reasons */}
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-3">
                          <p className="text-xs font-bold text-orange-300 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('leaderdashboard.l_do_c_n_ch')}</p>
                          <ul className="text-xs text-orange-200 space-y-1">
                            {atRiskMember.riskReasons.map((reason, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-orange-400 rounded-full"></span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Suggested Actions */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
                          <p className="text-xs font-bold text-blue-300 mb-2 flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {t('leaderdashboard.ai_xu_t')}</p>
                          <ul className="text-xs text-blue-200 space-y-1">
                            {atRiskMember.suggestedActions.map((action, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleSendReminder(atRiskMember.member.id)}
                            disabled={actionLoading === `reminder-${atRiskMember.member.id}`}
                            className="flex-1 py-2.5 bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === `reminder-${atRiskMember.member.id}` ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            {t('leaderdashboard.g_i_nh_c_nh')}</button>
                          <button
                            onClick={() => handleSendGift(atRiskMember.member.id)}
                            disabled={actionLoading === `gift-${atRiskMember.member.id}`}
                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                          >
                            {actionLoading === `gift-${atRiskMember.member.id}` ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <GiftIcon className="w-4 h-4" />
                            )}
                            {t('leaderdashboard.t_ng_qu_kh_ch_l')}</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00575A] focus:border-transparent outline-none"
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value === 'all' ? 'all' : Number(e.target.value) as UserRank)}
          >
            <option value="all">{t('leaderdashboard.all_ranks')}</option>
            <option value={UserRank.THIEN_LONG}>{RANK_NAMES[UserRank.THIEN_LONG]}</option>
            <option value={UserRank.PHUONG_HOANG}>{RANK_NAMES[UserRank.PHUONG_HOANG]}</option>
            <option value={UserRank.DAI_SU}>{RANK_NAMES[UserRank.DAI_SU]}</option>
            <option value={UserRank.KHOI_NGHIEP}>{RANK_NAMES[UserRank.KHOI_NGHIEP]}</option>
            <option value={UserRank.CTV}>{RANK_NAMES[UserRank.CTV]}</option>
          </select>
        </motion.div>
      )}

      {/* Network Tree Tab */}
      {activeTab === 'tree' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <NetworkTree />
        </motion.div>
      )}
    </div>
  );
}
