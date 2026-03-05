/**
 * Lazy-loaded Chart Components
 * Dynamic imports to reduce initial bundle size (saves ~537KB)
 */

import React, { lazy, Suspense, FC } from 'react';
import type { ChartDataPoint } from '../../types';

// Loading fallback
const ChartSkeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-800/50 rounded-2xl border border-white/5 ${className}`} />
);

// Chart component types
interface RevenueChartProps {
  data: ChartDataPoint[];
}

interface GenericChartProps {
  data: unknown[];
  type?: 'area' | 'bar' | 'line' | 'pie';
  [key: string]: unknown;
}

// Lazy-loaded components with Suspense boundaries
export const LazyRevenueChart: FC<RevenueChartProps> = ({ data }) => {
  const RevenueChart = lazy(() =>
    import('../Dashboard/RevenueChart').then(m => ({ default: m.RevenueChart }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <RevenueChart data={data} />
    </Suspense>
  );
};

export const LazyReferralTrendChart: FC<RevenueChartProps> = ({ data }) => {
  const ReferralTrendChart = lazy(() =>
    import('../Referral/ReferralTrendChart').then(m => ({ default: m.ReferralTrendChart }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <ReferralTrendChart data={data} />
    </Suspense>
  );
};

export const LazyPerformanceChart: FC<RevenueChartProps> = ({ data }) => {
  const PerformanceChart = lazy(() =>
    import('../LeaderDashboard/PerformanceChart').then(m => ({ default: m.PerformanceChart }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <PerformanceChart data={data} />
    </Suspense>
  );
};

export const LazyHealthCheckRadarChart: FC<{ data: unknown[] }> = ({ data }) => {
  const HealthCheckRadarChart = lazy(() =>
    import('../HealthCheck/health-check-radar-chart').then(m => ({ default: m.HealthCheckRadarChart }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <HealthCheckRadarChart data={data} />
    </Suspense>
  );
};

export const LazyTeamCharts: FC<GenericChartProps> = (props) => {
  const TeamCharts = lazy(() =>
    import('../LeaderDashboard/components/TeamCharts').then(m => ({ default: m.TeamCharts }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <TeamCharts {...props} />
    </Suspense>
  );
};

export const LazyRevenueBreakdown: FC<GenericChartProps> = (props) => {
  const RevenueBreakdown = lazy(() =>
    import('../Dashboard/RevenueBreakdown').then(m => ({ default: m.RevenueBreakdown }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <RevenueBreakdown {...props} />
    </Suspense>
  );
};

export const LazyVendorAnalytics: FC<GenericChartProps> = (props) => {
  const VendorAnalytics = lazy(() =>
    import('../marketplace/VendorAnalytics').then(m => ({ default: m.VendorAnalytics }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <VendorAnalytics {...props} />
    </Suspense>
  );
};

export const LazyAdminOverview: FC<GenericChartProps> = (props) => {
  const AdminOverview = lazy(() =>
    import('../pages/Admin/Overview').then(m => ({ default: m.AdminOverview }))
  );

  return (
    <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
      <AdminOverview {...props} />
    </Suspense>
  );
};

// Re-export original components for non-lazy usage
export { RevenueChart } from '../Dashboard/RevenueChart';
export { ReferralTrendChart } from '../Referral/ReferralTrendChart';
export { PerformanceChart } from '../LeaderDashboard/PerformanceChart';
export { HealthCheckRadarChart } from '../HealthCheck/health-check-radar-chart';
export { TeamCharts } from '../LeaderDashboard/components/TeamCharts';
export { RevenueBreakdown } from '../Dashboard/RevenueBreakdown';
export { VendorAnalytics } from '../marketplace/VendorAnalytics';
