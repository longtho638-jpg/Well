/**
 * Agent Incremental Computation — Biome Incremental Pattern
 *
 * Maps biome's demand-driven recomputation to agent result caching.
 * Only recompute agent outputs when inputs change (dirty tracking).
 *
 * Biome concepts mapped:
 * - Salsa-style incremental: input fingerprint → cached output
 * - Dirty flag: mark inputs changed → invalidate downstream
 * - Dependency tracking: which agents depend on which inputs
 *
 * Pattern source: biomejs/biome workspace incremental analysis
 */

// ─── Types ──────────────────────────────────────────────────

/** Cache entry with fingerprint for staleness detection */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  fingerprint: string;
  computedAt: string;
  hits: number;
  dependencies: string[];
}

/** Computation function that produces a cacheable result */
export type ComputeFn<T = unknown> = (inputs: Record<string, unknown>) => T | Promise<T>;

/** Cache statistics */
export interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  invalidations: number;
  hitRate: number;
}

// ─── Incremental Engine ─────────────────────────────────────

/**
 * Singleton incremental computation cache.
 * Mirrors biome's Salsa-inspired dirty-check pattern.
 */
class AgentIncrementalComputation {
  private cache = new Map<string, CacheEntry>();
  private computeFns = new Map<string, ComputeFn>();
  private stats = { hits: 0, misses: 0, invalidations: 0 };

  /** Register a computation function for a cache key */
  register<T>(key: string, fn: ComputeFn<T>, dependencies: string[] = []): void {
    this.computeFns.set(key, fn as ComputeFn);
    // Pre-create empty cache entry
    if (!this.cache.has(key)) {
      this.cache.set(key, {
        key,
        value: undefined,
        fingerprint: '',
        computedAt: '',
        hits: 0,
        dependencies,
      });
    }
  }

  /** Get cached value or recompute if stale */
  async get<T>(key: string, inputs: Record<string, unknown>): Promise<T | undefined> {
    const entry = this.cache.get(key);
    const fn = this.computeFns.get(key);
    if (!fn) return undefined;

    const fp = this.fingerprint(inputs);

    // Cache hit — fingerprint matches
    if (entry && entry.fingerprint === fp && entry.computedAt) {
      this.stats.hits++;
      entry.hits++;
      return entry.value as T;
    }

    // Cache miss — recompute
    this.stats.misses++;
    const value = await fn(inputs);
    this.cache.set(key, {
      key,
      value,
      fingerprint: fp,
      computedAt: new Date().toISOString(),
      hits: 0,
      dependencies: entry?.dependencies ?? [],
    });
    return value as T;
  }

  /** Invalidate a cache entry and all its dependents (cascade) */
  invalidate(key: string): void {
    if (!this.cache.has(key)) return;
    this.stats.invalidations++;

    // Reset fingerprint to force recompute
    const entry = this.cache.get(key);
    if (entry) {
      entry.fingerprint = '';
      entry.computedAt = '';
    }

    // Cascade invalidation to dependents
    for (const [k, e] of this.cache) {
      if (e.dependencies.includes(key)) {
        this.invalidate(k);
      }
    }
  }

  /** Invalidate all cache entries */
  invalidateAll(): void {
    for (const entry of this.cache.values()) {
      entry.fingerprint = '';
      entry.computedAt = '';
    }
    this.stats.invalidations++;
  }

  /** Check if a cache entry is fresh */
  isFresh(key: string, inputs: Record<string, unknown>): boolean {
    const entry = this.cache.get(key);
    if (!entry || !entry.computedAt) return false;
    return entry.fingerprint === this.fingerprint(inputs);
  }

  /** Get cache statistics */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      totalEntries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      invalidations: this.stats.invalidations,
      hitRate: total === 0 ? 0 : this.stats.hits / total,
    };
  }

  /** List all cache keys with freshness status */
  listEntries(): Array<{ key: string; fresh: boolean; hits: number; dependencies: string[] }> {
    return Array.from(this.cache.values()).map((e) => ({
      key: e.key,
      fresh: !!e.computedAt,
      hits: e.hits,
      dependencies: e.dependencies,
    }));
  }

  /** Clear all cache and registrations */
  clear(): void {
    this.cache.clear();
    this.computeFns.clear();
    this.stats = { hits: 0, misses: 0, invalidations: 0 };
  }

  /** Simple JSON fingerprint for staleness detection */
  private fingerprint(inputs: Record<string, unknown>): string {
    try {
      return JSON.stringify(inputs, Object.keys(inputs).sort());
    } catch {
      return String(Date.now());
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentIncrementalComputation = new AgentIncrementalComputation();
