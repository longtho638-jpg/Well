/**
 * Vibe Agent SDK — Monitoring & Observability Barrel
 *
 * Re-exports: metrics collector (Netdata), status page (Uptime-Kuma),
 * session replay (Highlight.io), diagnostic reporter (Biome),
 * workspace analyzer (Biome), lint rule engine (Biome),
 * incremental computation (Biome).
 */

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

// Session Replay — highlight.io agent execution recording & replay
export { agentSessionReplay } from './agent-session-replay-highlight-pattern';
export type {
  ReplayEventType,
  ReplayEvent,
  ReplaySession,
  SessionSearchFilter,
} from './agent-session-replay-highlight-pattern';

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
