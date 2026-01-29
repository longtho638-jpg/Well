import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string | number;
  label: string;
  badge?: ReactNode;
  delay?: number;
  gradientFrom: string;
  gradientTo: string;
}

/**
 * Reusable stat card component for displaying key metrics
 * Used in Leader Dashboard for team performance metrics
 */
export default function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
  badge,
  delay = 0,
  gradientFrom,
  gradientTo
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <Icon className={`w-8 h-8 ${iconColor}`} />
          {badge}
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-sm text-zinc-400">{label}</p>
      </div>
    </motion.div>
  );
}
