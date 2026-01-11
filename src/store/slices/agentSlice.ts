/**
 * Agent Slice - Agent-OS State & Actions
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { AgentState, AgentLog, AgentKPI } from '../../types/agentic';
import { agentRegistry } from '../../agents';

// ============================================================================
// SLICE TYPES
// ============================================================================

export interface AgentOSState {
    agentState: AgentState;
}

export interface AgentOSActions {
    executeAgent: (agentName: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    getAgentLogs: (agentName?: string) => AgentLog[];
    getAgentKPIs: (agentName: string) => AgentKPI[];
    listAllAgents: () => ReturnType<typeof agentRegistry.listAll>;
    addAgentLogs: (logs: AgentLog[]) => void;
}

export type AgentSlice = AgentOSState & AgentOSActions;

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createAgentSlice: StateCreator<
    AgentSlice,
    [],
    [],
    AgentSlice
> = (set, get) => ({
    agentState: {
        activeAgents: new Map(),
        agentLogs: [],
        agentMetrics: new Map(),
    },

    executeAgent: async (agentName, input) => {
        const agent = agentRegistry.get(agentName);
        if (!agent) {
            throw new Error(`Agent "${agentName}" not found in registry`);
        }

        try {
            const output = await agent.execute(input);

            const newLogs = agent.getLogs();
            set((state) => ({
                agentState: {
                    ...state.agentState,
                    agentLogs: [...state.agentState.agentLogs, ...newLogs],
                },
            }));

            return output as Record<string, unknown>;
        } catch (error) {
            console.error(`[AgentOS] Error executing ${agentName}:`, error);
            throw error;
        }
    },

    getAgentLogs: (agentName) => {
        const logs = get().agentState.agentLogs;
        return agentName
            ? logs.filter((log) => log.agentName === agentName)
            : logs;
    },

    getAgentKPIs: (agentName) => {
        const agent = agentRegistry.get(agentName);
        return agent ? agent.getKPIs() : [];
    },

    listAllAgents: () => {
        return agentRegistry.listAll();
    },

    addAgentLogs: (logs) => set((state) => ({
        agentState: {
            ...state.agentState,
            agentLogs: [...state.agentState.agentLogs, ...logs],
        },
    })),
});
