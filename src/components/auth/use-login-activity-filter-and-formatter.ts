/**
 * useLoginActivityFilterAndFormatter hook
 * Manages filter state and provides timestamp formatting utility
 * for the LoginActivityLog component
 */

import { useState } from 'react';

export type LoginFilter = 'all' | 'success' | 'failed';

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

export function formatLoginTimestamp(isoString: string): string {
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
}

export function useLoginActivityFilterAndFormatter(attempts: LoginAttempt[]) {
    const [filter, setFilter] = useState<LoginFilter>('all');

    const filteredAttempts = attempts.filter(attempt => {
        if (filter === 'all') return true;
        if (filter === 'failed') return attempt.status === 'failed' || attempt.status === 'blocked';
        return attempt.status === filter;
    });

    const failedCount = attempts.filter(a => a.status === 'failed' || a.status === 'blocked').length;

    return { filter, setFilter, filteredAttempts, failedCount };
}
