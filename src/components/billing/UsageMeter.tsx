/**
 * Usage Meter Component
 * Real-time usage visualization for metered billing
 */

import React from 'react';

interface UsageMeterProps {
  feature: string;
  used: number;
  limit: number;
  unit: string;
  overageRate?: number;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  feature,
  used,
  limit,
  unit,
  overageRate,
}) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const isOverLimit = used > limit;
  const overageAmount = isOverLimit ? (used - limit) * (overageRate || 0) : 0;

  const statusColor = isOverLimit ? 'text-red-400' : percentage > 80 ? 'text-amber-400' : 'text-emerald-400';
  const barColor = isOverLimit ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white">{feature}</h4>
        <span className={`text-xs font-medium ${statusColor}`}>
          {isOverLimit ? 'Vượt giới hạn' : `${percentage.toFixed(0)}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-zinc-400">Đã dùng: </span>
          <span className="text-white font-medium">{used.toLocaleString()} {unit}</span>
        </div>
        <div className="text-right">
          <span className="text-zinc-400">Giới hạn: </span>
          <span className="text-white font-medium">{limit.toLocaleString()} {unit}</span>
        </div>
      </div>

      {/* Overage Warning */}
      {isOverLimit && overageRate && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">
            Phí vượt mức: ${(overageAmount / 100).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};
