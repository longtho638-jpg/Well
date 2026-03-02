/**
 * Agent Workspace Analyzer — Types (Biome Workspace Pattern)
 *
 * Extracted from agent-workspace-analyzer-biome-pattern.ts.
 * Contains: AgentDependency, AgentCapabilities, WorkspaceAnalysis, WorkspaceConfig.
 */

/** Agent dependency declaration */
export interface AgentDependency {
  agentName: string;
  /** What this agent requires from the dependency */
  requires: string[];
  optional?: boolean;
}

/** Agent capability flags (biome FileFeatures equivalent) */
export interface AgentCapabilities {
  agentName: string;
  canExecute: boolean;
  canReceiveEvents: boolean;
  canEmitEvents: boolean;
  hasCredentials: boolean;
  hasMemory: boolean;
  eventChannels: string[];
}

/** Dependency graph edge */
export interface GraphEdge {
  from: string;
  to: string;
  type: 'depends-on' | 'emits-to' | 'reads-from';
}

/** Workspace analysis result */
export interface WorkspaceAnalysis {
  totalAgents: number;
  agentCapabilities: AgentCapabilities[];
  dependencyGraph: GraphEdge[];
  circularDependencies: string[][];
  orphanedAgents: string[];
  missingDependencies: Array<{ agent: string; missing: string }>;
  healthScore: number;
}

/** Workspace configuration (biome biome.json equivalent) */
export interface WorkspaceConfig {
  /** Agents to include in analysis */
  include: string[];
  /** Agents to exclude */
  exclude: string[];
  /** Strict mode: fail on warnings */
  strict: boolean;
}
