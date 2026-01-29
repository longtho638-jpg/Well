import React from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Download, Mail, Phone, MoreVertical } from 'lucide-react';
import { TeamMember, UserRank, RANK_NAMES } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface TeamTableProps {
  filteredMembers: TeamMember[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterRank: UserRank | 'all';
  setFilterRank: (value: UserRank | 'all') => void;
  sortBy: 'sales' | 'growth' | 'team';
  setSortBy: (value: 'sales' | 'growth' | 'team') => void;
  getRankBadgeColor: (rank: UserRank) => string;
  getGrowthColor: (growth: number) => string;
}

/**
 * Team members table component with search, filter, and sort
 * Displays team member details with actions
 */
export default function TeamTable({
  filteredMembers,
  searchTerm,
  setSearchTerm,
  filterRank,
  setFilterRank,
  sortBy,
  setSortBy,
  getRankBadgeColor,
  getGrowthColor
}: TeamTableProps) {
  const { t } = useTranslation();

  return (
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
  );
}
