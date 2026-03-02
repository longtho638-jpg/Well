import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Share2, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from '../hooks';
import { referralService, NetworkNode, ReferralTreeData } from '../services/referral-service';
import { NetworkTreeDesktop } from '../components/network/network-tree-desktop';
import { NetworkListMobile } from '../components/network/network-list-mobile';
import { useStore } from '../store';
import { exportNetworkTreeJSON, exportNetworkTreeCSV } from '@/utils/network-tree-export-utilities';

const NetworkPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<ReferralTreeData | null>(null); // D3 format
  const [flatData, setFlatData] = useState<NetworkNode | null>(null); // Flat/Recursive format
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [stats, setStats] = useState({
    totalDownlines: 0,
    f1Count: 0,
    totalTeamSales: 0,
    activeMembers: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsData = await referralService.getReferralStats(user?.id);
        setStats(statsData);

        // Fetch tree
        const rootNode = await referralService.getDownlineTree(user?.id);
        setFlatData(rootNode);

        if (rootNode) {
          const d3Data = referralService.transformToD3Tree(rootNode);
          setTreeData(d3Data);
        }
      } catch {
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleExportJSON = () => {
    if (!flatData) return;
    setIsExportingJSON(true);
    try {
      exportNetworkTreeJSON(flatData);
    } catch {
      // export failed, non-critical
    } finally {
      setIsExportingJSON(false);
    }
  };

  const handleExportCSV = () => {
    if (!flatData) return;
    setIsExportingCSV(true);
    try {
      exportNetworkTreeCSV(flatData);
    } catch {
      // export failed, non-critical
    } finally {
      setIsExportingCSV(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" />
            {t('nav.network') || 'Referral Network'}
          </h1>
          <p className="text-zinc-400 mt-1">
            {t('network.manage_team_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            disabled={isExportingJSON || !flatData}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isExportingJSON ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileJson className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">{t('network.export_json')}</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV || !flatData}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isExportingCSV ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">{t('network.export_csv')}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-bold">{t('network.invite_member')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label={t('network.total_downlines')}
          value={stats.totalDownlines}
          icon={<Users className="w-4 h-4 text-blue-400" />}
          color="bg-blue-500/10 border-blue-500/20"
        />
        <StatsCard
          label={t('network.direct_f1')}
          value={stats.f1Count}
          icon={<Share2 className="w-4 h-4 text-purple-400" />}
          color="bg-purple-500/10 border-purple-500/20"
        />
        <StatsCard
          label={t('network.active_members')}
          value={stats.activeMembers}
          icon={<Users className="w-4 h-4 text-emerald-400" />}
          color="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatsCard
          label={t('network.team_volume')}
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalTeamSales)}
          icon={<Users className="w-4 h-4 text-yellow-400" />}
          color="bg-yellow-500/10 border-yellow-500/20"
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tree Visualization */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mobile View */}
          <div className="block lg:hidden">
            {flatData ? (
              <NetworkListMobile node={flatData} />
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block h-[600px]">
            {treeData ? (
              <NetworkTreeDesktop data={treeData} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatsCard = ({ label, value, icon, color }: StatsCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`p-4 rounded-2xl border backdrop-blur-md ${color}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-black/20">
        {icon}
      </div>
      <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">{label}</span>
    </div>
    <p className="text-xl md:text-2xl font-black text-white ml-1">{value}</p>
  </motion.div>
);

const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-64 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/5">
      <Users className="w-12 h-12 text-zinc-600 mb-4" />
      <p className="text-zinc-400 font-medium">{t('network.empty_title')}</p>
      <p className="text-zinc-600 text-sm mt-1">{t('network.empty_subtitle')}</p>
    </div>
  );
};

export default NetworkPage;
