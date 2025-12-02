import { useStore } from '@/store';
import { agentRegistry } from '@/agents';
import { AgentFunction, AgentLog, AgentKPI } from '@/types/agentic';

/**
 * React hook for interacting with the Agent-OS.
 * Provides convenient access to agents, logs, and KPIs.
 */
export function useAgentOS() {
  const executeAgent = useStore((state) => state.executeAgent);
  const getAgentLogs = useStore((state) => state.getAgentLogs);
  const getAgentKPIs = useStore((state) => state.getAgentKPIs);
  const listAllAgents = useStore((state) => state.listAllAgents);

  return {
    // Execute agent actions
    executeAgent,

    // Query functions
    getAgentLogs,
    getAgentKPIs,
    listAgents: listAllAgents,

    // Direct registry access (for advanced use)
    getAgentsByFunction: (fn: AgentFunction) => agentRegistry.getAllByFunction(fn),
    getAgent: (name: string) => agentRegistry.get(name),

    // Convenience methods
    getTotalAgentCount: () => agentRegistry.count(),
  };
}
