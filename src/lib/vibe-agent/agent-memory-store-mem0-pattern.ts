/**
 * Agent Memory Store — Mem0-inspired intelligent memory layer.
 *
 * Maps Mem0's Memory class to a client-side memory store for RaaS agents.
 * Core operations: add, search, update, delete, getAll (Mem0 CRUD parity).
 *
 * Mem0 concepts mapped:
 * - Memory.add(): LLM-driven fact extraction → store with dedup check
 * - Memory.search(): Keyword-based search with relevance scoring
 * - Memory.update(): Version-tracked updates with history
 * - Memory.delete(): Soft-delete with audit trail
 * - Memory.get_all(): Tenant-scoped listing with pagination
 * - Consolidation: Merge similar memories to reduce bloat (mem0 v1.1+)
 * - History: SQLite-like audit trail for every mutation
 *
 * Pattern source: mem0ai/mem0 memory/main.py
 */

import type {
  AgentMemoryConfig,
  MemoryCategory,
  MemoryEntry,
  MemoryHistoryEvent,
  MemoryTenantScope,
} from './agent-memory-config';
import {
  buildTenantKey,
  createMemoryConfig,
  matchesScope,
} from './agent-memory-config';

// ─── Search & Add Parameters (Mem0: method signatures) ──────

/** Parameters for adding a memory (Mem0: Memory.add() params) */
export interface AddMemoryParams {
  content: string;
  category: MemoryCategory;
  scope: MemoryTenantScope;
  metadata?: Record<string, unknown>;
}

/** Parameters for searching memories (Mem0: Memory.search() params) */
export interface SearchMemoryParams {
  query: string;
  scope?: MemoryTenantScope;
  category?: MemoryCategory;
  /** Max results (Mem0: limit parameter, default: 10) */
  limit?: number;
  /** Min relevance score 0-1 (Mem0: score threshold) */
  minScore?: number;
}

/** Search result with relevance score (Mem0: SearchResult) */
export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
}

/** Parameters for listing all memories (Mem0: Memory.get_all()) */
export interface ListMemoryParams {
  scope?: MemoryTenantScope;
  category?: MemoryCategory;
  /** Pagination offset */
  offset?: number;
  /** Pagination limit (default: 50) */
  limit?: number;
}

// ─── Memory Store (Mem0: Memory class) ──────────────────────

/**
 * Agent Memory Store — Mem0-inspired intelligent memory layer.
 *
 * Singleton per config. Manages add/search/update/delete with
 * multi-tenant isolation, history tracking, and consolidation.
 *
 * Usage:
 *   const store = new AgentMemoryStore();
 *   store.add({ content: "User prefers dark mode", category: 'preference', scope: { userId: 'u1' } });
 *   const results = store.search({ query: "dark mode", scope: { userId: 'u1' } });
 */
export class AgentMemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private history: MemoryHistoryEvent[] = [];
  private config: AgentMemoryConfig;

  constructor(config?: Partial<AgentMemoryConfig>) {
    this.config = createMemoryConfig(config);
  }

  // ─── ADD (Mem0: Memory.add()) ──────────────────────────

  /**
   * Add a memory with deduplication check.
   * Mem0 pattern: LLM extracts facts → checks existing → ADD/UPDATE/DELETE decision.
   * Our simplified version: keyword-based dedup → merge or create new.
   */
  add(params: AddMemoryParams): MemoryEntry {
    const { content, category, scope, metadata = {} } = params;

    // Dedup check (Mem0: LLM-driven, ours: content similarity)
    const existing = this.findDuplicate(content, scope);
    if (existing) {
      // Update existing instead of creating duplicate (Mem0 UPDATE decision)
      return this.update(existing.id, content, metadata);
    }

    // Enforce max memories per tenant (prevent unbounded growth)
    this.enforceMemoryLimit(scope);

    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content,
      category,
      scope,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    this.memories.set(entry.id, entry);

    // Record history (Mem0: SQLite audit trail)
    if (this.config.enableHistory) {
      this.recordHistory(entry.id, 'add', undefined, content, 'system');
    }

    // Trigger consolidation if threshold reached (Mem0: consolidation)
    if (this.config.enableConsolidation) {
      this.maybeConsolidate(scope);
    }

    return entry;
  }

  // ─── SEARCH (Mem0: Memory.search()) ───────────────────

  /**
   * Search memories by keyword relevance.
   * Mem0 pattern: vector similarity search. Ours: keyword TF scoring.
   * Production upgrade: replace with pgvector/Supabase vector search.
   */
  search(params: SearchMemoryParams): MemorySearchResult[] {
    const { query, scope, category, limit = 10, minScore = 0.1 } = params;
    const queryTerms = tokenize(query);

    if (queryTerms.length === 0) return [];

    const results: MemorySearchResult[] = [];

    for (const entry of this.memories.values()) {
      // Scope filter (Mem0: filters parameter)
      if (scope && !matchesScope(entry, scope)) continue;
      // Category filter
      if (category && entry.category !== category) continue;

      // Keyword relevance scoring (simplified TF)
      const score = computeRelevance(queryTerms, entry.content);
      if (score >= minScore) {
        results.push({ entry: { ...entry, score }, score });
      }
    }

    // Sort by relevance descending (Mem0: score ordering)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  // ─── UPDATE (Mem0: Memory.update()) ───────────────────

  /**
   * Update a memory's content with version tracking.
   * Mem0 pattern: update() with history recording.
   */
  update(
    memoryId: string,
    newContent: string,
    metadata?: Record<string, unknown>,
  ): MemoryEntry {
    const entry = this.memories.get(memoryId);
    if (!entry) {
      throw new Error(`Memory not found: ${memoryId}`);
    }

    const previousContent = entry.content;

    entry.content = newContent;
    entry.updatedAt = new Date().toISOString();
    entry.version += 1;
    if (metadata) {
      entry.metadata = { ...entry.metadata, ...metadata };
    }

    // Record history (Mem0: version tracking)
    if (this.config.enableHistory) {
      this.recordHistory(memoryId, 'update', previousContent, newContent, 'system');
    }

    return entry;
  }

  // ─── DELETE (Mem0: Memory.delete()) ───────────────────

  /**
   * Delete a memory with audit trail.
   * Mem0 pattern: delete() with history recording.
   */
  delete(memoryId: string): boolean {
    const entry = this.memories.get(memoryId);
    if (!entry) return false;

    // Record history before deletion
    if (this.config.enableHistory) {
      this.recordHistory(memoryId, 'delete', entry.content, undefined, 'system');
    }

    return this.memories.delete(memoryId);
  }

  // ─── GET / GET ALL (Mem0: Memory.get(), Memory.get_all()) ─

  /** Get a single memory by ID (Mem0: Memory.get()) */
  get(memoryId: string): MemoryEntry | undefined {
    return this.memories.get(memoryId);
  }

  /** List all memories with optional filtering (Mem0: Memory.get_all()) */
  getAll(params?: ListMemoryParams): MemoryEntry[] {
    const { scope, category, offset = 0, limit = 50 } = params ?? {};

    let results = Array.from(this.memories.values());

    if (scope) {
      results = results.filter((e) => matchesScope(e, scope));
    }
    if (category) {
      results = results.filter((e) => e.category === category);
    }

    // Sort by updatedAt descending (most recent first)
    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return results.slice(offset, offset + limit);
  }

  /** Count memories for a scope (Mem0: used for pagination) */
  count(scope?: MemoryTenantScope): number {
    if (!scope) return this.memories.size;
    return Array.from(this.memories.values())
      .filter((e) => matchesScope(e, scope)).length;
  }

  // ─── HISTORY (Mem0: SQLite history tracking) ──────────

  /** Get history for a specific memory (Mem0: memory history API) */
  getHistory(memoryId: string): MemoryHistoryEvent[] {
    return this.history.filter((h) => h.memoryId === memoryId);
  }

  /** Get all history events (Mem0: full audit trail) */
  getAllHistory(): MemoryHistoryEvent[] {
    return [...this.history];
  }

  // ─── CONSOLIDATION (Mem0: memory consolidation feature) ─

  /**
   * Consolidate similar memories within a tenant scope.
   * Mem0 pattern: LLM merges overlapping facts.
   * Our pattern: keyword-based similarity detection + merge.
   */
  consolidate(scope: MemoryTenantScope): number {
    const tenantMemories = this.getAll({ scope, limit: 10_000 });
    let mergedCount = 0;

    // Simple pairwise similarity check
    const toDelete: string[] = [];
    const checked = new Set<string>();

    for (const a of tenantMemories) {
      if (toDelete.includes(a.id) || checked.has(a.id)) continue;
      checked.add(a.id);

      for (const b of tenantMemories) {
        if (a.id === b.id || toDelete.includes(b.id)) continue;
        if (a.category !== b.category) continue;

        const similarity = computeSimilarity(a.content, b.content);
        if (similarity > 0.7) {
          // Merge b into a (keep the newer one's content if longer)
          if (b.content.length > a.content.length) {
            this.update(a.id, b.content);
          }
          toDelete.push(b.id);
          mergedCount++;
        }
      }
    }

    // Delete merged entries
    for (const id of toDelete) {
      this.delete(id);
    }

    return mergedCount;
  }

  // ─── RESET (for testing) ──────────────────────────────

  /** Clear all memories and history */
  clear(): void {
    this.memories.clear();
    this.history = [];
  }

  /** Get config (read-only) */
  getConfig(): AgentMemoryConfig {
    return { ...this.config };
  }

  // ─── Internal ─────────────────────────────────────────

  /** Find duplicate memory by content similarity (Mem0: dedup check) */
  private findDuplicate(
    content: string,
    scope: MemoryTenantScope,
  ): MemoryEntry | undefined {
    const tenantMemories = Array.from(this.memories.values())
      .filter((e) => matchesScope(e, scope));

    for (const entry of tenantMemories) {
      if (computeSimilarity(content, entry.content) > 0.85) {
        return entry;
      }
    }

    return undefined;
  }

  /** Enforce max memories per tenant (prevent unbounded growth) */
  private enforceMemoryLimit(scope: MemoryTenantScope): void {
    const tenantKey = buildTenantKey(scope);
    const tenantMemories = Array.from(this.memories.values())
      .filter((e) => buildTenantKey(e.scope) === tenantKey)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

    // Remove oldest if over limit
    while (tenantMemories.length >= this.config.storage.maxMemoriesPerTenant) {
      const oldest = tenantMemories.shift();
      if (oldest) this.delete(oldest.id);
    }
  }

  /** Trigger consolidation if memory count exceeds threshold */
  private maybeConsolidate(scope: MemoryTenantScope): void {
    const count = this.count(scope);
    if (count >= this.config.consolidationThreshold) {
      this.consolidate(scope);
    }
  }

  /** Record a history event */
  private recordHistory(
    memoryId: string,
    action: MemoryHistoryEvent['action'],
    previousContent: string | undefined,
    newContent: string | undefined,
    actor: string,
  ): void {
    this.history.push({
      memoryId,
      action,
      timestamp: new Date().toISOString(),
      previousContent,
      newContent,
      actor,
    });

    // Trim history per memory (Mem0: history retention)
    const memoryEvents = this.history.filter((h) => h.memoryId === memoryId);
    if (memoryEvents.length > this.config.maxHistoryPerMemory) {
      const toRemove = memoryEvents.length - this.config.maxHistoryPerMemory;
      let removed = 0;
      this.history = this.history.filter((h) => {
        if (h.memoryId === memoryId && removed < toRemove) {
          removed++;
          return false;
        }
        return true;
      });
    }
  }
}

// ─── Text Similarity Utilities ──────────────────────────────

/** Tokenize text into lowercase terms (Mem0: preprocessing) */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Compute keyword relevance score (0-1) for search ranking */
function computeRelevance(queryTerms: string[], content: string): number {
  const contentLower = content.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    if (contentLower.includes(term)) matches++;
  }

  return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}

/** Compute Jaccard similarity between two texts (0-1) */
function computeSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ─── Singleton Factory ──────────────────────────────────────

/** Default global memory store instance */
export const agentMemoryStore = new AgentMemoryStore();
