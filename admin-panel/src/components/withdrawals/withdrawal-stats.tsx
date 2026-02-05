import React from 'react';
import { Loader2, DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Assuming we might use GlassCard if Card is not standard shadcn in this codebase
// But looking at previous ls, GlassCard exists. Let's stick to standard Tailwind/HTML if needed, or check UI components again.
// The ls showed GlassCard.tsx. Let's check GlassCard content or just make a simple stat card.
// Let's create a specialized StatCard component inline or use standard div for now to be safe and fast.

interface WithdrawalStatsProps {
  stats: {
    pendingAmount: number;
    pendingCount: number;
    approvedAmount: number;
    completedAmount: number;
    rejectedAmount: number;
  } | null;
  isLoading: boolean;
}

export function WithdrawalStats({ stats, isLoading }: WithdrawalStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Pending Requests"
        value={formatCurrency(stats.pendingAmount)}
        subValue={`${stats.pendingCount} requests waiting`}
        icon={<Clock className="h-4 w-4 text-orange-500" />}
        className="border-orange-500/20 bg-orange-500/5"
      />
      <StatCard
        title="Approved"
        value={formatCurrency(stats.approvedAmount)}
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        className="border-emerald-500/20 bg-emerald-500/5"
      />
      <StatCard
        title="Completed"
        value={formatCurrency(stats.completedAmount)}
        icon={<DollarSign className="h-4 w-4 text-blue-500" />}
        className="border-blue-500/20 bg-blue-500/5"
      />
      <StatCard
        title="Rejected"
        value={formatCurrency(stats.rejectedAmount)}
        icon={<XCircle className="h-4 w-4 text-red-500" />}
        className="border-red-500/20 bg-red-500/5"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subValue,
  icon,
  className
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border p-6 shadow-sm backdrop-blur-sm ${className}`}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        {icon}
      </div>
      <div className="pt-2">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        {subValue && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
