/**
 * License Tier Badge Component
 * Shows tier badge with color coding
 */

import { useTranslation } from 'react-i18next';
import type { LicenseTier } from '@/types/raas-license';
import { TIER_COLORS } from '@/types/raas-license';

interface LicenseTierBadgeProps {
  tier: LicenseTier;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_I18N_KEYS: Record<LicenseTier, string> = {
  basic: 'admin.licenses.basic',
  premium: 'admin.licenses.premium',
  enterprise: 'admin.licenses.enterprise',
  master: 'admin.licenses.master',
};

export function LicenseTierBadge({ tier, size = 'sm' }: LicenseTierBadgeProps) {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded ${sizeClasses[size]} ${TIER_COLORS[tier]}`}>
      {t(TIER_I18N_KEYS[tier])}
    </span>
  );
}
