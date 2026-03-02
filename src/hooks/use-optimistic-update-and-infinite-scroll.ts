/**
 * Optimistic Update and Infinite Scroll Hooks — useOptimisticUpdate with rollback on error, and useInfiniteScroll with IntersectionObserver
 */

import { useState, useCallback, useRef, useEffect } from 'react';

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

        setState({ data: newData as T, isPending: true, error: null });

        try {
            const persisted = await persistFn(newData as T);
            setState({ data: persisted, isPending: false, error: null });
        } catch (error) {
            setState({ data: previousData.current, isPending: false, error: error as Error });
            throw error;
        }
    }, [state.data, persistFn]);

    return [state, updateOptimistically];
}

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

        return () => { observerRef.current?.disconnect(); };
    }, [loadMore, hasMore, threshold, rootMargin]);

    return { targetRef, isLoading };
}
