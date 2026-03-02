/**
 * Caching Utilities — barrel re-exporting memory cache, memoize, async cache, SWR, and request deduplication
 * Phase 8: Data and Components
 */

export { MemoryCache, cache, memoize } from './cache-memory-store-with-ttl-expiry';
export { cacheAsync, swr, dedupe } from './cache-async-strategies-swr-and-request-deduplication';
