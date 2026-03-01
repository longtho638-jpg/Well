/**
 * Agent Workspace Analyzer — Biome Workspace Pattern
 *
 * Maps biome's project-wide analysis to cross-agent validation.
 * Discovers agent dependencies, detects circular refs, validates config.
 *
 * Biome concepts mapped:
 * - Workspace: project-level analysis scope
 * - FileFeatures: per-file capability flags → per-agent capability flags
 * - ProjectGraph: dependency graph across agents
 * - Configuration: workspace-level settings override
 *
 * Pattern source: biomejs/biome workspace/src/workspace.rs
 */

// ─── Types ──────────────────────────────────────────────────

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
interface GraphEdge {
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

// ─── Analyzer ───────────────────────────────────────────────

const DEFAULT_CONFIG: WorkspaceConfig = {
  include: [],
  exclude: [],
  strict: false,
};

/**
 * Singleton analyzer for cross-agent workspace validation.
 * Mirrors biome's Workspace trait.
 */
class AgentWorkspaceAnalyzer {
  private capabilities = new Map<string, AgentCapabilities>();
  private dependencies = new Map<string, AgentDependency[]>();
  private config: WorkspaceConfig = { ...DEFAULT_CONFIG };

  /** Configure workspace analysis scope */
  configure(config: Partial<WorkspaceConfig>): void {
    Object.assign(this.config, config);
  }

  /** Register an agent's capabilities */
  registerCapabilities(caps: AgentCapabilities): void {
    this.capabilities.set(caps.agentName, caps);
  }

  /** Register an agent's dependencies */
  registerDependencies(agentName: string, deps: AgentDependency[]): void {
    this.dependencies.set(agentName, deps);
  }

  /** Run full workspace analysis */
  analyze(): WorkspaceAnalysis {
    const agents = this.getIncludedAgents();
    const graph = this.buildGraph(agents);
    const circular = this.detectCircular(agents);
    const orphaned = this.findOrphaned(agents, graph);
    const missing = this.findMissing(agents);

    const totalIssues = circular.length + orphaned.length + missing.length;
    const healthScore = agents.length === 0 ? 100 : Math.max(0, 100 - totalIssues * 10);

    return {
      totalAgents: agents.length,
      agentCapabilities: agents.map((n) => this.capabilities.get(n)!).filter(Boolean),
      dependencyGraph: graph,
      circularDependencies: circular,
      orphanedAgents: orphaned,
      missingDependencies: missing,
      healthScore,
    };
  }

  /** Get all agent names in scope */
  private getIncludedAgents(): string[] {
    let agents = Array.from(this.capabilities.keys());
    if (this.config.include.length > 0) {
      agents = agents.filter((a) => this.config.include.includes(a));
    }
    agents = agents.filter((a) => !this.config.exclude.includes(a));
    return agents;
  }

  /** Build dependency graph edges */
  private buildGraph(agents: string[]): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const agentSet = new Set(agents);

    for (const agent of agents) {
      const deps = this.dependencies.get(agent) ?? [];
      for (const dep of deps) {
        if (agentSet.has(dep.agentName)) {
          edges.push({ from: agent, to: dep.agentName, type: 'depends-on' });
        }
      }
    }
    return edges;
  }

  /** Detect circular dependencies using DFS */
  private detectCircular(agents: string[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (stack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) cycles.push(path.slice(cycleStart));
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      stack.add(node);
      path.push(node);

      const deps = this.dependencies.get(node) ?? [];
      for (const dep of deps) dfs(dep.agentName, [...path]);

      stack.delete(node);
    };

    for (const agent of agents) dfs(agent, []);
    return cycles;
  }

  /** Find agents with no connections */
  private findOrphaned(agents: string[], graph: GraphEdge[]): string[] {
    const connected = new Set<string>();
    for (const edge of graph) {
      connected.add(edge.from);
      connected.add(edge.to);
    }
    return agents.filter((a) => !connected.has(a));
  }

  /** Find missing required dependencies */
  private findMissing(agents: string[]): Array<{ agent: string; missing: string }> {
    const agentSet = new Set(agents);
    const missing: Array<{ agent: string; missing: string }> = [];

    for (const agent of agents) {
      const deps = this.dependencies.get(agent) ?? [];
      for (const dep of deps) {
        if (!dep.optional && !agentSet.has(dep.agentName)) {
          missing.push({ agent, missing: dep.agentName });
        }
      }
    }
    return missing;
  }

  /** Clear all registrations */
  clear(): void {
    this.capabilities.clear();
    this.dependencies.clear();
    this.config = { ...DEFAULT_CONFIG };
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentWorkspaceAnalyzer = new AgentWorkspaceAnalyzer();
