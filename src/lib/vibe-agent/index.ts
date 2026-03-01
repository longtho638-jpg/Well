/**
 * Vibe Agent SDK — Entry Point
 *
 * Provider-agnostic agent framework for RaaS projects.
 * Provides: abstract base agent, typed definitions, singleton registry.
 *
 * Usage:
 *   import { VibeBaseAgent, createAgentRegistry } from '@/lib/vibe-agent';
 *   import type { VibeAgentDefinition } from '@/lib/vibe-agent';
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
