/**
 * LicenseRequiredModal - Upgrade prompt for RaaS gated features
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Zap, Shield, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface LicenseRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'adminDashboard' | 'payosWebhook' | 'commissionDistribution' | 'policyEngine';
}

export function LicenseRequiredModal({
  isOpen,
  onClose,
  feature = 'adminDashboard',
}: LicenseRequiredModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const featureTitles: Record<string, string> = {
    adminDashboard: 'Admin Dashboard',
    payosWebhook: 'PayOS Payment Gateway',
    commissionDistribution: 'Commission Distribution',
    policyEngine: 'Policy Engine',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={20} className="text-zinc-500" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {t('raas.license_required')}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {featureTitles[feature]}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-zinc-600 dark:text-zinc-300">
            Unlock premium features with a RaaS license key. Get instant access to:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Zap size={20} className="text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Lightning-fast Automation</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Execute commands in milliseconds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield size={20} className="text-emerald-500 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Enterprise Security</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Role-based access control</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Crown size={20} className="text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Premium Features</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Full platform access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('raas.contact_support')}
          </button>
          <a
            href="https://wellnexus.vn/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:from-amber-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            {t('raas.upgrade_now')}
            <ExternalLink size={16} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default LicenseRequiredModal;
