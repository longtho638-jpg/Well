/**
 * Vibe Agent SDK — Communication & AGI Commerce Barrel
 *
 * Re-exports: notification dispatcher, message queue (QStash),
 * LLM router (LiteLLM), model fallback (LiteLLM), agent bridge (Electron),
 * worker supervisor (Electron), Vercel AI adapter, AGI core engine.
 */

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

// Message Queue — QStash serverless queue with DLQ & topic fan-out
export { agentMessageQueue } from './agent-message-queue-qstash-pattern';
export type {
  MessageStatus,
  QueueMessage,
  ScheduledMessage,
  MessageTopic,
  PublishOptions,
} from './agent-message-queue-qstash-pattern';

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

// Agent Bridge — Electron contextBridge pattern for UI/Agent isolation
export { vibeAgentBridge } from './agent-bridge-electron-pattern';
export type { VibeAgentBridge } from './agent-bridge-electron-pattern';

// Agent Worker Supervisor — Electron main process supervisor pattern
export { agentWorkerSupervisor } from './agent-worker-supervisor-electron-pattern';

// Vercel AI Adapter — streamVibeText + streamVibeAgent + getVibeModel
export { getVibeModel, streamVibeText, streamVibeAgent } from './agent-vercel-ai-adapter';
export type { VibeStreamOptions, VibeAgentOptions } from './agent-vercel-ai-adapter';

// AGI Tool Registry — typed commerce tools (searchProducts, createOrder, etc.)
export { agiToolRegistry } from './agi-tool-registry';
export type {
  AGIToolRegistry,
  ProductSearchResult,
  ProductDetailResult,
  OrderResult,
  CommissionResult,
  DistributorRankResult,
} from './agi-tool-registry';

// AGI ReAct Reasoning Loop — Thought → Action → Observation cycle
export { executeReActLoop } from './agi-react-reasoning-loop';
export type {
  ReasoningStepType,
  ReasoningStep,
  ReasoningTrace,
  ToolCallInfo,
  ReActLoopOptions,
} from './agi-react-reasoning-loop';

// AGI Model Tier Router — fast/balanced/powerful tier selection
export { selectModelTier, getModelNameForTier, TIER_MODELS } from './agi-model-tier-router';
export type { ModelTier, TierContext, TierSelection } from './agi-model-tier-router';

// AGI Commerce Tools — concrete tool implementations (search, order, rank, commission, health)
export {
  searchProducts,
  createOrder,
  checkDistributorRank,
  calculateCommission,
  getHealthRecommendation,
  SearchProductsSchema,
  CreateOrderSchema,
  CheckRankSchema,
  CalculateCommissionSchema,
  HealthRecommendationSchema,
} from './agi-commerce-tools';
export type { HealthRecommendationResult } from './agi-commerce-tools';

// AGI Commerce Orchestrator — Plan-Execute-Verify for commerce flows
export { commerceOrchestrator } from './agi-commerce-orchestrator';
export type {
  OrchestratorStatus,
  CommerceGoal,
  OrchestratorResult,
} from './agi-commerce-orchestrator';
