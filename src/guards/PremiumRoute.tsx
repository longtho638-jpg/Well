/**
 * Premium Route Guard
 *
 * Generic premium route guard with configurable feature requirement.
 * Redirects to dashboard if user doesn't have required subscription tier.
 *
 * Usage:
 * ```tsx
 * <Route
 *   path="/dashboard/export"
 *   element={
 *     <PremiumRoute feature="bulkExport">
 *       <ExportPage />
 *     </PremiumRoute>
 *   }
 * />
 * ```
 */

import { Navigate } from 'react-router-dom';
import { useFeatureGate, type WellNexusFeature } from '@/lib/subscription-gate';
import { PageSpinner } from '@/config/app-lazy-routes-and-suspense-fallbacks';

interface PremiumRouteProps {
  children: React.ReactNode;
  feature: WellNexusFeature;
  redirectPath?: string;
}

export function PremiumRoute({
  children,
  feature,
  redirectPath = '/dashboard',
}: PremiumRouteProps) {
  const { hasAccess, isLoading } = useFeatureGate(feature);

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageSpinner />
      </div>
    );
  }

  // Redirect if no access
  if (!hasAccess) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if has access
  return <>{children}</>;
}

export default PremiumRoute;
