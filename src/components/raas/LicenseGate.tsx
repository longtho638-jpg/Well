/**
 * RaaS License Gate UI Component
 *
 * Wraps children and shows upgrade modal when license is invalid.
 * Use this to gate premium features behind RaaS license.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Crown, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { LicenseRequiredModal } from './LicenseRequiredModal';
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
  const { t } = useTranslation();
  const [showModal, setShowModal] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const [hasAccess, setHasAccess] = React.useState(false);

  React.useEffect(() => {
    if (skip) {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    // Check license
    const result = getCachedLicenseResult();
    setHasAccess(result.isValid && result.features[feature]);
    setIsChecking(false);
  }, [skip, feature]);

  // Show upgrade modal when accessing without license
  React.useEffect(() => {
    if (!isChecking && !hasAccess && !skip) {
      setShowModal(true);
    }
  }, [isChecking, hasAccess, skip]);

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Shield className="w-16 h-16 text-[#00575A] mx-auto animate-pulse" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            {t('raas.verifying_license')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Has access - render children
  if (hasAccess || skip) {
    return <>{children}</>;
  }

  // No access - show modal
  return (
    <>
      <AnimatePresence>
        {showModal && (
          <LicenseRequiredModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            feature={feature}
          />
        )}
      </AnimatePresence>
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
