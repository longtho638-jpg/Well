/**
 * Agent Memory Store — Search, Add, List Parameter Types (Mem0 pattern)
 *
 * Extracted from agent-memory-store-mem0-pattern.ts.
 * Contains AddMemoryParams, SearchMemoryParams, MemorySearchResult, ListMemoryParams.
 */

import type { MemoryCategory, MemoryEntry, MemoryTenantScope } from './agent-memory-config';

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
