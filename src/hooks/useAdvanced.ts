/**
 * Advanced Feature Utilities
 * Phase 4: Enhanced UX
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// OPTIMISTIC UPDATES HOOK
// ============================================================================

interface OptimisticState<T> {
    data: T;
    isPending: boolean;
    error: Error | null;
}

export function useOptimisticUpdate<T>(
    initialData: T,
    persistFn: (data: T) => Promise<T>
): [OptimisticState<T>, (update: Partial<T> | ((prev: T) => T)) => Promise<void>] {
    const [state, setState] = useState<OptimisticState<T>>({
        data: initialData,
        isPending: false,
        error: null,
    });

    const previousData = useRef<T>(initialData);

    const updateOptimistically = useCallback(async (
        update: Partial<T> | ((prev: T) => T)
    ) => {
        previousData.current = state.data;

        const newData = typeof update === 'function'
            ? (update as (prev: T) => T)(state.data)
            : { ...state.data, ...update };

        // Optimistic update
        setState({ data: newData as T, isPending: true, error: null });

        try {
            const persisted = await persistFn(newData as T);
            setState({ data: persisted, isPending: false, error: null });
        } catch (error) {
            // Rollback on error
            setState({ data: previousData.current, isPending: false, error: error as Error });
            throw error;
        }
    }, [state.data, persistFn]);

    return [state, updateOptimistically];
}

// ============================================================================
// INFINITE SCROLL HOOK
// ============================================================================

interface InfiniteScrollOptions {
    threshold?: number;
    rootMargin?: string;
}

export function useInfiniteScroll(
    loadMore: () => Promise<void>,
    hasMore: boolean,
    options: InfiniteScrollOptions = {}
) {
    const { threshold = 0.5, rootMargin = '100px' } = options;
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const targetRef = useRef<HTMLDivElement | null>(null);

    const isLoadingRef = useRef(false);

    useEffect(() => {
        if (!hasMore) return;

        observerRef.current = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && !isLoadingRef.current && hasMore) {
                    isLoadingRef.current = true;
                    setIsLoading(true);
                    try {
                        await loadMore();
                    } finally {
                        isLoadingRef.current = false;
                        setIsLoading(false);
                    }
                }
            },
            { threshold, rootMargin }
        );

        if (targetRef.current) {
            observerRef.current.observe(targetRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [loadMore, hasMore, threshold, rootMargin]);

    return { targetRef, isLoading };
}

// ============================================================================
// PERSISTED STATE HOOK
// ============================================================================

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

// ============================================================================
// FEATURE FLAGS HOOK
// ============================================================================

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

// ============================================================================
// ONLINE STATUS HOOK
// ============================================================================

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

// ============================================================================
// PREFETCH HOOK
// ============================================================================

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

        return () => {
            links.forEach(link => link.remove());
        };
    }, [urls]);
}
