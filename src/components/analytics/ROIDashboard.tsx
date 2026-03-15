/**
 * ROI Dashboard - WellNexus Analytics
 * ROIaaS Phase 4 - Subscription ROI Analytics
 *
 * Features:
 * - Monthly savings display
 * - Feature usage heatmap
 * - Subscription ROI calculator
 * - Gated behind Pro tier (free users see blurred preview with upgrade CTA)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  Lock,
  Crown,
  ArrowRight,
  Zap,
  Calendar,
  Activity,
  Flame,
  Target,
} from 'lucide-react';
import { useFeatureGate } from '@/lib/subscription-gate';
import { cn } from '@/lib/utils';
import type { WellNexusFeature } from '@/lib/subscription-gate';

// ===== Types =====

interface MonthlySavings {
  totalSaved: number;
  timeSavedHours: number;
  costSaved: number;
  efficiencyGain: number;
}

interface FeatureUsageData {
  feature: string;
  usage: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface ROIMetrics {
  subscriptionCost: number;
  valueGenerated: number;
  roiPercentage: number;
  paybackPeriodDays: number;
  monthlyValue: number;
}

interface ROIDashboardProps {
  orgId?: string;
  className?: string;
}

// ===== Mock Data (Replace with API calls in production) =====

const MOCK_MONTHLY_SAVERAGES: MonthlySavings = {
  totalSaved: 15750000,
  timeSavedHours: 42.5,
  costSaved: 8500000,
  efficiencyGain: 67,
};

const MOCK_FEATURE_USAGE: FeatureUsageData[] = [
  { feature: 'AI Copilot', usage: 89, trend: 'up', changePercent: 23 },
  { feature: 'Analytics', usage: 76, trend: 'up', changePercent: 15 },
  { feature: 'Health Coach', usage: 64, trend: 'stable', changePercent: 2 },
  { feature: 'Marketplace', usage: 52, trend: 'down', changePercent: -8 },
  { feature: 'Network', usage: 45, trend: 'up', changePercent: 12 },
  { feature: 'Reports', usage: 38, trend: 'up', changePercent: 31 },
];

const MOCK_ROI_METRICS: ROIMetrics = {
  subscriptionCost: 299000,
  valueGenerated: 45000000,
  roiPercentage: 14986,
  paybackPeriodDays: 2,
  monthlyValue: 15000000,
};

// ===== Sub-Components =====

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subtext,
  trend = 'neutral',
  gradient,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className={cn(
      'relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br backdrop-blur-sm overflow-hidden',
      gradient
    )}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-xl bg-white/10">{icon}</div>
      {trend && (
        <div
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full',
            trend === 'up'
              ? 'bg-emerald-500/20 text-emerald-400'
              : trend === 'down'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-gray-500/20 text-gray-400'
          )}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
  </motion.div>
);

interface HeatmapBarProps {
  feature: FeatureUsageData;
}

const HeatmapBar: React.FC<HeatmapBarProps> = ({ feature }) => {
  const intensity = feature.usage / 100;
  const hue = 160 + (1 - intensity) * 40;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white">{feature.feature}</span>
          <span className="text-sm text-gray-400">{feature.usage}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${intensity * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(${hue}, 70%, 50%), hsl(${hue + 20}, 80%, 60%))`,
            }}
          />
        </div>
      </div>
      <div
        className={cn(
          'text-xs font-semibold px-2 py-1 rounded-full',
          feature.trend === 'up'
            ? 'bg-emerald-500/20 text-emerald-400'
            : feature.trend === 'down'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-gray-500/20 text-gray-400'
        )}
      >
        {feature.changePercent > 0 ? '+' : ''}
        {feature.changePercent}%
      </div>
    </motion.div>
  );
};

interface ROICalculatorDisplayProps {
  metrics: ROIMetrics;
}

const ROICalculatorDisplay: React.FC<ROICalculatorDisplayProps> = ({ metrics }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-purple-500/10">
          <Target className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Subscription ROI</h3>
          <p className="text-sm text-gray-400">Tỷ suất lợi nhuận trên chi phí</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5">
          <p className="text-xs text-gray-400 mb-1">Chi phí Subscription</p>
          <p className="text-lg font-bold text-white">{formatCurrency(metrics.subscriptionCost)}</p>
          <p className="text-xs text-gray-500 mt-1">/tháng</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5">
          <p className="text-xs text-gray-400 mb-1">Giá trị tạo ra</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(metrics.valueGenerated)}</p>
          <p className="text-xs text-gray-500 mt-1">/tháng</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">ROI</span>
            <span className="text-2xl font-bold text-emerald-400">
              {metrics.roiPercentage.toLocaleString('vi-VN')}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(metrics.roiPercentage / 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-xs text-gray-400">Thời gian hoàn vốn</p>
            <p className="text-lg font-bold text-white">{metrics.paybackPeriodDays} ngày</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-xs text-gray-400">Giá trị trung bình</p>
            <p className="text-lg font-bold text-white">{formatCurrency(metrics.monthlyValue)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface UpgradeCTAProps {
  feature: WellNexusFeature;
}

const UpgradeCTA: React.FC<UpgradeCTAProps> = ({ feature }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm p-8"
  >
    {/* Animated background pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
    </div>

    <div className="relative z-10 text-center space-y-6">
      {/* Lock Icon */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/40"
      >
        <Lock className="w-10 h-10 text-amber-400" />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold text-white mb-2">Nâng cấp Pro để mở khóa</h3>
        <p className="text-gray-400">{feature} yêu cầu gói Pro hoặc cao hơn</p>
      </motion.div>

      {/* Features list */}
      <motion.ul
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 text-left max-w-md mx-auto"
      >
        {[
          'Analytics Dashboard đầy đủ',
          'Feature Usage Heatmap',
          'Subscription ROI Calculator',
          'Monthly Savings Report',
          'Priority Support',
        ].map((featureName, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3 h-3 text-emerald-400" />
            </div>
            {featureName}
          </li>
        ))}
      </motion.ul>

      {/* CTA Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full max-w-sm mx-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2"
      >
        <Crown className="w-5 h-5" />
        Nâng cấp Pro ngay
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  </motion.div>
);

// ===== Main Component =====

export const ROIDashboard: React.FC<ROIDashboardProps> = ({ className }) => {
  const FEATURE: WellNexusFeature = 'analyticsDashboard';
  const { hasAccess, isLoading, currentTier } =
    useFeatureGate(FEATURE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);

  // Show loading skeleton
  if (isLoading || !loaded) {
    return (
      <div className={cn('space-y-6 p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade CTA for free users
  if (!hasAccess) {
    return (
      <div className={cn('min-h-[600px] p-6', className)}>
        {/* Blurred preview background */}
        <div className="absolute inset-0 blur-xl opacity-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Upgrade CTA overlay */}
        <div className="relative z-10">
          <UpgradeCTA feature={FEATURE} />
        </div>
      </div>
    );
  }

  // Show full dashboard for Pro+ users
  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">ROI Dashboard</h1>
          <p className="text-sm text-gray-400">
            Theo dõi hiệu quả subscription và feature usage
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase">
            {currentTier === 'enterprise' ? 'Enterprise' : 'Pro'} Plan
          </span>
        </div>
      </motion.div>

      {/* Monthly Savings Stats */}
      <section>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
        >
          <Calendar className="w-5 h-5 text-teal-400" />
          Monthly Savings
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            label="Tổng tiết kiệm"
            value={formatCurrency(MOCK_MONTHLY_SAVERAGES.totalSaved)}
            subtext="tháng này"
            trend="up"
            gradient="from-emerald-900/30 to-teal-900/30"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-blue-400" />}
            label="Thời gian tiết kiệm"
            value={`${MOCK_MONTHLY_SAVERAGES.timeSavedHours}h`}
            subtext="~8.5h/tuần"
            trend="up"
            gradient="from-blue-900/30 to-cyan-900/30"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
            label="Chi phí giảm"
            value={formatCurrency(MOCK_MONTHLY_SAVERAGES.costSaved)}
            subtext="vs manual work"
            trend="up"
            gradient="from-purple-900/30 to-indigo-900/30"
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-400" />}
            label="Hiệu suất tăng"
            value={`${MOCK_MONTHLY_SAVERAGES.efficiencyGain}%`}
            subtext="vs tháng trước"
            trend="up"
            gradient="from-orange-900/30 to-red-900/30"
          />
        </div>
      </section>

      {/* Feature Usage Heatmap */}
      <section>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
        >
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Feature Usage Heatmap
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm"
        >
          <div className="space-y-1">
            {MOCK_FEATURE_USAGE.map((feature) => (
              <HeatmapBar key={feature.feature} feature={feature} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Subscription ROI Calculator */}
      <section>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
        >
          <Target className="w-5 h-5 text-purple-400" />
          Subscription ROI Calculator
        </motion.h2>
        <ROICalculatorDisplay metrics={MOCK_ROI_METRICS} />
      </section>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-500 text-center pt-4 border-t border-white/10"
      >
        Dữ liệu được cập nhật realtime. Refresh để xem số liệu mới nhất.
      </motion.p>
    </div>
  );
};

export default ROIDashboard;
