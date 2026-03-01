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

// Agent Heartbeat Monitor — Uptime-Kuma heartbeat loop pattern
export { agentHeartbeatMonitor } from './agent-heartbeat-monitor';
export type {
  HeartbeatStatus,
  HeartbeatConfig,
  HeartbeatRecord,
  MonitoredAgent,
} from './agent-heartbeat-monitor';

// Notification Dispatcher — Uptime-Kuma multi-channel notification pattern
export {
  notificationDispatcher,
  consoleLogProvider,
  createInAppProvider,
} from './notification-dispatcher';
export type {
  NotificationChannel,
  AlertSeverity,
  AgentAlert,
  NotificationProvider,
  NotificationRule,
} from './notification-dispatcher';

// Workflow Execution Context — Temporal.io durable workflow pattern
export { executeWorkflow, sendSignal } from './workflow-execution-context';
export type {
  WorkflowStatus,
  StepStatus,
  StepRetryPolicy,
  WorkflowStep,
  StepExecution,
  WorkflowState,
  WorkflowContext,
} from './workflow-execution-context';

// Agent Status Page — Uptime-Kuma public status page pattern
export { agentStatusPage } from './agent-status-page';
export type {
  StatusPageData,
  AgentStatusEntry,
  MonitorGroup,
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from './agent-status-page';
