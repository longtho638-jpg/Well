/**
 * Quota Progress Component
 * Shows quota usage progress bars for API calls and tokens
 */

import { useTranslation } from 'react-i18next';

interface QuotaProgressProps {
  apiCalls: { used: number; limit: number };
  tokens: { used: number; limit: number };
  size?: 'sm' | 'md';
}

function ProgressBar({ used, limit, label, size }: { used: number; limit: number; label: string; size: 'sm' | 'md' }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';
  const colorClass = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-300'}`}>
          {used.toLocaleString()} / {limit.toLocaleString()} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className={`w-full bg-gray-800 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function QuotaProgress({ apiCalls, tokens, size = 'md' }: QuotaProgressProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <ProgressBar used={apiCalls.used} limit={apiCalls.limit} label={t('admin.licenses.api_calls')} size={size} />
      <ProgressBar used={tokens.used} limit={tokens.limit} label={t('admin.licenses.tokens')} size={size} />
    </div>
  );
}
