/**
 * License Tier Badge Component
 * Shows tier badge with color coding
 */

import type { LicenseTier } from '@/types/raas-license';
import { TIER_COLORS } from '@/types/raas-license';

interface LicenseTierBadgeProps {
  tier: LicenseTier;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_LABELS: Record<LicenseTier, string> = {
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
  master: 'Master',
};

export function LicenseTierBadge({ tier, size = 'sm' }: LicenseTierBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded ${sizeClasses[size]} ${TIER_COLORS[tier]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}
