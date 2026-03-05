/**
 * Lazy-loaded Chart Components
 * Dynamic imports to reduce initial bundle size
 */

import React, { Suspense, FC } from 'react';
import type { ChartDataPoint } from '../../types';

const ChartSkeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-800/50 rounded-2xl border border-white/5 ${className}`} />
);

export const LazyRevenueChart: FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const RevenueChart = React.lazy(() => import('../Dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })));
  return <Suspense fallback={<ChartSkeleton className="h-[340px]" />}><RevenueChart data={data} /></Suspense>;
};

export const LazyReferralTrendChart: FC<{ data: { month: string; referrals: number; revenue: number }[] }> = ({ data }) => {
  const ReferralTrendChart = React.lazy(() => import('../Referral/ReferralTrendChart').then(m => ({ default: m.ReferralTrendChart })));
  return <Suspense fallback={<ChartSkeleton className="h-[340px]" />}><ReferralTrendChart data={data} /></Suspense>;
};

export { RevenueChart } from '../Dashboard/RevenueChart';
export { ReferralTrendChart } from '../Referral/ReferralTrendChart';
