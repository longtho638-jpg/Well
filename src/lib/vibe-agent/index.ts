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

// Agent Metrics Collector — Netdata real-time monitoring pattern
export {
  agentMetricsCollector,
  initDefaultAgentCharts,
} from './agent-metrics-collector-netdata-pattern';
export type {
  MetricDataPoint,
  MetricChartConfig,
  MetricAlarmDefinition,
  MetricAlarmState,
  MetricQuery,
  MetricQueryResult,
} from './agent-metrics-collector-netdata-pattern';

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

// ─── n8n-io/n8n 10x Architecture Patterns ───────────────────

// Workflow Node Graph Engine — n8n DAG execution with branching & parallel paths
export { workflowGraphEngine } from './workflow-node-graph-engine-n8n-pattern';
export type {
  NodeType,
  NodeOutput,
  WorkflowNode,
  NodeConnection,
  WorkflowGraph,
  NodeExecutionRecord,
  GraphExecutionResult,
} from './workflow-node-graph-engine-n8n-pattern';

// Node Type Registry — n8n declarative node definitions with typed parameters
export { nodeTypeRegistry } from './agent-node-type-registry-n8n-pattern';
export type {
  NodePropertyType,
  NodePropertyDescriptor,
  NodeCredentialRequirement,
  NodeResourceOperation,
  NodeTypeDescriptor,
  NodeValidationResult,
} from './agent-node-type-registry-n8n-pattern';

// Credential Manager — n8n encrypted credential storage & per-agent injection
export { agentCredentialManager } from './agent-credential-manager-n8n-pattern';
export type {
  CredentialFieldDescriptor,
  CredentialTypeDescriptor,
  StoredCredential,
  CredentialTestResult,
} from './agent-credential-manager-n8n-pattern';

// Expression Resolver — n8n template expression evaluation ({{ $input.data }})
export { expressionResolver } from './agent-expression-resolver-n8n-pattern';
export type {
  ExpressionContext,
  ResolvedExpression,
} from './agent-expression-resolver-n8n-pattern';

// Execution Queue — n8n BullMQ scaling pattern (priority, concurrency, rate limit)
export { agentExecutionQueue } from './agent-execution-queue-n8n-pattern';
export type {
  JobStatus,
  JobPriority,
  QueueJob,
  QueueConfig,
  QueueStats,
} from './agent-execution-queue-n8n-pattern';

// Error Workflow — n8n ErrorTrigger + error routing pattern
export { agentErrorWorkflow } from './agent-error-workflow-n8n-pattern';
export type {
  ErrorCategory,
  AgentErrorContext,
  ErrorHandler,
  ErrorRecoveryAction,
} from './agent-error-workflow-n8n-pattern';

// ─── biomejs/biome 10x Architecture Patterns ────────────────

// Lint Rule Engine — biome declarative rule system for agent validation
export { agentLintRuleEngine } from './agent-lint-rule-engine-biome-pattern';
export type {
  RuleSeverity,
  RuleCategory,
  LintDiagnostic,
  LintFix,
  LintRule,
} from './agent-lint-rule-engine-biome-pattern';

// Diagnostic Reporter — biome rich diagnostic output with advice
export { agentDiagnosticReporter } from './agent-diagnostic-reporter-biome-pattern';
export type {
  DiagnosticSeverity,
  DiagnosticLocation,
  DiagnosticAdvice,
  Diagnostic,
} from './agent-diagnostic-reporter-biome-pattern';

// Workspace Analyzer — biome project-wide cross-agent validation
export { agentWorkspaceAnalyzer } from './agent-workspace-analyzer-biome-pattern';
export type {
  AgentDependency,
  AgentCapabilities,
  WorkspaceAnalysis,
  WorkspaceConfig,
} from './agent-workspace-analyzer-biome-pattern';

// Incremental Computation — biome demand-driven recomputation cache
export { agentIncrementalComputation } from './agent-incremental-computation-biome-pattern';
export type {
  CacheEntry,
  CacheStats,
} from './agent-incremental-computation-biome-pattern';

// ─── BerriAI/litellm 10x Architecture Patterns ─────────────

// LLM Router — litellm unified model routing with cost tracking
export { agentLLMRouter } from './agent-llm-router-litellm-pattern';
export type {
  LLMProvider,
  ModelDeployment,
  LLMRequest,
  LLMResponse,
  ModelCostRecord,
} from './agent-llm-router-litellm-pattern';

// Model Fallback — litellm fallback chain with health probing
export { agentModelFallback } from './agent-model-fallback-litellm-pattern';
export type {
  FallbackStrategy,
  HealthProbe,
  FallbackResult,
  ModelRetryConfig,
} from './agent-model-fallback-litellm-pattern';

// ─── highlight/highlight 10x Architecture Patterns ──────────

// Session Replay — highlight.io agent execution recording & replay
export { agentSessionReplay } from './agent-session-replay-highlight-pattern';
export type {
  ReplayEventType,
  ReplayEvent,
  ReplaySession,
  SessionSearchFilter,
} from './agent-session-replay-highlight-pattern';

// ─── formbricks/formbricks 10x Architecture Patterns ────────

// Survey Engine — formbricks declarative survey with targeting & NPS
export { agentSurveyEngine } from './agent-survey-engine-formbricks-pattern';
export type {
  QuestionType,
  SurveyQuestion,
  SurveyTrigger,
  SurveyDefinition,
  SurveyResponse,
  SurveyResults,
} from './agent-survey-engine-formbricks-pattern';

// ─── upstash/qstash 10x Architecture Patterns ──────────────

// Message Queue — QStash serverless queue with DLQ & topic fan-out
export { agentMessageQueue } from './agent-message-queue-qstash-pattern';
export type {
  MessageStatus,
  QueueMessage,
  ScheduledMessage,
  MessageTopic,
  PublishOptions,
} from './agent-message-queue-qstash-pattern';

// ─── google/zx 10x Architecture Patterns ────────────────────

// Script Runner — zx fluent shell scripting for agent task chains
export { agentScriptRunner } from './agent-script-runner-zx-pattern';
export type {
  ActionOutput,
  ScriptStep,
  ScriptContext,
  ScriptResult,
} from './agent-script-runner-zx-pattern';

// ─── electron/electron 10x Architecture Patterns ──────────────

// Agent Bridge — Electron contextBridge pattern for UI/Agent isolation
export { vibeAgentBridge } from './agent-bridge-electron-pattern';
export type { VibeAgentBridge } from './agent-bridge-electron-pattern';

// Agent Worker Supervisor — Electron main process supervisor pattern
export { agentWorkerSupervisor } from './agent-worker-supervisor-electron-pattern';

// ─── Cal.com 10x Architecture Patterns ──────────────────────

// Type-Safe Service Layer — Cal.com Zod-based service pattern
export { BaseService } from './services/base-service';
export {
  AgentService,
  agentService,
  AgentCreateSchema,
  AgentResponseSchema,
} from './services/agent-service';
export type { AgentCreateInput, AgentResponse } from './services/agent-service';

// Integration Registry — Cal.com App Store / Registry pattern
export { IntegrationRegistry, integrationRegistry, IntegrationSchema } from './registry/integration-registry';
export type { Integration } from './registry/integration-registry';
export { INTEGRATION_MANIFESTS, initializeIntegrations } from './registry/integration-manifest';

// Workflow Automation Engine — Cal.com automation engine pattern
export { AutomationEngine, automationEngine, WorkflowDefinitionSchema, TriggerSchema, ActionSchema } from './workflow/automation-engine';
export type { WorkflowDefinition, Trigger, Action } from './workflow/automation-engine';
