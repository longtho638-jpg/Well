import React, { useState, useEffect } from 'react';
import { HeroCard } from '../components/Dashboard/HeroCard';
import { RevenueChart } from '../components/Dashboard/RevenueChart';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { QuickActionsCard } from '../components/Dashboard/QuickActionsCard';
import { DailyQuestHub } from '../components/Dashboard/DailyQuestHub';
import { useStore } from '../store';
import { useTranslation } from '../hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Package,
  Award,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  Star,
  Crown,
  Coins,
  ShoppingBag,
  TrendingDown,
  Gift,
  Sparkles,
  Radio,
  BarChart3,
  Wallet,
  DollarSign
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatVND, formatNumber } from '../utils/format';

// Activity types
interface LiveActivity {
  id: string;
  type: 'reward' | 'order' | 'rank_up' | 'withdrawal' | 'referral';
  userName: string;
  message: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  amount?: number;
}

// Generate random Vietnamese names
const vietnameseNames = [
  'Nguyễn Văn Minh', 'Trần Thị Hương', 'Lê Quang Hải', 'Phạm Thu Hà',
  'Hoàng Minh Tuấn', 'Đỗ Thị Lan', 'Vũ Công Phượng', 'Ngô Thị Mai',
  'Bùi Văn Toàn', 'Đinh Thị Ngọc', 'Phan Văn Đức', 'Lý Thị Kim',
  'Trịnh Văn Quyết', 'Võ Thị Sáu', 'Mai Văn Thành', 'Cao Thị Loan',
  'Đặng Văn Lâm', 'Huỳnh Thị Ngân', 'Tô Văn Hùng', 'Lưu Thị Phương'
];

// Generate random live activity
const generateRandomActivity = (t: (key: string, vars?: any) => string): LiveActivity => {
  const randomName = vietnameseNames[Math.floor(Math.random() * vietnameseNames.length)];
  const activityTypes: Array<LiveActivity['type']> = ['reward', 'order', 'rank_up', 'withdrawal', 'referral'];
  const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

  const activityTemplates = {
    reward: {
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      messages: [
        { key: 'dashboard.liveActivities.activities.earnedGrow', amount: Math.floor(Math.random() * 900) + 100 },
        { key: 'dashboard.liveActivities.activities.rewardedGrow', amount: Math.floor(Math.random() * 1500) + 500 },
        { key: 'dashboard.liveActivities.activities.teamBonusGrow', amount: Math.floor(Math.random() * 2000) + 800 }
      ]
    },
    order: {
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      messages: [
        { key: 'dashboard.liveActivities.activities.completedOrder', amount: Math.floor(Math.random() * 8000000) + 2000000 },
        { key: 'dashboard.liveActivities.activities.soldSuccess', amount: Math.floor(Math.random() * 15000000) + 5000000 },
        { key: 'dashboard.liveActivities.activities.finishedOrder', amount: Math.floor(Math.random() * 20000000) + 10000000 }
      ]
    },
    rank_up: {
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      messages: [
        { key: 'dashboard.liveActivities.activities.rankedUpGold' },
        { key: 'dashboard.liveActivities.activities.rankedUpPartner' },
        { key: 'dashboard.liveActivities.activities.rankedUpFounder' },
        { key: 'dashboard.liveActivities.activities.rankedUpSilver' }
      ]
    },
    withdrawal: {
      icon: TrendingDown,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      messages: [
        { key: 'dashboard.liveActivities.activities.withdrew', amount: Math.floor(Math.random() * 30000000) + 10000000 },
        { key: 'dashboard.liveActivities.activities.transferredSuccess', amount: Math.floor(Math.random() * 50000000) + 20000000 }
      ]
    },
    referral: {
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      messages: [
        { key: 'dashboard.liveActivities.activities.referredPartner' },
        { key: 'dashboard.liveActivities.activities.referralBonus', amount: Math.floor(Math.random() * 5000000) + 1000000 },
        { key: 'dashboard.liveActivities.activities.teamExpanded' }
      ]
    }
  };

  const template = activityTemplates[randomType];
  const randomMessage = template.messages[Math.floor(Math.random() * template.messages.length)];

  let messageText = t(randomMessage.key);
  const amount = 'amount' in randomMessage ? randomMessage.amount : undefined;

  // Format amount based on activity type
  if (amount !== undefined) {
    const formattedAmount = randomType === 'reward'
      ? formatNumber(amount)
      : formatVND(amount);
    messageText = t(randomMessage.key, { amount: formattedAmount });
  }

  return {
    id: `activity-\${Date.now()}-\${Math.random()}`,
    type: randomType,
    userName: randomName,
    message: messageText,
    timestamp: new Date(),
    icon: template.icon,
    color: template.color,
    bgColor: template.bgColor,
    amount
  };
};

// Live Activities Ticker Component
const LiveActivitiesTicker: React.FC = () => {
  const t = useTranslation();
  const [activities, setActivities] = useState<LiveActivity[]>([]);

  useEffect(() => {
    // Initialize with 5 activities
    const initialActivities = Array.from({ length: 5 }, () => generateRandomActivity(t));
    setActivities(initialActivities);

    // Add new activity every 3-5 seconds
    const interval = setInterval(() => {
      const newActivity = generateRandomActivity(t);
      setActivities(prev => {
        const updated = [newActivity, ...prev];
        // Keep only last 10 activities
        return updated.slice(0, 10);
      });
    }, Math.random() * 2000 + 3000); // 3-5 seconds

    return () => clearInterval(interval);
  }, [t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-b border-gray-100 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Radio className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                {t('dashboard.liveActivities.title')}
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full"
                >
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {t('dashboard.liveActivities.live')}
                </motion.span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.liveActivities.subtitle')}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 dark:text-slate-500">{t('dashboard.liveActivities.updateContinuously')}</p>
          </div>
        </div>
      </div>

      {/* Ticker Container */}
      <div className="h-[400px] overflow-hidden relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-slate-800 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-800 to-transparent z-10 pointer-events-none" />

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto px-6 py-4 space-y-2 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
                layout
                className="relative"
              >
                <div className={`
                  flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700
                  hover:shadow-md transition-all duration-300 cursor-pointer
                  \${activity.bgColor} \${index === 0 ? 'ring-2 ring-primary/20' : ''}
                `}>
                  {/* Animated Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: index === 0 ? [0, 5, -5, 0] : 0
                    }}
                    transition={{
                      scale: { repeat: Infinity, duration: 2, delay: index * 0.2 },
                      rotate: { repeat: Infinity, duration: 1 }
                    }}
                    className={`w-10 h-10 \${activity.bgColor} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <activity.icon className={`w-5 h-5 \${activity.color}`} />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-slate-100">
                      <span className="font-bold">{activity.userName}</span>
                      {' '}
                      <span className="text-gray-600 dark:text-slate-400">{activity.message}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                      {index === 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold"
                        >
                          {t('dashboard.liveActivities.new')}
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* Sparkles effect for new items */}
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {activities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 dark:text-slate-500 text-sm">{t('dashboard.liveActivities.loading')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-slate-400">
            🔥 {t('dashboard.liveActivities.recent', { count: activities.length })}
          </span>
          <span className="text-gray-400 dark:text-slate-500">
            {t('dashboard.liveActivities.systemActive')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  const t = useTranslation();
  const { user, revenueData, products, transactions } = useStore();

  // Prepare Wallet Data for Stats
  const walletData = {
    total: user.shopBalance + (user.estimatedBonus || 0),
    available: user.shopBalance,
    pending: user.estimatedBonus || 0
  };

  // Revenue breakdown data
  const revenueBreakdown = [
    { name: t('dashboard.revenueBreakdown.directSales'), value: user.totalSales * 0.7, color: '#00575A' },
    { name: t('dashboard.revenueBreakdown.teamBonus'), value: user.totalSales * 0.25, color: '#FFBF00' },
    { name: t('dashboard.revenueBreakdown.referral'), value: user.totalSales * 0.05, color: '#22c55e' }
  ];

  // Recent activities
  const recentActivities = [
    {
      icon: CheckCircle2,
      label: t('dashboard.recentActivity.completedQuest'),
      time: t('dashboard.recentActivity.hoursAgo', { hours: 2 }),
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      icon: Users,
      label: t('dashboard.recentActivity.newTeamMember'),
      time: t('dashboard.recentActivity.hoursAgo', { hours: 5 }),
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      icon: Package,
      label: t('dashboard.recentActivity.productShipped'),
      time: t('dashboard.recentActivity.daysAgo', { days: 1 }),
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      icon: Award,
      label: t('dashboard.recentActivity.reachedRank'),
      time: t('dashboard.recentActivity.daysAgo', { days: 3 }),
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  // Achievement badges
  const achievements = [
    {
      icon: Crown,
      label: t('dashboard.achievements.topSeller'),
      unlocked: true,
      color: 'from-yellow-400 to-amber-500'
    },
    {
      icon: Target,
      label: t('dashboard.achievements.goalCrusher'),
      unlocked: true,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Star,
      label: t('dashboard.achievements.teamLeader'),
      unlocked: false,
      color: 'from-gray-300 to-gray-400'
    },
    {
      icon: Zap,
      label: t('dashboard.achievements.speedDemon'),
      unlocked: false,
      color: 'from-gray-300 to-gray-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark tracking-tight flex items-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-8 h-8 text-[#FFBF00]" />
            </motion.div>
            {t('dashboard.title')}
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            {t('dashboard.welcome', { name: user.name })} 🚀
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            {t('dashboard.serverTime')}
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-slate-100 font-mono">
            {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </p>
        </div>
      </div>

      {/* Hero Card - Full Width */}
      <HeroCard user={user} />

      {/* ========================================================================= */}
      {/* PREMIUM STATS CARDS (Glassmorphism) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Balance', 
            value: formatVND(walletData.total),
            icon: Wallet,
            gradient: 'from-teal-500 to-teal-600',
            change: '+12.5%'
          },
          { 
            label: 'Available', 
            value: formatVND(walletData.available),
            icon: DollarSign,
            gradient: 'from-emerald-500 to-emerald-600',
            change: '+8.2%'
          },
          { 
            label: 'Pending', 
            value: formatVND(walletData.pending),
            icon: Clock,
            gradient: 'from-amber-500 to-amber-600',
            change: '+15.3%'
          },
          { 
            label: 'Team Volume', 
            value: formatVND(user?.teamVolume || 0),
            icon: Users,
            gradient: 'from-violet-500 to-violet-600',
            change: '+22.1%'
          }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="glass-card hover-lift group bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br \${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    {stat.change}
                  </div>
                </div>
                <div className="text-sm text-slate-500 font-medium mb-1">{stat.label}</div>
                <div className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                  {stat.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* BUSINESS VALUATION CARD - THE CENTERPIECE (Wealth OS) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl shadow-2xl"
      >
        {/* Premium Gold Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500" />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />

        <div className="relative z-10 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Valuation Display */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                    {t('dashboard.valuation.title')}
                  </p>
                  <p className="text-xs text-white/60">
                    {t('dashboard.valuation.subtitle')}
                  </p>
                </div>
              </div>

              {/* The Big Number */}
              <div className="mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 font-display tracking-tight"
                >
                  {formatVND(user.businessValuation || 0)}
                </motion.div>
                <p className="text-white/80 text-sm">
                  {t('dashboard.valuation.formula')}
                  <span className="block text-xs text-white/60 mt-1">
                    ({formatVND(user.monthlyProfit || 0)} × 12 × 5 PE Ratio)
                  </span>
                </p>
              </div>

              {/* Growth Indicator */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">
                  +{user.assetGrowthRate || 5}% MoM Growth
                </span>
              </div>
            </div>

            {/* Right: Asset Breakdown */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5" />
                {t('dashboard.valuation.assetBreakdown')}
              </h3>

              <div className="space-y-4">
                {/* Cashflow (SHOP) */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs uppercase font-semibold tracking-wider">
                      {t('dashboard.valuation.cashflow')}
                    </p>
                    <p className="text-white/90 text-sm">SHOP Token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">
                      {formatVND(user.cashflowValue || 0)}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/20" />

                {/* Equity (GROW) */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs uppercase font-semibold tracking-wider">
                      {t('dashboard.valuation.equity')}
                    </p>
                    <p className="text-white/90 text-sm">GROW Token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">
                      {formatVND(user.equityValue || 0)}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/20" />

                {/* Projected Annual Profit */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs uppercase font-semibold tracking-wider">
                      {t('dashboard.valuation.projectedAnnual')}
                    </p>
                    <p className="text-white/90 text-sm">Annualized Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">
                      {formatVND(user.projectedAnnualProfit || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 text-amber-600 dark:text-amber-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 border border-transparent dark:border-slate-600"
              >
                <Crown className="w-5 h-5" />
                {t('dashboard.valuation.upgradePortfolio')}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Quest Hub - Full Width */}
      <DailyQuestHub />

      {/* Main Grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats + Chart (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Chart and Live Activities - Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <RevenueChart data={revenueData} />

            {/* Live Activities Ticker */}
            <LiveActivitiesTicker />
          </div>

          {/* Top Products */}
          <TopProducts products={products} />
        </div>

        {/* Right Column - Sidebar widgets */}
        <div className="space-y-6">
          {/* Quick Actions Card - Priority position */}
          <QuickActionsCard />

          {/* Revenue Breakdown Donut Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#00575A]/10 dark:bg-[#00575A]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#00575A]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100">
                {t('dashboard.revenueBreakdown.title')}
              </h3>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-\${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `\${(value / 1000000).toFixed(1)}M ₫`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-4">
              {revenueBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {((item.value / user.totalSales) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100">
                {t('dashboard.recentActivity.title')}
              </h3>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className={`w-8 h-8 \${activity.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <activity.icon className={`w-4 h-4 \${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{activity.label}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold">{t('dashboard.achievements.title')}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {achievements.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                    className={`
                      relative p-4 rounded-xl text-center
                      \${badge.unlocked
                        ? 'bg-gradient-to-br ' + badge.color + ' shadow-lg'
                        : 'bg-white/10 backdrop-blur-sm opacity-50'
                      }
                    `}
                  >
                    <badge.icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-semibold">{badge.label}</p>
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-gray-900/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <span className="text-xl">🔒</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-white/70 mt-4 text-center">
                {t('dashboard.achievements.unlocked', {
                  count: achievements.filter(a => a.unlocked).length,
                  total: achievements.length
                })}
              </p>
            </div>
          </motion.div>

          {/* Quick Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6"
          >
            <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
              {t('dashboard.quickStats.title')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  {t('dashboard.quickStats.totalTransactions')}
                </span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{transactions.length}</span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-slate-900" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  {t('dashboard.quickStats.activeProducts')}
                </span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{products.length}</span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-slate-900" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  {t('dashboard.quickStats.currentRank')}
                </span>
                <span className="font-bold text-[#FFBF00]">{user.rank}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};