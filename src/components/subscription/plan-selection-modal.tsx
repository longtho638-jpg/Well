/**
 * PlanSelectionModal - Modal for upgrade prompts when free user clicks premium feature
 * Shows minimum required tier and direct checkout redirect
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { Modal } from '@/components/ui/Modal';

export interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: 'pro' | 'enterprise';
  featureName: string;
  onUpgrade: (planId: string) => void;
  upgrading?: boolean;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({
  isOpen,
  onClose,
  requiredTier,
  featureName,
  onUpgrade,
  upgrading = false,
}) => {
  const { t } = useTranslation();

  const tierConfig = {
    pro: {
      name: t('pricing.pro_name'),
      nameKey: 'pricing.pro_name',
      price: '299.000₫',
      description: t('pricing.pro_description'),
      gradient: 'from-amber-500 to-orange-600',
      icon: Zap,
      features: [
        t('pricing.features.advanced_analytics'),
        t('pricing.features.ai_copilot'),
        t('pricing.features.priority_support'),
        t('pricing.features.health_coach'),
      ],
    },
    enterprise: {
      name: t('pricing.enterprise_name'),
      nameKey: 'pricing.enterprise_name',
      price: '999.000₫',
      description: t('pricing.enterprise_description'),
      gradient: 'from-purple-600 to-indigo-700',
      icon: Crown,
      features: [
        t('pricing.features.everything_in_pro'),
        t('pricing.features.white_label'),
        t('pricing.features.multi_network'),
        t('pricing.features.api_access'),
        t('pricing.features.dedicated_support'),
      ],
    },
  };

  const selectedTier = tierConfig[requiredTier];
  const TierIcon = selectedTier.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pricing.premium_feature')}
      maxWidth="lg"
      showCloseButton={true}
    >
      <div className="space-y-6">
        {/* Feature Lock Message */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <Lock className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            {t('pricing.feature_locked')}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('pricing.unlock_with')} <span className="font-semibold">{featureName}</span>
          </p>
        </div>

        {/* Recommended Plan Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative rounded-2xl bg-gradient-to-br ${selectedTier.gradient} p-1 shadow-xl`}
        >
          <div className="bg-zinc-900 rounded-[1.4rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTier.gradient} flex items-center justify-center text-white shadow-lg`}
                >
                  <TierIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">
                    {selectedTier.name}
                  </h4>
                  <p className="text-sm text-zinc-400">{selectedTier.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">
                  {selectedTier.price}
                </p>
                <p className="text-xs text-zinc-500">/{t('pricing.per_month')}</p>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-2 mb-6">
              {selectedTier.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-sm text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Upgrade Button */}
            <button
              onClick={() => onUpgrade(requiredTier)}
              disabled={upgrading}
              className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 ${
                upgrading
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${selectedTier.gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
              }`}
            >
              {upgrading ? t('pricing.processing') : t('pricing.upgrade_now')}
            </button>
          </div>

          {/* Popular Badge */}
          {requiredTier === 'pro' && (
            <div className="absolute -top-3 right-4">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {t('pricing.most_popular')}
              </span>
            </div>
          )}
        </motion.div>

        {/* Alternative Plan Hint */}
        {requiredTier === 'pro' && (
          <p className="text-center text-sm text-zinc-500">
            {t('pricing.need_more')}{' '}
            <button
              onClick={() => onUpgrade('enterprise')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              {t('pricing.enterprise_name')} →
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
};

export default PlanSelectionModal;
