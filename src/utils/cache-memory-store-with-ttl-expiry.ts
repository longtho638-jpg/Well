/**
 * Memory Cache Store with TTL Expiry — in-memory Map-based cache with automatic expiration and memoize helper
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export class MemoryCache<T = unknown> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTtl: number;

    constructor(defaultTtlMs = 5 * 60 * 1000) {
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
            if (now > entry.expiresAt) this.cache.delete(key);
        }
    }
}

export const cache = new MemoryCache();

/**
 * Memoize function result (infinite TTL, no eviction)
 */
export function memoize<Args extends unknown[], Result>(
    fn: (...args: Args) => Result,
    keyFn: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => Result {
    const memoCache = new Map<string, Result>();

    return (...args: Args): Result => {
        const key = keyFn(...args);
        if (memoCache.has(key)) return memoCache.get(key) as Result;
        const result = fn(...args);
        memoCache.set(key, result);
        return result;
    };
}
