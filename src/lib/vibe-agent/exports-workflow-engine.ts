/**
 * Vibe Agent SDK — Workflow Engine Barrel
 *
 * Re-exports: n8n-pattern workflow node graph, node type registry,
 * credential manager, expression resolver, execution queue, error workflow,
 * workflow execution context, Cal.com services/registry/automation engine.
 */

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

// Script Runner — zx fluent shell scripting for agent task chains
export { agentScriptRunner } from './agent-script-runner-zx-pattern';
export type {
  ActionOutput,
  ScriptStep,
  ScriptContext,
  ScriptResult,
} from './agent-script-runner-zx-pattern';

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
