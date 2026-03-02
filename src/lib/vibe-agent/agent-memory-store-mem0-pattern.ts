/**
 * Agent Memory Store — Mem0-inspired intelligent memory layer.
 *
 * Core operations: add, search, update, delete, getAll (Mem0 CRUD parity).
 * Multi-tenant isolation, history tracking, dedup, consolidation.
 *
 * Pattern source: mem0ai/mem0 memory/main.py
 */

import type {
  AgentMemoryConfig,
  MemoryEntry,
  MemoryHistoryEvent,
  MemoryTenantScope,
} from './agent-memory-config';
import {
  buildTenantKey,
  createMemoryConfig,
  matchesScope,
} from './agent-memory-config';

export type { AddMemoryParams, SearchMemoryParams, MemorySearchResult, ListMemoryParams } from './agent-memory-store-search-params-types';
import type { AddMemoryParams, SearchMemoryParams, MemorySearchResult, ListMemoryParams } from './agent-memory-store-search-params-types';

import {
  tokenize,
  computeRelevance,
  computeSimilarity,
} from './agent-memory-store-text-similarity-utils';

// ─── Memory Store (Mem0: Memory class) ───────────────────────

/**
 * Agent Memory Store — Mem0-inspired intelligent memory layer.
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

  // ─── ADD (Mem0: Memory.add()) ───────────────────────────

  add(params: AddMemoryParams): MemoryEntry {
    const { content, category, scope, metadata = {} } = params;

    const existing = this.findDuplicate(content, scope);
    if (existing) {
      return this.update(existing.id, content, metadata);
    }

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

    if (this.config.enableHistory) {
      this.recordHistory(entry.id, 'add', undefined, content, 'system');
    }

    if (this.config.enableConsolidation) {
      this.maybeConsolidate(scope);
    }

    return entry;
  }

  // ─── SEARCH (Mem0: Memory.search()) ────────────────────

  search(params: SearchMemoryParams): MemorySearchResult[] {
    const { query, scope, category, limit = 10, minScore = 0.1 } = params;
    const queryTerms = tokenize(query);

    if (queryTerms.length === 0) return [];

    const results: MemorySearchResult[] = [];

    for (const entry of this.memories.values()) {
      if (scope && !matchesScope(entry, scope)) continue;
      if (category && entry.category !== category) continue;

      const score = computeRelevance(queryTerms, entry.content);
      if (score >= minScore) {
        results.push({ entry: { ...entry, score }, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  // ─── UPDATE (Mem0: Memory.update()) ────────────────────

  update(memoryId: string, newContent: string, metadata?: Record<string, unknown>): MemoryEntry {
    const entry = this.memories.get(memoryId);
    if (!entry) throw new Error(`Memory not found: ${memoryId}`);

    const previousContent = entry.content;
    entry.content = newContent;
    entry.updatedAt = new Date().toISOString();
    entry.version += 1;
    if (metadata) entry.metadata = { ...entry.metadata, ...metadata };

    if (this.config.enableHistory) {
      this.recordHistory(memoryId, 'update', previousContent, newContent, 'system');
    }

    return entry;
  }

  // ─── DELETE (Mem0: Memory.delete()) ────────────────────

  delete(memoryId: string): boolean {
    const entry = this.memories.get(memoryId);
    if (!entry) return false;

    if (this.config.enableHistory) {
      this.recordHistory(memoryId, 'delete', entry.content, undefined, 'system');
    }

    return this.memories.delete(memoryId);
  }

  // ─── GET / GET ALL ──────────────────────────────────────

  get(memoryId: string): MemoryEntry | undefined {
    return this.memories.get(memoryId);
  }

  getAll(params?: ListMemoryParams): MemoryEntry[] {
    const { scope, category, offset = 0, limit = 50 } = params ?? {};

    let results = Array.from(this.memories.values());

    if (scope) results = results.filter((e) => matchesScope(e, scope));
    if (category) results = results.filter((e) => e.category === category);

    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return results.slice(offset, offset + limit);
  }

  count(scope?: MemoryTenantScope): number {
    if (!scope) return this.memories.size;
    return Array.from(this.memories.values()).filter((e) => matchesScope(e, scope)).length;
  }

  // ─── HISTORY ───────────────────────────────────────────

  getHistory(memoryId: string): MemoryHistoryEvent[] {
    return this.history.filter((h) => h.memoryId === memoryId);
  }

  getAllHistory(): MemoryHistoryEvent[] {
    return [...this.history];
  }

  // ─── CONSOLIDATION ─────────────────────────────────────

  consolidate(scope: MemoryTenantScope): number {
    const tenantMemories = this.getAll({ scope, limit: 10_000 });
    let mergedCount = 0;
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
          if (b.content.length > a.content.length) this.update(a.id, b.content);
          toDelete.push(b.id);
          mergedCount++;
        }
      }
    }

    for (const id of toDelete) this.delete(id);
    return mergedCount;
  }

  // ─── RESET ─────────────────────────────────────────────

  clear(): void {
    this.memories.clear();
    this.history = [];
  }

  getConfig(): AgentMemoryConfig {
    return { ...this.config };
  }

  // ─── Internal ──────────────────────────────────────────

  private findDuplicate(content: string, scope: MemoryTenantScope): MemoryEntry | undefined {
    const tenantMemories = Array.from(this.memories.values()).filter((e) => matchesScope(e, scope));
    for (const entry of tenantMemories) {
      if (computeSimilarity(content, entry.content) > 0.85) return entry;
    }
    return undefined;
  }

  private enforceMemoryLimit(scope: MemoryTenantScope): void {
    const tenantKey = buildTenantKey(scope);
    const tenantMemories = Array.from(this.memories.values())
      .filter((e) => buildTenantKey(e.scope) === tenantKey)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

    while (tenantMemories.length >= this.config.storage.maxMemoriesPerTenant) {
      const oldest = tenantMemories.shift();
      if (oldest) this.delete(oldest.id);
    }
  }

  private maybeConsolidate(scope: MemoryTenantScope): void {
    const count = this.count(scope);
    if (count >= this.config.consolidationThreshold) {
      this.consolidate(scope);
    }
  }

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

// ─── Singleton Factory ────────────────────────────────────────

export const agentMemoryStore = new AgentMemoryStore();
