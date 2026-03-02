/**
 * Persisted State, Feature Flags, Online Status and Prefetch Hooks — localStorage-backed state, feature flag registry, navigator.onLine tracking, and link prefetch injection
 */

import { useState, useEffect, useCallback } from 'react';

export function usePersistedState<T>(
    key: string,
    defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
        setState(prev => {
            const newValue = typeof value === 'function'
                ? (value as (prev: T) => T)(prev)
                : value;
            localStorage.setItem(key, JSON.stringify(newValue));
            return newValue;
        });
    }, [key]);

    return [state, setPersistedState];
}

interface FeatureFlags {
    enableDarkMode: boolean;
    enableAgentOS: boolean;
    enableRevenueTracking: boolean;
    enableOfflineMode: boolean;
    enablePushNotifications: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
    enableDarkMode: true,
    enableAgentOS: true,
    enableRevenueTracking: true,
    enableOfflineMode: true,
    enablePushNotifications: false,
};

export function useFeatureFlags(): FeatureFlags {
    const [flags] = usePersistedState<FeatureFlags>('feature-flags', DEFAULT_FLAGS);
    return flags;
}

export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

export function usePrefetch(urls: string[]): void {
    useEffect(() => {
        const links: HTMLLinkElement[] = [];

        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
            links.push(link);
        });

        return () => { links.forEach(link => link.remove()); };
    }, [urls]);
}
