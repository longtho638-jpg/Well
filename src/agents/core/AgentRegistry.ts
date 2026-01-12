/**
 * Agent Registry - Centralized Agent Management
 * Phase 10: Agent Unification
 * 
 * Provides:
 * - Unified agent access
 * - Agent lifecycle management
 * - Health status monitoring
 */

import { BaseAgent } from './BaseAgent';
import { agentLogger } from '@/utils/logger';

export interface AgentHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'offline';
    lastActivity: string;
    logsCount: number;
    kpis: Array<{ name: string; current: number; target: number }>;
}

export interface AgentRegistryEntry {
    instance: BaseAgent;
    registeredAt: string;
    executionCount: number;
}

class AgentRegistry {
    private agents: Map<string, AgentRegistryEntry> = new Map();

    /**
     * Register an agent with the registry
     */
    register(agent: BaseAgent): void {
        const name = agent.definition.agent_name;
        this.agents.set(name, {
            instance: agent,
            registeredAt: new Date().toISOString(),
            executionCount: 0,
        });
        agentLogger.info(`Registered agent: ${name}`);
    }

    /**
     * Get an agent by name
     */
    get<T extends BaseAgent>(name: string): T | undefined {
        return this.agents.get(name)?.instance as T | undefined;
    }

    /**
     * Check if agent exists
     */
    has(name: string): boolean {
        return this.agents.has(name);
    }

    /**
     * Get all registered agent names
     */
    getAgentNames(): string[] {
        return Array.from(this.agents.keys());
    }

    /**
     * Get health status of all agents
     */
    getHealthReport(): AgentHealth[] {
        return Array.from(this.agents.entries()).map(([name, entry]) => {
            const agent = entry.instance;
            const kpis = agent.getKPIs();
            const logs = agent.getLogs();

            return {
                name,
                status: 'healthy' as const,
                lastActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : entry.registeredAt,
                logsCount: logs.length,
                kpis: kpis.map(k => ({ name: k.name, current: k.current, target: k.target })),
            };
        });
    }

    /**
     * Execute an action on a specific agent
     */
    async execute<T>(agentName: string, input: unknown): Promise<T | null> {
        const entry = this.agents.get(agentName);
        if (!entry) {
            agentLogger.warn(`Agent not found: ${agentName}`);
            return null;
        }

        entry.executionCount++;
        agentLogger.debug(`Executing ${agentName} (count: ${entry.executionCount})`);

        return entry.instance.execute(input) as Promise<T>;
    }

    /**
     * Get registry statistics
     */
    getStats(): { totalAgents: number; totalExecutions: number } {
        let totalExecutions = 0;
        this.agents.forEach(entry => {
            totalExecutions += entry.executionCount;
        });

        return {
            totalAgents: this.agents.size,
            totalExecutions,
        };
    }

    /**
     * Clear all agents (for testing)
     */
    clear(): void {
        this.agents.clear();
        agentLogger.debug('Registry cleared');
    }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
