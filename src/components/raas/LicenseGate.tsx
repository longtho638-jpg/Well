/**
 * RaaS License Gate UI Component
 *
 * Wraps children and shows upgrade modal when license is invalid.
 * Use this to gate premium features behind RaaS license.
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Lock, Crown, Zap } from 'lucide-react';
import { LicenseRequiredModal } from './LicenseRequiredModal';
import { useTranslation } from '@/hooks';
import { getCachedLicenseResult } from '@/lib/raas-gate';

interface LicenseGateProps {
  children: React.ReactNode;
  /**
   * Feature to gate (for future granular control)
   * Default: 'adminDashboard'
   */
  feature?: 'adminDashboard' | 'payosWebhook' | 'commissionDistribution' | 'policyEngine';
  /**
   * If true, always render children (useful for dev mode override)
   */
  skip?: boolean;
}

/**
 * LicenseGate - Conditional rendering wrapper
 *
 * Usage:
 * ```tsx
 * <LicenseGate>
 *   <AdminDashboard />
 * </LicenseGate>
 *
 * // Or with specific feature
 * <LicenseGate feature="payosWebhook">
 *   <PaymentSettings />
 * </LicenseGate>
 * ```
 */
export function LicenseGate({
  children,
  feature = 'adminDashboard',
  skip = false,
}: LicenseGateProps) {
  // PERFORMANCE OPTIMIZATION: Synchronous check — no useEffect needed
  // getCachedLicenseResult() uses module-level singleton cache (O(1) lookup)
  const [showModal, setShowModal] = React.useState(false);

  // Instant check — cached at module level, no async/db lookup
  const result = getCachedLicenseResult();
  const hasAccess = skip || (result.isValid && result.features[feature]);

  // Show modal on mount if no access (batched update)
  React.useEffect(() => {
    if (!hasAccess && !skip) {
      setShowModal(true);
    }
  }, [hasAccess, skip]);

  // Has access - render children (no loading state needed - sync check)
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access - show modal (if not already showing)
  return (
    <>
      {showModal ? (
        <AnimatePresence>
          <LicenseRequiredModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            feature={feature}
          />
        </AnimatePresence>
      ) : null}
      {/* Blurred background content */}
      <div className="relative filter blur-sm pointer-events-none select-none">
        {children}
      </div>
    </>
  );
}

/**
 * LicenseGuard - HOC wrapper version
 *
 * Usage:
 * ```tsx
 * const ProtectedAdmin = withLicenseGuard(AdminDashboard);
 * // or
 * const ProtectedPayment = withLicenseGuard(PaymentSettings, { feature: 'payosWebhook' });
 * ```
 */
export function withLicenseGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: { feature?: LicenseGateProps['feature']; skip?: boolean }
) {
  return function LicenseGuardedComponent(props: P) {
    return (
      <LicenseGate feature={options?.feature} skip={options?.skip}>
        <Component {...props} />
      </LicenseGate>
    );
  };
}

/**
 * LicenseBadge - Small badge showing license status
 *
 * Usage in headers, settings panels, etc.
 */
export function LicenseBadge() {
  const { t } = useTranslation();
  const result = getCachedLicenseResult();

  if (!result.isValid) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <Lock size={12} />
        {t('raas.license_required')}
      </span>
    );
  }

  const daysRemaining = result.expiresAt
    ? Math.floor((result.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
    : undefined;

  if (daysRemaining !== undefined && daysRemaining < 30) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <Zap size={12} />
        {t('raas.license_expiring_soon', { days: daysRemaining })}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
      <Crown size={12} />
      {t('raas.license_active')}
    </span>
  );
}

export default LicenseGate;
