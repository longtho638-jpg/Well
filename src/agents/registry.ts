import { AgentDefinition, AgentFunction } from '@/types/agentic';
import { BaseAgent } from './core/BaseAgent';
import { ClaudeKitAdapter } from './claudekit/ClaudeKitAdapter';
import { GeminiCoachAgent } from './custom/GeminiCoachAgent';
import { SalesCopilotAgent } from './custom/SalesCopilotAgent';

/**
 * Central registry for all agents in the system.
 * Singleton pattern - there should only be one registry instance.
 */
class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private static instance: AgentRegistry;

  private constructor() {
    this.registerDefaultAgents();
  }

  /**
   * Get the singleton instance of the registry.
   */
  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register default agents including ClaudeKit agents.
   */
  private registerDefaultAgents(): void {
    // Register custom agents first
    this.register(new GeminiCoachAgent());
    this.register(new SalesCopilotAgent());

    // Then register ClaudeKit agents
    this.registerClaudeKitAgents();
  }

  /**
   * Register all ClaudeKit agents from the .claude/agents directory.
   */
  private registerClaudeKitAgents(): void {
    // Mapping of ClaudeKit agents to Agent-OS business functions
    const claudeKitMapping: Array<{ name: string; function: AgentFunction }> = [
      // Framework agents
      { name: 'react-expert', function: 'Product & UX' },
      { name: 'nextjs-expert', function: 'Product & UX' },
      { name: 'nodejs-expert', function: 'IT & Infra / DevOps' },
      { name: 'typescript-expert', function: 'IT & Infra / DevOps' },
      
      // Database agents
      { name: 'postgres-expert', function: 'IT & Infra / DevOps' },
      { name: 'mongodb-expert', function: 'IT & Infra / DevOps' },
      
      // Testing agents
      { name: 'testing-expert', function: 'Operations & Logistics' },
      { name: 'playwright-expert', function: 'Operations & Logistics' },
      { name: 'jest-testing-expert', function: 'Operations & Logistics' },
      { name: 'vitest-testing-expert', function: 'Operations & Logistics' },
      
      // DevOps agents
      { name: 'docker-expert', function: 'IT & Infra / DevOps' },
      { name: 'devops-expert', function: 'IT & Infra / DevOps' },
      { name: 'github-actions-expert', function: 'IT & Infra / DevOps' },
      
      // Code quality
      { name: 'code-review-expert', function: 'IT & Infra / DevOps' },
      { name: 'refactoring-expert', function: 'IT & Infra / DevOps' },
      { name: 'linting-expert', function: 'IT & Infra / DevOps' },
      
      // Frontend
      { name: 'css-styling-expert', function: 'Product & UX' },
      { name: 'accessibility-expert', function: 'Product & UX' },
      
      // General
      { name: 'research-expert', function: 'Market & Research' },
      { name: 'documentation-expert', function: 'Data & Analytics' },
    ];

    claudeKitMapping.forEach(({ name, function: fn }) => {
      const adapter = new ClaudeKitAdapter(name, fn);
      this.register(adapter);
    });
  }

  /**
   * Register a new agent.
   */
  register(agent: BaseAgent): void {
    this.agents.set(agent.getDefinition().agent_name, agent);
  }

  /**
   * Get an agent by name.
   */
  get(agentName: string): BaseAgent | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Get all agents for a specific business function.
   */
  getAllByFunction(fn: AgentFunction): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.getDefinition().business_function === fn
    );
  }

  /**
   * List all registered agents.
   */
  listAll(): AgentDefinition[] {
    return Array.from(this.agents.values()).map((a) => a.getDefinition());
  }

  /**
   * Get total number of registered agents.
   */
  count(): number {
    return this.agents.size;
  }

  /**
   * Unregister an agent (useful for testing).
   */
  unregister(agentName: string): boolean {
    return this.agents.delete(agentName);
  }

  /**
   * Clear all agents (useful for testing).
   */
  clear(): void {
    this.agents.clear();
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistry.getInstance();

// Also export the class for testing
export { AgentRegistry };
