# Task for Gemini CLI: Phase 2 - Agent Registry & Core Architecture

## Context
Phase 1 ✅ COMPLETE: `src/types/agentic.ts` has been created successfully.

You are now implementing **Phase 2** of the Agent-OS integration for the Well project. This phase establishes the core agent architecture and registry system.

---

## Objectives

1. Create the abstract `BaseAgent` class that all agents will extend
2. Implement the central `AgentRegistry` singleton
3. Create placeholder adapters for ClaudeKit agents
4. Set up the directory structure under `src/agents/`

---

## Task 1: Create Directory Structure

Create the following directories:
```
src/agents/
├── core/           # Base classes and interfaces
├── custom/         # Custom business agents (will migrate services here later)
└── claudekit/      # ClaudeKit agent adapters
```

---

## Task 2: Implement BaseAgent Abstract Class

### File: `src/agents/core/BaseAgent.ts`

```typescript
import { AgentDefinition, AgentLog, AgentKPI, AgentPolicy } from '@/types/agentic';

/**
 * Abstract base class for all agents in the Agentic OS.
 * Provides common functionality for policy checking, logging, and KPI tracking.
 */
export abstract class BaseAgent {
  protected definition: AgentDefinition;
  protected logs: AgentLog[] = [];

  constructor(definition: AgentDefinition) {
    this.definition = definition;
  }

  /**
   * Execute the agent's primary action.
   * Must be implemented by concrete agent classes.
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Check if an action violates any policies.
   * @returns true if action is allowed, false if blocked
   */
  protected async checkPolicies(action: string, context: any): Promise<boolean> {
    for (const policy of this.definition.policy_and_constraints) {
      if (policy.enforcement === 'hard') {
        // Basic policy check - can be enhanced later
        // For now, we just log the check
        console.log(`[Policy Check] ${policy.rule} for action: ${action}`);
      }
    }
    return true; // Allow by default for now
  }

  /**
   * Log an agent action with inputs and outputs.
   */
  protected log(action: string, inputs: any, outputs: any, approved?: boolean): void {
    const logEntry: AgentLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentName: this.definition.agent_name,
      action,
      timestamp: new Date().toISOString(),
      inputs,
      outputs,
      humanApproved: approved,
    };
    this.logs.push(logEntry);
  }

  /**
   * Get all logs for this agent.
   */
  getLogs(): AgentLog[] {
    return [...this.logs];
  }

  /**
   * Get the agent's KPI definitions.
   */
  getKPIs(): AgentKPI[] {
    return this.definition.success_kpis;
  }

  /**
   * Get the agent's definition.
   */
  getDefinition(): AgentDefinition {
    return this.definition;
  }

  /**
   * Clear all logs (useful for testing).
   */
  clearLogs(): void {
    this.logs = [];
  }
}
```

---

## Task 3: Create ClaudeKit Agent Adapter

### File: `src/agents/claudekit/ClaudeKitAdapter.ts`

```typescript
import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition, AgentFunction } from '@/types/agentic';

/**
 * Adapter for ClaudeKit agents.
 * This wraps ClaudeKit's development agents into the Agent-OS framework.
 */
export class ClaudeKitAdapter extends BaseAgent {
  constructor(agentName: string, businessFunction: AgentFunction) {
    const definition: AgentDefinition = {
      agent_name: agentName,
      business_function: businessFunction,
      primary_objectives: [
        `Provide ${agentName} expertise for ${businessFunction}`,
      ],
      inputs: [
        { source: 'code_context', dataType: 'user_input' },
      ],
      tools_and_systems: ['ClaudeKit CLI', 'Claude API'],
      core_actions: ['analyze', 'suggest', 'refactor', 'review'],
      outputs: ['recommendations', 'code_changes', 'analysis_report'],
      success_kpis: [
        { name: 'Code Quality Improvement', target: 80, unit: '%' },
      ],
      risk_and_failure_modes: [
        'May suggest non-optimal patterns',
        'Context limitations',
      ],
      human_in_the_loop_points: [
        'All code changes must be reviewed before applying',
      ],
      policy_and_constraints: [
        {
          rule: 'Cannot modify production code without review',
          enforcement: 'hard',
        },
      ],
    };

    super(definition);
  }

  /**
   * Execute method for ClaudeKit adapter.
   * In a real implementation, this would call the ClaudeKit CLI.
   */
  async execute(input: any): Promise<any> {
    // Policy check
    const canProceed = await this.checkPolicies('analyze', input);
    if (!canProceed) {
      return { error: 'Action blocked by policy' };
    }

    // For now, this is a placeholder
    // In production, this would invoke the actual ClaudeKit agent
    const output = {
      agent: this.definition.agent_name,
      action: 'analyze',
      result: 'ClaudeKit adapter executed successfully (placeholder)',
    };

    this.log('execute', input, output);

    return output;
  }
}
```

---

## Task 4: Implement Agent Registry

### File: `src/agents/registry.ts`

```typescript
import { AgentDefinition, AgentFunction } from '@/types/agentic';
import { BaseAgent } from './core/BaseAgent';
import { ClaudeKitAdapter } from './claudekit/ClaudeKitAdapter';

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
```

---

## Task 5: Create Index File

### File: `src/agents/index.ts`

```typescript
// Core exports
export { BaseAgent } from './core/BaseAgent';
export { agentRegistry, AgentRegistry } from './registry';
export { ClaudeKitAdapter } from './claudekit/ClaudeKitAdapter';
```

---

## Verification Steps

After creating all files, verify:

1. **Build Check**: Run `npm run build`
   - Should compile without errors (ignore pre-existing test errors)
   - New files should have zero TypeScript errors

2. **Import Test**: Verify exports work
   ```typescript
   import { agentRegistry } from '@/agents';
   console.log(agentRegistry.count()); // Should output ~20 (ClaudeKit agents)
   ```

3. **Registry Test**: Check registry functionality
   ```typescript
   const reactExpert = agentRegistry.get('react-expert');
   console.log(reactExpert?.getDefinition().business_function); // Should output 'Product & UX'
   ```

---

## Success Criteria

- ✅ Directory structure `src/agents/` created with `core/`, `custom/`, `claudekit/` subdirectories
- ✅ `BaseAgent.ts` abstract class implemented with all required methods
- ✅ `ClaudeKitAdapter.ts` created and functional
- ✅ `registry.ts` implements singleton pattern correctly
- ✅ At least 20 ClaudeKit agents are auto-registered
- ✅ `index.ts` exports all public APIs
- ✅ Zero TypeScript compilation errors in new files
- ✅ `npm run build` succeeds

---

## Deliverables Summary

You will create **5 new files**:
1. `src/agents/core/BaseAgent.ts`
2. `src/agents/claudekit/ClaudeKitAdapter.ts`
3. `src/agents/registry.ts`
4. `src/agents/index.ts`
5. (Directories as needed)

Do NOT modify existing files yet. Phase 3 will handle refactoring existing services.

---

## Notes
- Follow existing code style (2-space indent, TypeScript strict mode)
- Add JSDoc comments for all public methods
- Use path alias `@/` for imports (already configured in tsconfig.json)
- Test by running `npm run build` after each file creation

Proceed with Phase 2 implementation.
