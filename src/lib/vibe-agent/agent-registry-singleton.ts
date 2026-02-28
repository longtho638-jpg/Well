/**
 * Vibe Agent SDK — Generic Agent Registry (Singleton)
 *
 * Provider-agnostic agent registry for RaaS projects.
 * Register, lookup, and filter agents by name or business function.
 *
 * Unlike app-specific registries, this contains NO hardcoded agents.
 * Consumers register their own agents after instantiation.
 *
 * Usage:
 *   import { createAgentRegistry } from '@/lib/vibe-agent';
 *   const registry = createAgentRegistry();
 *   registry.register(new MyCustomAgent());
 */

import type { VibeAgentDefinition, VibeAgentFunction } from './types';
import type { VibeBaseAgent } from './base-agent-abstract';

// ─── Registry Class ──────────────────────────────────────────

export class VibeAgentRegistry {
  private agents: Map<string, VibeBaseAgent> = new Map();

  /** Register a new agent */
  register(agent: VibeBaseAgent): void {
    this.agents.set(agent.getDefinition().agent_name, agent);
  }

  /** Get an agent by name */
  get(agentName: string): VibeBaseAgent | undefined {
    return this.agents.get(agentName);
  }

  /** Get all registered agents */
  getAll(): VibeBaseAgent[] {
    return Array.from(this.agents.values());
  }

  /** Filter agents by business function */
  getByFunction(fn: VibeAgentFunction): VibeBaseAgent[] {
    return this.getAll().filter(
      (agent) => agent.getDefinition().business_function === fn,
    );
  }

  /** List all agent definitions (metadata only, no instances) */
  listDefinitions(): VibeAgentDefinition[] {
    return this.getAll().map((a) => a.getDefinition());
  }

  /** Total number of registered agents */
  count(): number {
    return this.agents.size;
  }

  /** Remove an agent by name */
  unregister(agentName: string): boolean {
    return this.agents.delete(agentName);
  }

  /** Clear all agents */
  clear(): void {
    this.agents.clear();
  }
}

// ─── Factory ─────────────────────────────────────────────────

/** Create a fresh agent registry instance */
export function createAgentRegistry(): VibeAgentRegistry {
  return new VibeAgentRegistry();
}
