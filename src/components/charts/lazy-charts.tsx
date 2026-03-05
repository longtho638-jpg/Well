/**
 * Lazy-loaded Chart Components
 * Wraps recharts components with React.lazy() for code splitting
 *
 * Benefits:
 * - ~350KB chart bundle loaded only when chart is visible
 * - Prevents charts from blocking initial page load
 * - TDZ-safe (avoids circular d3 dependency issues)
 */

import { lazy } from 'react';

// Lazy load RevenueChart - only loads when Admin Overview is visited
export const RevenueChart = lazy(() =>
  import('@/components/Dashboard/RevenueChart').then(m => ({ default: m.RevenueChart }))
);

// Lazy load PerformanceChart - only loads when Leader Dashboard is visited
export const PerformanceChart = lazy(() =>
  import('@/components/LeaderDashboard/PerformanceChart').then(m => ({ default: m.default }))
);

// Lazy load TeamCharts - only loads when Team Dashboard is visited
export const TeamCharts = lazy(() =>
  import('@/pages/LeaderDashboard/components/TeamCharts').then(m => ({ default: m.TeamCharts }))
);

// Lazy load HealthCheckRadarChart - only loads when Health Check page is visited
export const HealthCheckRadarChart = lazy(() =>
  import('@/components/HealthCheck/health-check-radar-chart').then(m => ({ default: m.default }))
);

// Lazy load ReferralTrendChart - only loads when Referral page is visited
export const ReferralTrendChart = lazy(() =>
  import('@/components/Referral/ReferralTrendChart').then(m => ({ default: m.ReferralTrendChart }))
);

// Lazy load RevenueBreakdown - only loads when Dashboard Finance tab is visited
export const RevenueBreakdown = lazy(() =>
  import('@/components/Dashboard/RevenueBreakdown').then(m => ({ default: m.RevenueBreakdown }))
);

// Lazy load VendorAnalytics - only loads when Vendor Dashboard is visited
export const VendorAnalytics = lazy(() =>
  import('@/components/marketplace/VendorAnalytics').then(m => ({ default: m.VendorAnalytics }))
);
