/**
 * Vibe Agent SDK — Core Agent Patterns Barrel
 *
 * Re-exports: base types, registry, event bus, domain events,
 * health/heartbeat monitors, notification dispatcher, metrics,
 * status page, memory config & store, workflow execution context.
 */

// Types
export type {
  VibeAgentFunction,
  VibeAgentInput,
  VibeAgentKPI,
  VibeAgentPolicy,
  VibeAgentDefinition,
  VibeAgentLog,
  VibeAgentState,
  VibeAgentDeps,
} from './types';

// Base agent abstract class
export { VibeBaseAgent } from './base-agent-abstract';

// Registry
export {
  VibeAgentRegistry,
  createAgentRegistry,
} from './agent-registry-singleton';

// Event Bus — Electron IPC EventEmitter pattern for inter-agent communication
export { agentEventBus } from './agent-event-bus';
export type {
  AgentEventChannel,
  AgentEvent,
  AgentLifecyclePayload,
} from './agent-event-bus';

// Domain Event Dispatcher — Cal.com webhook dispatcher pattern
export { domainEventDispatcher } from './domain-event-dispatcher';
export type {
  OrderEvent,
  CommissionEvent,
  RankUpgradeEvent,
  DomainEventMap,
} from './domain-event-dispatcher';

// Agent Health Monitor — Electron crash recovery + circuit breaker
export { agentHealthMonitor } from './agent-health-monitor';
export type { AgentHealthStatus } from './agent-health-monitor';

// Agent Heartbeat Monitor — Uptime-Kuma heartbeat loop pattern
export { agentHeartbeatMonitor } from './agent-heartbeat-monitor';
export type {
  HeartbeatStatus,
  HeartbeatConfig,
  HeartbeatRecord,
  MonitoredAgent,
} from './agent-heartbeat-monitor';

// Agent Memory Config — Mem0-inspired configuration & provider factory
export { createMemoryConfig, buildTenantKey, matchesScope, DEFAULT_MEMORY_CONFIG } from './agent-memory-config';
export type {
  MemoryStorageProvider,
  MemoryStorageConfig,
  MemoryTenantScope,
  MemoryCategory,
  MemoryEntry,
  MemoryHistoryEvent,
  AgentMemoryConfig,
} from './agent-memory-config';

// Agent Memory Store — Mem0-inspired intelligent memory layer (add/search/update/delete)
export { AgentMemoryStore, agentMemoryStore } from './agent-memory-store-mem0-pattern';
export type {
  AddMemoryParams,
  SearchMemoryParams,
  MemorySearchResult,
  ListMemoryParams,
} from './agent-memory-store-mem0-pattern';
