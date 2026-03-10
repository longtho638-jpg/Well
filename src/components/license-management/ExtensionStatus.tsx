/**
 * Extension Status Component
 * Displays extension eligibility and usage metering
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export type ExtensionName = 'algo-trader' | 'agi-auto-pilot';
export type ExtensionStatusType = 'approved' | 'pending' | 'denied' | 'none';

interface ExtensionStatusProps {
  extension: ExtensionName;
  permitted: boolean;
  status: ExtensionStatusType;
  usage: number;
  limit: number;
  resetAt?: string | null;
}

export const ExtensionStatus: React.FC<ExtensionStatusProps> = ({
  extension,
  permitted,
  status,
  usage,
  limit,
  resetAt,
}) => {
  const { t } = useTranslation();
  const statusColors: Record<ExtensionStatusType, string> = {
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    denied: 'bg-red-100 text-red-800 border-red-200',
    none: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusLabels: Record<ExtensionStatusType, string> = {
    approved: 'ĐÃ DUYỆT',
    pending: 'CHỜ DUYỆT',
    denied: 'TỪ CHỐI',
    none: 'CHƯA CẬP NHẬT',
  };

  const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
  const isNearLimit = percentage > 80;
  const isOverLimit = usage > limit;

  const formatResetTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const extensionTitles: Record<ExtensionName, string> = {
    'algo-trader': 'Algo Trader Extension',
    'agi-auto-pilot': 'AGI Auto-Pilot Extension',
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{extensionTitles[extension]}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>

      {/* Denied State */}
      {!permitted && status === 'denied' && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">
            Giấy phép của bạn không hỗ trợ extension này.
            <a href="/billing/upgrade" className="underline ml-1 text-emerald-400 hover:text-emerald-300">
              Nâng cấp gói ngay
            </a>
          </p>
        </div>
      )}

      {/* Pending State */}
      {status === 'pending' && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            Yêu cầu truy cập đang được xem xét. Chúng tôi sẽ thông báo khi có kết quả.
          </p>
        </div>
      )}

      {/* Approved/Active State with Usage Meter */}
      {permitted && (
        <div className="mt-4 space-y-3">
          {/* Usage Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">
              {t('quotaTracker.extension_usage')}: <span className={`font-medium ${isOverLimit ? 'text-red-400' : 'text-white'}`}>{usage.toLocaleString()}</span>
            </span>
            <span className="text-zinc-400">
              {t('quotaTracker.extension_limit')}: <span className="font-medium text-white">{limit.toLocaleString()} requests</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOverLimit
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Reset Time */}
          {resetAt && (
            <div className="text-xs text-zinc-500 text-right">
              {t('quotaTracker.reset_at')}: {formatResetTime(resetAt)}
            </div>
          )}

          {/* Near Limit Warning */}
          {isNearLimit && !isOverLimit && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                {t('quotaTracker.near_limit_warning', { percentage: percentage.toFixed(0) })}
              </p>
            </div>
          )}

          {/* Over Limit Alert */}
          {isOverLimit && (
            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">
                {t('quotaTracker.over_limit', { count: usage - limit })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
