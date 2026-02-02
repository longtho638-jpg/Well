/**
 * Login Activity Log Component
 * Phase 1: Auth Max Level
 * 
 * Shows recent login attempts for security awareness:
 * - Time, device, location, status
 * - Failed attempts highlighted
 * - Exportable for security audits
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle,
    XCircle,
    Monitor,
    Smartphone,
    MapPin,
    AlertTriangle,
    Download,
} from 'lucide-react';
import { useTranslation } from '@/hooks';

export interface LoginAttempt {
    id: string;
    timestamp: string;
    device: string;
    browser: string;
    location: string;
    ip: string;
    status: 'success' | 'failed' | 'blocked';
    failReason?: string;
}

interface LoginActivityLogProps {
    attempts?: LoginAttempt[];
    onExport?: () => void;
}

// Mock data for demo
const MOCK_ATTEMPTS: LoginAttempt[] = [
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

const StatusBadge: React.FC<{ status: LoginAttempt['status'] }> = ({ status }) => {
    const config = {
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
    };

    const { icon: Icon, text, className } = config[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {text}
        </span>
    );
};

const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function LoginActivityLog({
    attempts = MOCK_ATTEMPTS,
    onExport,
}: LoginActivityLogProps) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

    const filteredAttempts = attempts.filter((attempt) => {
        if (filter === 'all') return true;
        if (filter === 'failed') return attempt.status === 'failed' || attempt.status === 'blocked';
        return attempt.status === filter;
    });

    const failedCount = attempts.filter(a => a.status === 'failed' || a.status === 'blocked').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">{t('loginactivitylog.login_activity')}</h3>
                    <p className="text-sm text-zinc-500">
                        {t('loginactivitylog.recent_sign_in_attempts_to_you')}</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter */}
                    <div className="flex items-center bg-zinc-900 rounded-lg p-1">
                        {(['all', 'success', 'failed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'success' ? 'Successful' : 'Failed'}
                                {f === 'failed' && failedCount > 0 && (
                                    <span className="ml-1 text-red-400">({failedCount})</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Export */}
                    <button
                        onClick={onExport}
                        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Export activity log"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Failed Attempts Warning */}
            {failedCount > 0 && filter !== 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="text-red-200 font-medium">
                                {failedCount} {t('loginactivitylog.failed_login_attempt')}{failedCount !== 1 ? 's' : ''} {t('loginactivitylog.detected')}</p>
                            <p className="text-zinc-400 mt-1">
                                {t('loginactivitylog.if_you_don_t_recognize_these_a')}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Activity List */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {t('loginactivitylog.time')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {t('loginactivitylog.device')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {t('loginactivitylog.location')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {t('loginactivitylog.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredAttempts.map((attempt, index) => (
                            <motion.tr
                                key={attempt.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`${attempt.status !== 'success' ? 'bg-red-500/5' : ''
                                    } hover:bg-zinc-900/50 transition-colors`}
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-zinc-500" />
                                        <span className="text-zinc-300">{formatTimestamp(attempt.timestamp)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        {attempt.device === 'mobile' ? (
                                            <Smartphone className="w-4 h-4 text-zinc-500" />
                                        ) : (
                                            <Monitor className="w-4 h-4 text-zinc-500" />
                                        )}
                                        <span className="text-zinc-300">{attempt.browser}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-zinc-500" />
                                        <span className="text-zinc-300">{attempt.location}</span>
                                        <span className="text-zinc-600">({attempt.ip})</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        <StatusBadge status={attempt.status} />
                                        {attempt.failReason && (
                                            <span className="text-xs text-zinc-500">{attempt.failReason}</span>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredAttempts.length === 0 && (
                    <div className="px-4 py-8 text-center text-zinc-500">
                        {t('loginactivitylog.no_login_attempts_found')}</div>
                )}
            </div>
        </div>
    );
}

export default LoginActivityLog;
