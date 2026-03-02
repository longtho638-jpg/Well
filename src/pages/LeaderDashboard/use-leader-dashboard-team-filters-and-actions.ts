import { useState } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/hooks';
import { UserRank, RANK_NAMES } from '@/types';

export type SortBy = 'sales' | 'growth' | 'team';
export type ActiveTab = 'team' | 'insights' | 'tree';

export function useLeaderDashboardTeamFiltersAndActions() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { teamInsights, teamMembers, teamMetrics, sendReminder, sendGift } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<UserRank | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('sales');
  const [activeTab, setActiveTab] = useState<ActiveTab>('team');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredMembers = teamMembers
    .filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = filterRank === 'all' || member.rank === filterRank;
      return matchesSearch && matchesRank;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sales': return b.personalSales - a.personalSales;
        case 'growth': return b.monthlyGrowth - a.monthlyGrowth;
        case 'team': return b.teamVolume - a.teamVolume;
        default: return 0;
      }
    });

  const top3Performers = [...teamMembers]
    .sort((a, b) => b.personalSales - a.personalSales)
    .slice(0, 3);

  const activeCount = teamMembers.filter(m => m.monthlyGrowth > 0).length;
  const inactiveCount = teamMembers.length - activeCount;

  const networkHealthData = [
    { name: t('leaderdashboard.status.active'), value: activeCount, color: '#10B981' },
    { name: t('leaderdashboard.status.at_risk'), value: Math.floor(teamMembers.length * 0.15), color: '#F59E0B' },
    { name: t('leaderdashboard.status.inactive'), value: inactiveCount - Math.floor(teamMembers.length * 0.15), color: '#EF4444' },
  ];

  const rankDistribution = [
    { name: t('leaderdashboard.ranks.dai_su'), value: teamMembers.filter(m => m.rank === UserRank.DAI_SU).length, color: '#00575A' },
    { name: t('leaderdashboard.ranks.ctv'), value: teamMembers.filter(m => m.rank === UserRank.CTV).length, color: '#FFBF00' },
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

  const handleSendReminder = async (memberId: string) => {
    setActionLoading(`reminder-${memberId}`);
    try {
      await sendReminder(memberId);
      showToast(t('leaderdashboard.alerts.reminder_success'), 'success');
    } catch {
      showToast(t('leaderdashboard.alerts.reminder_failed'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendGift = async (memberId: string) => {
    setActionLoading(`gift-${memberId}`);
    try {
      await sendGift(memberId, 200000);
      showToast(t('leaderdashboard.alerts.gift_success'), 'success');
    } catch {
      showToast(t('leaderdashboard.alerts.gift_failed'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return {
    t,
    teamInsights,
    teamMembers,
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
  };
}
