/**
 * Vibe Agent SDK — Provider-Agnostic Agent Types
 *
 * Reusable interfaces for building agentic systems in RaaS projects.
 * Decoupled from any specific LLM provider, logging framework, or database.
 */

// ─── Agent Identity ──────────────────────────────────────────

/** Business function categories an agent can serve */
export type VibeAgentFunction =
  | 'Market & Research'
  | 'Marketing & Growth'
  | 'Sales & Revenue'
  | 'Customer Success & Support'
  | 'Product & UX'
  | 'Operations & Logistics'
  | 'Risk, Fraud & Compliance'
  | 'Finance & FP&A'
  | 'HR & Talent'
  | 'Data & Analytics'
  | 'IT & Infra / DevOps';

/** Input source descriptor for agent data inputs */
export interface VibeAgentInput {
  source: string;
  dataType: 'CRM' | 'logs' | 'events' | 'email' | 'API' | 'user_input';
  schema?: Record<string, unknown>;
}

// ─── Agent KPIs & Policies ───────────────────────────────────

/** Key Performance Indicator for tracking agent effectiveness */
export interface VibeAgentKPI {
  name: string;
  target: number;
  current?: number;
  unit: string;
}

/** Policy constraint governing agent behavior */
export interface VibeAgentPolicy {
  rule: string;
  enforcement: 'hard' | 'soft';
  notes?: string;
}

// ─── Agent Definition (Schema) ───────────────────────────────

/** Complete definition of an agent's capabilities and constraints */
export interface VibeAgentDefinition {
  agent_name: string;
  business_function: VibeAgentFunction;
  primary_objectives: string[];
  inputs: VibeAgentInput[];
  tools_and_systems: string[];
  core_actions: string[];
  outputs: string[];
  success_kpis: VibeAgentKPI[];
  risk_and_failure_modes: string[];
  human_in_the_loop_points: string[];
  policy_and_constraints: VibeAgentPolicy[];
  visibility: 'user' | 'admin' | 'all';
}

// ─── Agent Execution ─────────────────────────────────────────

/** Structured log entry for agent actions */
export interface VibeAgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  humanApproved?: boolean;
  policyViolations?: string[];
}

/** Aggregate state of the agent runtime */
export interface VibeAgentState {
  activeAgents: Map<string, VibeAgentDefinition>;
  agentLogs: VibeAgentLog[];
  agentMetrics: Map<string, VibeAgentKPI[]>;
}

// ─── Agent Lifecycle Hooks ───────────────────────────────────

/** Dependency injection for agent execution infrastructure */
export interface VibeAgentDeps {
  /** Logger function — agents call this instead of console.* */
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: unknown) => void;
  /** Retry wrapper for external calls */
  retry: <T>(fn: () => Promise<T>, opts?: { maxAttempts?: number; delay?: number }) => Promise<T>;
}
