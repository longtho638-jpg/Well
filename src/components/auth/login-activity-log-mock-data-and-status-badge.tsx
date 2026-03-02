/**
 * Login activity log — mock login attempts for dev mode and StatusBadge display component
 */

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { LoginAttempt } from './use-login-activity-filter-and-formatter';

export const MOCK_LOGIN_ATTEMPTS: LoginAttempt[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    device: 'desktop',
    browser: 'Chrome on macOS',
    location: 'Ho Chi Minh City, VN',
    ip: '113.xxx.xxx.xxx',
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    device: 'mobile',
    browser: 'Safari on iOS',
    location: 'Hanoi, VN',
    ip: '14.xxx.xxx.xxx',
    status: 'success',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    device: 'desktop',
    browser: 'Firefox on Windows',
    location: 'Unknown',
    ip: '45.xxx.xxx.xxx',
    status: 'failed',
    failReason: 'Invalid password',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    device: 'desktop',
    browser: 'Chrome on Linux',
    location: 'Singapore',
    ip: '103.xxx.xxx.xxx',
    status: 'blocked',
    failReason: 'Too many failed attempts',
  },
];

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    text: 'Success',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  failed: {
    icon: XCircle,
    text: 'Failed',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  blocked: {
    icon: AlertTriangle,
    text: 'Blocked',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
} as const;

export const StatusBadge: React.FC<{ status: LoginAttempt['status'] }> = ({ status }) => {
  const { icon: Icon, text, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {text}
    </span>
  );
};
