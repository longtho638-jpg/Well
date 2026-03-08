/**
 * Billing Status Card Component
 * Displays current subscription status, usage, and payment state
 */

import React from 'react';
import { CheckCircle, AlertCircle, Clock, CreditCard } from 'lucide-react';

interface BillingStatusCardProps {
  status: 'active' | 'past_due' | 'incomplete' | 'trialing' | 'canceled';
  planName: string;
  currentPeriodEnd: string;
  usageThisPeriod: number;
  planLimit: number;
  invoiceDue?: number | null;
  onUpgrade?: () => void;
}

export const BillingStatusCard: React.FC<BillingStatusCardProps> = ({
  status,
  planName,
  currentPeriodEnd,
  usageThisPeriod,
  planLimit,
  invoiceDue,
  onUpgrade,
}) => {
  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      label: 'Hoạt động',
    },
    past_due: {
      icon: AlertCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      label: 'Quá hạn',
    },
    incomplete: {
      icon: Clock,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/20',
      label: 'Chưa hoàn tất',
    },
    trialing: {
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      label: 'Dùng thử',
    },
    canceled: {
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Đã hủy',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const usagePercentage = Math.min((usageThisPeriod / planLimit) * 100, 100);
  const isOverage = usageThisPeriod > planLimit;

  return (
    <div className={`rounded-2xl border p-6 ${config.bgColor} ${config.borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{planName}</h3>
            <p className={`text-sm ${config.color}`}>{config.label}</p>
          </div>
        </div>
        {status === 'past_due' && invoiceDue && (
          <div className="text-right">
            <p className="text-xs text-zinc-400">Số tiền cần thanh toán</p>
            <p className="text-xl font-bold text-amber-400">
              ${((invoiceDue as number) / 100).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Usage Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Usage kỳ này</span>
          <span className={`font-medium ${isOverage ? 'text-red-400' : 'text-white'}`}>
            {usageThisPeriod.toLocaleString()} / {planLimit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isOverage ? 'bg-red-500' : usagePercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        {isOverage && (
          <p className="text-xs text-red-400">Bạn đã vượt quá giới hạn - sẽ bị tính phí bổ sung</p>
        )}
      </div>

      {/* Period End */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-zinc-400">
          Gia hạn vào: {new Date(currentPeriodEnd).toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* Action Button */}
      {status === 'past_due' && (
        <button
          onClick={onUpgrade}
          className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Cập nhật thanh toán
        </button>
      )}
    </div>
  );
};
