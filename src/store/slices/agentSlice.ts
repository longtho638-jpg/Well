/**
 * Agent Slice - Agent-OS State & Actions
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { AgentState, AgentLog, AgentKPI } from '../../types/agentic';
import { agentRegistry } from '../../agents';
import { agentLogger } from '../../utils/logger';
import { supabase } from '../../lib/supabase';

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
    persistAgentLog: (log: AgentLog) => Promise<void>;
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

            // Update local state
            set((state) => ({
                agentState: {
                    ...state.agentState,
                    agentLogs: [...state.agentState.agentLogs, ...newLogs],
                },
            }));

            // Persist new logs to Supabase
            const { persistAgentLog } = get();
            newLogs.forEach(log => {
                persistAgentLog(log).catch(err =>
                    agentLogger.error('Failed to persist agent log', err)
                );
            });

            return output as Record<string, unknown>;
        } catch (error) {
            agentLogger.error(`Error executing ${agentName}`, error);
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

    persistAgentLog: async (log: AgentLog) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Only persist if authenticated
            if (session?.user) {
                await supabase.from('agent_logs').insert([{
                    agent_name: log.agentName,
                    action: log.action,
                    input: log.inputs, // Note: types/agentic.ts uses 'inputs', schema uses 'input'
                    output: log.outputs, // Note: types/agentic.ts uses 'outputs', schema uses 'output'
                    user_id: session.user.id
                }]);
            }
        } catch (error) {
            agentLogger.error('Error persisting agent log', error);
        }
    },
});
