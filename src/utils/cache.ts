/**
 * Caching Utilities
 * Phase 8: Data and Components
 */

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache<T = unknown> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTtl: number;

    constructor(defaultTtlMs = 5 * 60 * 1000) { // 5 minutes default
        this.defaultTtl = defaultTtlMs;
    }

    set(key: string, value: T, ttlMs?: number): void {
        const expiresAt = Date.now() + (ttlMs ?? this.defaultTtl);
        this.cache.set(key, { data: value, expiresAt });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        this.cleanup();
        return this.cache.size;
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

export const cache = new MemoryCache();

// ============================================================================
// CACHE DECORATORS
// ============================================================================

/**
 * Memoize function result
 */
export function memoize<Args extends unknown[], Result>(
    fn: (...args: Args) => Result,
    keyFn: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => Result {
    const memoCache = new Map<string, Result>();

    return (...args: Args): Result => {
        const key = keyFn(...args);

        if (memoCache.has(key)) {
            return memoCache.get(key)!;
        }

        const result = fn(...args);
        memoCache.set(key, result);
        return result;
    };
}

/**
 * Cache async function with TTL
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

        // Check cache
        const cached = asyncCache.get(key);
        if (cached !== null) return cached;

        // Check pending
        if (pending.has(key)) {
            return pending.get(key)!;
        }

        // Execute and cache
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

// ============================================================================
// STALE-WHILE-REVALIDATE
// ============================================================================

interface SWRResult<T> {
    data: T | null;
    isValidating: boolean;
    error: Error | null;
}

/**
 * Stale-while-revalidate pattern
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
            // Return stale data while revalidating
            fetcher().then(data => {
                swrCache.set(key, { data, fetchedAt: Date.now() });
            }).catch(() => { });

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

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

const inflight = new Map<string, Promise<unknown>>();

/**
 * Dedupe identical concurrent requests
 */
export function dedupe<T>(
    key: string,
    fn: () => Promise<T>
): Promise<T> {
    if (inflight.has(key)) {
        return inflight.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => {
        inflight.delete(key);
    });

    inflight.set(key, promise);
    return promise;
}
