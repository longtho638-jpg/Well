/**
 * system-status-indicator-components — StatusDot and StatusLabel visual indicators for health check display
 */

import React from 'react';
import { CheckStatus } from './system-status-health-check-utils';

export function StatusDot({ status }: { status: CheckStatus }) {
  const colorMap: Record<CheckStatus, string> = {
    checking: 'bg-zinc-400 animate-pulse',
    healthy: 'bg-emerald-400 shadow-emerald-400/50 shadow-lg',
    degraded: 'bg-amber-400 shadow-amber-400/50 shadow-lg',
    down: 'bg-red-400 shadow-red-400/50 shadow-lg',
  };
  return <span className={`inline-block w-3 h-3 rounded-full ${colorMap[status]}`} />;
}

export function StatusLabel({ status }: { status: CheckStatus }) {
  const labelMap: Record<CheckStatus, { text: string; color: string }> = {
    checking: { text: 'Checking...', color: 'text-zinc-400' },
    healthy: { text: 'Healthy', color: 'text-emerald-400' },
    degraded: { text: 'Degraded', color: 'text-amber-400' },
    down: { text: 'Down', color: 'text-red-400' },
  };
  const item = labelMap[status];
  return <span className={`text-xs font-semibold uppercase tracking-wider ${item.color}`}>{item.text}</span>;
}
