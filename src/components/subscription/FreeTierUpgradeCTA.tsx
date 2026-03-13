/**
 * Free Tier Upgrade CTA Component
 *
 * Displays an upgrade prompt for free tier users when attempting to access
 * premium features. Uses Aura Elite design system with glassmorphism and gradients.
 */

import { ArrowRight, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FreeTierUpgradeCTAProps {
  /** The feature name being gated (e.g., 'Analytics Dashboard') */
  feature: string;
  /** Callback when user clicks upgrade button */
  onUpgrade: () => void;
  /** Optional custom className for styling */
  className?: string;
}

/**
 * FreeTierUpgradeCTA - Upgrade call-to-action component
 *
 * Displays a visually appealing upgrade prompt with:
 * - Lock icon indicating premium feature
 * - Feature-specific upgrade message
 * - Pro tier benefits highlight
 * - Action button with arrow icon
 */
export function FreeTierUpgradeCTA({
  feature,
  onUpgrade,
  className = '',
}: FreeTierUpgradeCTAProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10
                  border border-amber-500/30 rounded-xl backdrop-blur-sm
                  hover:border-amber-500/50 transition-all duration-300
                  ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Lock Icon */}
        <div className="flex-shrink-0">
          <Lock
            className="w-8 h-8 text-amber-400"
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {t('subscription.upgrade_for', { feature })}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {t('subscription.pro_includes', {
              features: t('subscription.pro_features_list'),
            })}
          </p>
        </div>

        {/* Upgrade Button */}
        <button
          onClick={onUpgrade}
          className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500
                     hover:from-amber-600 hover:to-orange-600 text-white rounded-lg
                     font-medium flex items-center gap-2 transition-all duration-200
                     hover:shadow-lg hover:shadow-amber-500/25 active:scale-95"
          aria-label={`Upgrade to access ${feature}`}
        >
          {t('subscription.upgrade')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default FreeTierUpgradeCTA;
