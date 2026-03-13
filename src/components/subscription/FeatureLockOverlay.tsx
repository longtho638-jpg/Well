/**
 * Feature Lock Overlay Component
 *
 * Blur overlay for locked premium features. Creates a glassmorphism
 * backdrop effect with upgrade prompt.
 */

import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureLockOverlayProps {
  /** Name of the locked feature */
  feature: string;
  /** Callback when user clicks upgrade */
  onUpgrade: () => void;
  /** Optional children to render blurred underneath */
  children?: React.ReactNode;
}

/**
 * FeatureLockOverlay - Premium feature blur overlay
 *
 * Creates a visually striking overlay that:
 * - Blurs the underlying content
 * - Shows lock icon and "Premium Feature" message
 * - Provides upgrade button
 */
export function FeatureLockOverlay({
  feature,
  onUpgrade,
  children,
}: FeatureLockOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      {/* Blurred Content (if children provided) */}
      {children && (
        <div className="absolute inset-0 blur-md select-none pointer-events-none">
          {children}
        </div>
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/40
                   backdrop-blur-sm rounded-xl z-10"
        role="alert"
        aria-label={`${feature} - Premium Feature`}
      >
        <div className="text-center p-6 max-w-sm">
          {/* Lock Icon */}
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20
                         to-orange-500/20 flex items-center justify-center border
                         border-amber-500/30"
            >
              <Lock
                className="w-8 h-8 text-amber-400"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-2">
            {t('subscription.premium_feature')}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-6">
            {t('subscription.upgrade_for', { feature })}
          </p>

          {/* Upgrade Button */}
          <button
            onClick={onUpgrade}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500
                       hover:from-amber-600 hover:to-orange-600 text-white
                       rounded-lg font-medium transition-all duration-200
                       hover:shadow-lg hover:shadow-amber-500/25 active:scale-95"
          >
            {t('subscription.upgrade_now')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureLockOverlay;
