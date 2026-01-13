import { agentLogger } from '@/utils/logger';
import { useStore } from '@/store';
import { agentRegistry } from '@/agents';
import { AgentFunction, AgentLog, AgentKPI } from '@/types/agentic';
import { useCallback, useRef } from 'react';

/**
 * React hook for interacting with the Agent-OS.
 * Provides convenient access to agents, logs, and KPIs.
 */
export function useAgentOS() {
  const executeAgentStore = useStore((state) => state.executeAgent);
  const getAgentLogs = useStore((state) => state.getAgentLogs);
  const getAgentKPIs = useStore((state) => state.getAgentKPIs);
  const listAllAgents = useStore((state) => state.listAllAgents);

  // Simple in-memory cache for agent executions
  // Key: agentName + stringified input, Value: { data: Record<string, unknown>, timestamp: number }
  const cache = useRef<Map<string, { data: Record<string, unknown>; timestamp: number }>>(new Map());
  const CACHE_DURATION = 60 * 1000; // 1 minute cache

  const executeAgent = useCallback(async (agentName: string, input: Record<string, unknown>, useCache = false) => {
    if (useCache) {
      const cacheKey = `${agentName}-${JSON.stringify(input)}`;
      const cachedEntry = cache.current.get(cacheKey);

      if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION)) {
        return cachedEntry.data;
      }
    }

    try {
      const result = await executeAgentStore(agentName, input);

      if (useCache) {
        const cacheKey = `${agentName}-${JSON.stringify(input)}`;
        cache.current.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      agentLogger.error(`Execution failed for ${agentName}`, error);
      // Rethrow to allow caller to handle it, but log it standardized here
      throw error;
    }
  }, [executeAgentStore]);

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

    // Role Check (Mocked for now, but ready for Supabase Auth)
    getUserRole: async () => {
      // In a real app, this would fetch from Supabase Auth / Users table
      // const { data: { user } } = await supabase.auth.getUser();
      // const { data: profile } = await supabase.from('users').select('rank').eq('id', user.id).single();
      // return profile?.rank || 'Member';

      // For SEED Demo: We return 'Member' by default to show the "User View"
      // The user can toggle to "Admin View" via the hidden button if they know where it is, 
      // OR we can implement a real check if the user is logged in.
      return 'Member';
    }
  };
}