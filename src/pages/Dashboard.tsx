/**
 * WellNexus Dashboard (Aura Elite Edition)
 * Enterprise-grade state visualization with high-fidelity telemetry and Wealth OS components.
 */

import React, { useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

// Hooks & Store
import { useDashboard } from '@/hooks/useDashboard';

// Shared Components
import { HeroCard } from '../components/Dashboard/HeroCard';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { QuickActionsCard } from '../components/Dashboard/QuickActionsCard';
import { DailyQuestHub } from '../components/Dashboard/DailyQuestHub';
import RankProgressBar from '../components/RankProgressBar';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import { BentoGrid, BentoCard, AuraBadge, GridPattern, AuraBadgeColor } from '@/components/ui/Aura';

// Aura Elite Modular Components — lazy loaded (below the fold / heavy)
const RevenueChart = lazy(() => import('../components/Dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })));
const LiveActivitiesTicker = lazy(() => import('../components/Dashboard/LiveActivitiesTicker').then(m => ({ default: m.LiveActivitiesTicker })));
const ValuationCard = lazy(() => import('../components/Dashboard/ValuationCard').then(m => ({ default: m.ValuationCard })));
const CommissionWidget = lazy(() => import('../components/Dashboard/CommissionWidget').then(m => ({ default: m.CommissionWidget })));
const RevenueBreakdown = lazy(() => import('../components/Dashboard/RevenueBreakdown').then(m => ({ default: m.RevenueBreakdown })));
const RecentActivityList = lazy(() => import('../components/Dashboard/RecentActivityList').then(m => ({ default: m.RecentActivityList })));
const AchievementGrid = lazy(() => import('../components/Dashboard/AchievementGrid').then(m => ({ default: m.AchievementGrid })));
import { Wallet, DollarSign, Users } from 'lucide-react';
import { formatVND } from '@/utils/format';

export const Dashboard: React.FC = () => {
    
  const {
    user,
    revenueData,
    products,
    activities,
    walletStats,
    revenueBreakdown,
    recentActivities,
    achievements,
    t
  } = useDashboard();

  // Optimization: Memoize stats array to prevent re-creation
  const kpiStats = useMemo(() => [
    { label: t('dashboard.stats.totalNodeYield'), val: walletStats.total, icon: Wallet, color: 'cyan' as AuraBadgeColor, growth: '+12.5%' },
    { label: t('dashboard.stats.liquidCapital'), val: walletStats.available, icon: DollarSign, color: 'violet' as AuraBadgeColor, growth: '+8.2%' },
    { label: t('dashboard.stats.ecosystemVolume'), val: walletStats.teamVolume, icon: Users, color: 'pink' as AuraBadgeColor, growth: '+22.1%' }
  ], [walletStats, t]);

  // Optimization: Memoize server time string
  const serverTime = useMemo(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), []);

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden transition-colors duration-500 pb-20">
      <GridPattern />
      <ParticleBackground />
      <CursorGlow />

      <div className="relative z-10 px-6 lg:px-12 py-10 space-y-12 max-w-[1600px] mx-auto">
        {/* Mission Status Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 border-b border-white/5 pb-8"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-14 h-14 bg-[#FFBF00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,191,0,0.2)]"
              >
                <Zap className="w-8 h-8 text-zinc-950" />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-sm">
                  {t('dashboard.title')}
                </h2>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-sm mt-1">
                  <span className="text-emerald-500 italic">{t('dashboard.system_online')}</span> • {t('dashboard.welcome', { name: (user?.name || '').split(' ').pop() || 'Partner' })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="text-right border-l border-white/5 pl-8">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1 italic">
                {t('dashboard.serverTime')}
              </p>
              <p className="text-xl font-black text-zinc-300 font-mono tracking-tighter">
                {serverTime}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Primary Intelligence Layer */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 flex flex-col gap-8">
            <HeroCard user={user} />
            <Suspense fallback={<div className="h-32 bg-zinc-900 rounded-2xl animate-pulse" />}>
              <CommissionWidget />
            </Suspense>
            <RankProgressBar
              currentRank={user.rank}
              accumulatedBonusRevenue={user.accumulatedBonusRevenue || 0}
            />
          </div>
          <div className="xl:col-span-4">
            <QuickActionsCard />
          </div>
        </div>

        {/* Strategic KPI Matrix */}
        <BentoGrid>
          {kpiStats.map((stat, idx) => (
            <BentoCard key={idx} colSpan={1} className="p-8 bg-zinc-900 shadow-2xl group">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center border border-${stat.color}-500/20 shadow-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <AuraBadge color={stat.color}>{stat.growth}</AuraBadge>
              </div>
              <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">{stat.label}</div>
              <div className="text-4xl font-black text-white tracking-tighter italic">
                {formatVND(stat.val)}
              </div>
            </BentoCard>
          ))}
        </BentoGrid>

        {/* Centerpiece Valuation */}
        <Suspense fallback={<div className="h-48 bg-zinc-900 rounded-2xl animate-pulse" />}>
          <ValuationCard user={user} />
        </Suspense>

        {/* Daily Engagement Hub */}
        <DailyQuestHub />

        {/* Tactical Recon Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Suspense fallback={<div className="h-64 bg-zinc-900 rounded-2xl animate-pulse" />}>
                <RevenueChart data={revenueData} />
              </Suspense>
              <Suspense fallback={<div className="h-64 bg-zinc-900 rounded-2xl animate-pulse" />}>
                <LiveActivitiesTicker activities={activities} />
              </Suspense>
            </div>
            <TopProducts products={products} />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Suspense fallback={<div className="h-48 bg-zinc-900 rounded-2xl animate-pulse" />}>
              <RevenueBreakdown data={revenueBreakdown} totalSales={user.totalSales} />
            </Suspense>
            <Suspense fallback={<div className="h-32 bg-zinc-900 rounded-2xl animate-pulse" />}>
              <RecentActivityList activities={recentActivities} />
            </Suspense>
            <Suspense fallback={<div className="h-32 bg-zinc-900 rounded-2xl animate-pulse" />}>
              <AchievementGrid achievements={achievements} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
