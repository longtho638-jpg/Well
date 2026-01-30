import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: number;
  trendLabel?: string;
  color?: 'brand' | 'blue' | 'purple' | 'orange';
}

export function KPICard({ title, value, icon: Icon, trend, trendLabel = "so với tháng trước", color = 'brand' }: KPICardProps) {
  const colors = {
    brand: "text-brand-primary dark:text-teal-400 bg-brand-primary/10",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
  };

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <div className={cn(
          "flex items-center gap-1 font-medium",
          trend >= 0 ? "text-green-500" : "text-red-500"
        )}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend)}%</span>
        </div>
        <span className="text-slate-400">{trendLabel}</span>
      </div>
    </GlassCard>
  );
}
