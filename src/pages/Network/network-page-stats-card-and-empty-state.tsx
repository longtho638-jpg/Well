/**
 * network-page-stats-card-and-empty-state — StatsCard metric display and EmptyState placeholder for NetworkPage
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatsCard = ({ label, value, icon, color }: StatsCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`p-4 rounded-2xl border backdrop-blur-md ${color}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-black/20">
        {icon}
      </div>
      <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">{label}</span>
    </div>
    <p className="text-xl md:text-2xl font-black text-white ml-1">{value}</p>
  </motion.div>
);

export const NetworkEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-64 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/5">
      <Users className="w-12 h-12 text-zinc-600 mb-4" />
      <p className="text-zinc-400 font-medium">{t('network.empty_title')}</p>
      <p className="text-zinc-600 text-sm mt-1">{t('network.empty_subtitle')}</p>
    </div>
  );
};
