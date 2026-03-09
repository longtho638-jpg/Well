/**
 * KV Cache Utilities for RaaS Gateway Worker
 *
 * Provides typed helpers for Cloudflare KV operations
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface LicenseCacheEntry {
  isValid: boolean
  tier: string
  status: string
  features: Record<string, boolean>
  expiresAt?: string
  validatedAt: number
}

/**
 * Get value from KV with type safety
 */
export async function getFromKV<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  try {
    const value = await kv.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  } catch (error) {
    console.error('[KVCache] Get error:', error)
    return null
  }
}

/**
 * Put value to KV with TTL
 */
export async function putToKV<T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    })
  } catch (error) {
    console.error('[KVCache] Put error:', error)
    throw error
  }
}

/**
 * Delete value from KV
 */
export async function deleteFromKV(
  kv: KVNamespace,
  key: string
): Promise<void> {
  try {
    await kv.delete(key)
  } catch (error) {
    console.error('[KVCache] Delete error:', error)
    throw error
  }
}

/**
 * Build cache key with namespace prefix
 */
export function buildCacheKey(namespace: string, ...parts: string[]): string {
  return [namespace, ...parts].join(':')
}

/**
 * Cache keys for license validation
 */
export const CacheKeys = {
  license: (licenseKey: string) => buildCacheKey('license', licenseKey.toLowerCase()),
  suspension: (licenseKey: string, timestamp: number) =>
    buildCacheKey('suspension', licenseKey.toLowerCase(), String(timestamp)),
  suspensionList: (licenseKey: string) =>
    buildCacheKey('suspensions', licenseKey.toLowerCase()),
}
