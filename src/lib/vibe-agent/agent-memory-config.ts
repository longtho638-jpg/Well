/**
 * Agent Memory Config — Mem0-inspired configuration & provider factory.
 *
 * Maps Mem0's MemoryConfig + provider factory pattern to a type-safe
 * configuration system for agent memory backends.
 *
 * Mem0 concepts mapped:
 * - MemoryConfig: Declarative config object with provider/config pairs
 * - Provider Factory: Registry of storage backends (Qdrant, Chroma, Supabase)
 * - Default Config: Sensible defaults with zero-config startup
 * - Config Validation: Pydantic-style validation via TypeScript types
 *
 * Pattern source: mem0ai/mem0 configs/base.py + vector_stores/
 */

// ─── Storage Provider Types (Mem0: vector_stores/*.py) ──────

/** Supported storage backend types (Mem0: 20+ providers, we start lean) */
export type MemoryStorageProvider = 'in-memory' | 'local-storage' | 'supabase';

/** Storage provider configuration */
export interface MemoryStorageConfig {
  provider: MemoryStorageProvider;
  /** Collection/table name (Mem0: collection_name) */
  collectionName: string;
  /** Max memories per tenant (prevent unbounded growth) */
  maxMemoriesPerTenant: number;
}

/** In-memory storage config (Mem0: Qdrant in-memory mode for dev) */
export interface InMemoryStorageConfig extends MemoryStorageConfig {
  provider: 'in-memory';
}

/** LocalStorage config (browser-side persistence) */
export interface LocalStorageConfig extends MemoryStorageConfig {
  provider: 'local-storage';
  /** localStorage key prefix */
  keyPrefix: string;
}

/** Supabase storage config (Mem0: supabase.py vector store) */
export interface SupabaseStorageConfig extends MemoryStorageConfig {
  provider: 'supabase';
  /** Supabase table name */
  tableName: string;
}

// ─── Tenant Isolation (Mem0: user_id, agent_id, run_id) ─────

/** Multi-tenant scope for memory isolation (Mem0: filters parameter) */
export interface MemoryTenantScope {
  userId?: string;
  agentId?: string;
  sessionId?: string;
}

// ─── Memory Entry Types ─────────────────────────────────────

/** Memory category (Mem0: memory categories from fact extraction) */
export type MemoryCategory =
  | 'preference'    // User preferences (Mem0: "I prefer coffee")
  | 'fact'          // Factual information (Mem0: "User lives in NYC")
  | 'interaction'   // Interaction history (Mem0: episodic memory)
  | 'procedure'     // Learned workflows (Mem0: procedural memory)
  | 'context';      // Session context (Mem0: working memory snapshot)

/** A single memory entry (Mem0: Memory object from add() response) */
export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  /** Multi-tenant scope */
  scope: MemoryTenantScope;
  /** Arbitrary metadata (Mem0: metadata parameter) */
  metadata: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Relevance score from search (0-1, Mem0: score field) */
  score?: number;
  /** Version for conflict resolution (Mem0: history tracking) */
  version: number;
}

/** Memory history event (Mem0: SQLite history tracking) */
export interface MemoryHistoryEvent {
  memoryId: string;
  action: 'add' | 'update' | 'delete';
  timestamp: string;
  previousContent?: string;
  newContent?: string;
  actor: string;
}

// ─── Full Config (Mem0: MemoryConfig) ───────────────────────

/** Complete memory system configuration (Mem0: config dict) */
export interface AgentMemoryConfig {
  /** Storage backend configuration */
  storage: MemoryStorageConfig;
  /** Enable memory consolidation (Mem0: consolidation feature) */
  enableConsolidation: boolean;
  /** Max memories before triggering consolidation */
  consolidationThreshold: number;
  /** Enable history tracking (Mem0: SQLite audit trail) */
  enableHistory: boolean;
  /** Max history events to retain per memory */
  maxHistoryPerMemory: number;
}

// ─── Default Config (Mem0: default_config in main.py) ───────

/** Default configuration — in-memory for development */
export const DEFAULT_MEMORY_CONFIG: AgentMemoryConfig = {
  storage: {
    provider: 'in-memory',
    collectionName: 'agent_memories',
    maxMemoriesPerTenant: 1000,
  },
  enableConsolidation: true,
  consolidationThreshold: 100,
  enableHistory: true,
  maxHistoryPerMemory: 50,
};

// ─── Config Factory (Mem0: config resolution pattern) ───────

/**
 * Create a memory config with defaults applied.
 * Follows Mem0's pattern of deep-merging user config with defaults.
 */
export function createMemoryConfig(
  overrides?: Partial<AgentMemoryConfig>,
): AgentMemoryConfig {
  if (!overrides) return { ...DEFAULT_MEMORY_CONFIG };

  return {
    ...DEFAULT_MEMORY_CONFIG,
    ...overrides,
    storage: {
      ...DEFAULT_MEMORY_CONFIG.storage,
      ...overrides.storage,
    },
  };
}

// ─── Tenant Scope Utilities ─────────────────────────────────

/**
 * Build a composite key for tenant-scoped storage.
 * Mem0 pattern: filters={user_id: "x", agent_id: "y"}
 */
export function buildTenantKey(scope: MemoryTenantScope): string {
  const parts: string[] = [];
  if (scope.userId) parts.push(`u:${scope.userId}`);
  if (scope.agentId) parts.push(`a:${scope.agentId}`);
  if (scope.sessionId) parts.push(`s:${scope.sessionId}`);
  return parts.join('|') || 'global';
}

/**
 * Check if a memory entry matches the given scope filter.
 * Mem0 pattern: filter matching in search() and get_all()
 */
export function matchesScope(
  entry: MemoryEntry,
  filter: MemoryTenantScope,
): boolean {
  if (filter.userId && entry.scope.userId !== filter.userId) return false;
  if (filter.agentId && entry.scope.agentId !== filter.agentId) return false;
  if (filter.sessionId && entry.scope.sessionId !== filter.sessionId) return false;
  return true;
}
