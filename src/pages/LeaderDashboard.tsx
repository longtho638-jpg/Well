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
  AlertCircle
} from 'lucide-react';
import { useStore } from '@/store';
import { TeamMember, UserRank } from '@/types';
import { formatVND, formatNumber } from '@/utils/format';
import { TEAM_MEMBERS, TEAM_METRICS } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/hooks';

export default function LeaderDashboard() {
  const t = useTranslation();
  const { user, teamInsights, sendReminder, sendGift } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<UserRank | 'all'>('all');
  const [sortBy, setSortBy] = useState<'sales' | 'growth' | 'team'>('sales');

  // Tab management - TREE MAX LEVEL
  const [activeTab, setActiveTab] = useState<'team' | 'insights'>('team');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and sort team members
  const filteredMembers = TEAM_MEMBERS
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

  // Chart data
  const performanceData = TEAM_MEMBERS.slice(0, 5).map(m => ({
    name: m.name.split(' ').pop(),
    sales: m.personalSales / 1000000,
    team: m.teamVolume / 1000000
  }));

  const rankDistribution = [
    { name: 'Partner', value: TEAM_MEMBERS.filter(m => m.rank === 'Partner').length, color: '#00575A' },
    { name: 'Member', value: TEAM_MEMBERS.filter(m => m.rank === 'Member').length, color: '#FFBF00' }
  ];

  const getRankBadgeColor = (rank: UserRank) => {
    switch (rank) {
      case 'Founder Club':
        return 'bg-purple-100 text-purple-700';
      case 'Partner':
        return 'bg-blue-100 text-blue-700';
      case 'Member':
        return 'bg-gray-100 text-gray-700';
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('team.leaderDashboard')}</h1>
                <p className="text-white/80 text-sm">{t('team.subtitle')}</p>
              </div>
            </div>
            <p className="text-white/90 max-w-2xl">
              {t('team.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - TREE MAX LEVEL */}
      <div className="bg-white rounded-xl p-2 flex gap-2 border border-gray-200">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'team'
              ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          Quản Lý Đội Nhóm
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'insights'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Brain className="w-5 h-5" />
          AI Insights
          {teamInsights.highRiskCount > 0 && (
            <span className="bg-white text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {teamInsights.highRiskCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'team' && (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {TEAM_METRICS.activeMembers}/{TEAM_METRICS.totalMembers} {t('team.metrics.active')}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{TEAM_METRICS.totalMembers}</h3>
          <p className="text-sm text-gray-600">{t('team.metrics.totalMembers')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatVND(TEAM_METRICS.totalTeamVolume)}</h3>
          <p className="text-sm text-gray-600">{t('team.metrics.teamVolume')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 text-purple-500" />
            <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">
              +{TEAM_METRICS.monthlyGrowth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatVND(TEAM_METRICS.averageSalesPerMember)}</h3>
          <p className="text-sm text-gray-600">{t('team.metrics.averageSales')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <Award className="w-8 h-8 text-orange-500" />
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{TEAM_METRICS.topPerformers.length}</h3>
          <p className="text-sm text-gray-600">{t('team.metrics.topPerformers')}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('team.charts.teamPerformance')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}M`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="sales" fill="#00575A" name={t('team.charts.personalSales')} radius={[8, 8, 0, 0]} />
              <Bar dataKey="team" fill="#FFBF00" name={t('team.charts.teamVolumeChart')} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rank Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
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
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {rankDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t('team.members.teamMembers')} ({filteredMembers.length})
              </h3>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('team.members.search')}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Filter by Rank */}
              <select
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value as UserRank | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">{t('team.filters.allRanks')}</option>
                <option value="Partner">Partner</option>
                <option value="Member">Member</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'sales' | 'growth' | 'team')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="sales">{t('team.filters.sortSales')}</option>
                <option value="growth">{t('team.filters.sortGrowth')}</option>
                <option value="team">{t('team.filters.sortTeam')}</option>
              </select>

              {/* Export */}
              <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                {t('team.filters.export')}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.member')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.rank')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.personalSales')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.teamVolume')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.downlines')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.growth')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">{t('team.members.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member, index) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRankBadgeColor(member.rank)}`}>
                      {member.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatVND(member.personalSales)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatVND(member.teamVolume)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-700">{member.activeDownlines}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-bold ${getGrowthColor(member.monthlyGrowth)}`}>
                      +{member.monthlyGrowth}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t('team.actions.sendEmail')}>
                        <Mail className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t('team.actions.call')}>
                        <Phone className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t('team.actions.moreActions')}>
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{teamInsights.highRiskCount}</h3>
              <p className="text-sm text-red-100">Thành viên rủi ro cao</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{teamInsights.mediumRiskCount}</h3>
              <p className="text-sm text-yellow-100">Thành viên rủi ro trung bình</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <CheckCircle2 className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{teamInsights.retentionRate.toFixed(1)}%</h3>
              <p className="text-sm text-green-100">Tỷ lệ giữ chân</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <Brain className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{teamInsights.totalAtRisk}</h3>
              <p className="text-sm text-blue-100">Cần chú ý</p>
            </div>
          </div>

          {/* At-Risk Members List */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                Thành Viên Cần Chú Ý ({teamInsights.atRiskMembers.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                AI phát hiện những thành viên cần hỗ trợ và động viên
              </p>
            </div>

            <div className="p-6 space-y-4">
              {teamInsights.atRiskMembers.map((atRiskMember, index) => (
                <motion.div
                  key={atRiskMember.member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-orange-300 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <img
                      src={atRiskMember.member.avatarUrl}
                      alt={atRiskMember.member.name}
                      className="w-16 h-16 rounded-full ring-4 ring-white shadow-lg"
                    />

                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {atRiskMember.member.name}
                          </h4>
                          <p className="text-sm text-gray-600">{atRiskMember.member.email}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${getRiskBadgeColor(atRiskMember.riskLevel)}`}>
                          {atRiskMember.riskLevel === 'high' && 'Rủi ro cao'}
                          {atRiskMember.riskLevel === 'medium' && 'Rủi ro trung bình'}
                          {atRiskMember.riskLevel === 'low' && 'Rủi ro thấp'}
                        </span>
                      </div>

                      {/* Risk Reasons */}
                      <div className="bg-orange-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Lý do cần chú ý:
                        </p>
                        <ul className="text-xs text-orange-700 space-y-1">
                          {atRiskMember.riskReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Suggested Actions */}
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          AI đề xuất:
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {atRiskMember.suggestedActions.map((action, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <p className="text-xs text-gray-600">Doanh số</p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatVND(atRiskMember.member.personalSales)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <p className="text-xs text-gray-600">Tăng trưởng</p>
                          <p className="text-sm font-bold text-gray-900">
                            +{atRiskMember.member.monthlyGrowth}%
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <p className="text-xs text-gray-600">Không hoạt động</p>
                          <p className="text-sm font-bold text-orange-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {atRiskMember.daysInactive} ngày
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSendReminder(atRiskMember.member.id)}
                          disabled={actionLoading === `reminder-${atRiskMember.member.id}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                        >
                          {actionLoading === `reminder-${atRiskMember.member.id}` ? (
                            <>
                              <Bell className="w-4 h-4 animate-bounce" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Bell className="w-4 h-4" />
                              Nhắc nhở
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleSendGift(atRiskMember.member.id)}
                          disabled={actionLoading === `gift-${atRiskMember.member.id}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                        >
                          {actionLoading === `gift-${atRiskMember.member.id}` ? (
                            <>
                              <GiftIcon className="w-4 h-4 animate-bounce" />
                              Đang tặng...
                            </>
                          ) : (
                            <>
                              <GiftIcon className="w-4 h-4" />
                              Tặng quà 200k
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {teamInsights.atRiskMembers.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Tuyệt vời!</h4>
                  <p className="text-gray-600">Không có thành viên nào cần chú ý đặc biệt</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
