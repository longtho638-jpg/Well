/**
 * Analytics Route Guard
 *
 * Protected route wrapper for analytics dashboard pages.
 * Requires 'pro' tier or higher to access.
 *
 * Usage:
 * ```tsx
 * <Route
 *   path="/dashboard/analytics"
 *   element={
 *     <AnalyticsRoute>
 *       <AnalyticsDashboard />
 *     </AnalyticsRoute>
 *   }
 * />
 * ```
 */

import { Navigate } from 'react-router-dom';
import { useFeatureGate } from '@/lib/subscription-gate';
import { PageSpinner } from '@/config/app-lazy-routes-and-suspense-fallbacks';
import { useTranslation } from '@/hooks';

interface AnalyticsRouteProps {
  children: React.ReactNode;
}

export function AnalyticsRoute({ children }: AnalyticsRouteProps) {
  const { hasAccess, isLoading, currentTier, requiredTier, featureName } = useFeatureGate('analyticsDashboard');
  const { t } = useTranslation();

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageSpinner />
      </div>
    );
  }

  // Redirect to dashboard if no access
  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if has access
  return <>{children}</>;
}

export default AnalyticsRoute;
