import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle2, Brain } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface TeamInsights {
  highRiskCount: number;
  mediumRiskCount: number;
  retentionRate: number;
  totalAtRisk: number;
}

interface Props {
  teamInsights: TeamInsights;
}

/**
 * Insights Risk Overview Cards Component
 * Displays 4 stat cards showing team risk metrics:
 * - High risk members count
 * - Medium risk members count
 * - Retention rate percentage
 * - Total members needing attention
 */
export default function InsightsRiskOverviewCards({ teamInsights }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {/* High Risk Count */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-4xl font-bold mb-1">{teamInsights.highRiskCount}</h3>
          <p className="text-sm text-red-100">{t('leaderdashboard.thanh_vien_rui_ro_cao')}</p>
        </div>
      </motion.div>

      {/* Medium Risk Count */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
          <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-4xl font-bold mb-1">{teamInsights.mediumRiskCount}</h3>
          <p className="text-sm text-yellow-100">{t('leaderdashboard.thanh_vien_rui_ro_trung_binh')}</p>
        </div>
      </motion.div>

      {/* Retention Rate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <CheckCircle2 className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-4xl font-bold mb-1">{teamInsights.retentionRate.toFixed(1)}%</h3>
          <p className="text-sm text-green-100">{t('leaderdashboard.ty_le_giu_chan')}</p>
        </div>
      </motion.div>

      {/* Total At Risk */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <Brain className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="text-4xl font-bold mb-1">{teamInsights.totalAtRisk}</h3>
          <p className="text-sm text-blue-100">{t('leaderdashboard.can_ch')}</p>
        </div>
      </motion.div>
    </div>
  );
}
