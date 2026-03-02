/**
 * Async Cache Strategies — cacheAsync with TTL, stale-while-revalidate (SWR), and request deduplication
 */

import { createLogger } from './logger';
import { MemoryCache } from './cache-memory-store-with-ttl-expiry';

const logger = createLogger('cache');

/**
 * Cache async function with TTL — dedupes in-flight requests and caches resolved values
 */
export function cacheAsync<Args extends unknown[], Result>(
    fn: (...args: Args) => Promise<Result>,
    options: {
        keyFn?: (...args: Args) => string;
        ttlMs?: number;
    } = {}
): (...args: Args) => Promise<Result> {
    const { keyFn = (...args) => JSON.stringify(args), ttlMs = 60000 } = options;
    const asyncCache = new MemoryCache<Result>(ttlMs);
    const pending = new Map<string, Promise<Result>>();

    return async (...args: Args): Promise<Result> => {
        const key = keyFn(...args);

        const cached = asyncCache.get(key);
        if (cached !== null) return cached;

        const pendingPromise = pending.get(key);
        if (pendingPromise) return pendingPromise;

        const promise = fn(...args).then(result => {
            asyncCache.set(key, result);
            pending.delete(key);
            return result;
        }).catch(error => {
            pending.delete(key);
            throw error;
        });

        pending.set(key, promise);
        return promise;
    };
}

interface SWRResult<T> {
    data: T | null;
    isValidating: boolean;
    error: Error | null;
}

/**
 * Stale-while-revalidate — returns cached data immediately and revalidates in background
 */
export async function swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttlMs?: number; staleTimeMs?: number } = {}
): Promise<SWRResult<T>> {
    const { ttlMs = 60000, staleTimeMs = ttlMs * 2 } = options;
    const swrCache = new MemoryCache<{ data: T; fetchedAt: number }>(staleTimeMs);

    const entry = swrCache.get(key);

    if (entry) {
        const isStale = Date.now() - entry.fetchedAt > ttlMs;

        if (isStale) {
            fetcher().then(data => {
                swrCache.set(key, { data, fetchedAt: Date.now() });
            }).catch((err: unknown) => {
                logger.warn('[cache] SWR background revalidation failed', { key, err });
            });
            return { data: entry.data, isValidating: true, error: null };
        }

        return { data: entry.data, isValidating: false, error: null };
    }

    try {
        const data = await fetcher();
        swrCache.set(key, { data, fetchedAt: Date.now() });
        return { data, isValidating: false, error: null };
    } catch (error) {
        return { data: null, isValidating: false, error: error as Error };
    }
}

const inflight = new Map<string, Promise<unknown>>();

/**
 * Dedupe identical concurrent requests — returns the same in-flight promise for duplicate keys
 */
export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (inflight.has(key)) return inflight.get(key) as Promise<T>;

    const promise = fn().finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
}
