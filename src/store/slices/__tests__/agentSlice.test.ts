/**
 * Agent Slice Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAgentSlice } from '../agentSlice';
import { agentRegistry } from '../../../agents';
import { supabase } from '../../../lib/supabase';
import type { AgentLog } from '../../../types/agentic';

vi.mock('../../../agents', () => ({
  agentRegistry: { get: vi.fn(), listAll: vi.fn() },
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}));

describe('AgentSlice', () => {
  const mockAgent = { execute: vi.fn(), getLogs: vi.fn(), getKPIs: vi.fn() };
  const mockLog: AgentLog = {
    id: 'log-1', agentName: 'test-agent', action: 'test-action',
    inputs: { key: 'value' }, outputs: { result: 'success' },
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('should initialize with empty agent state', () => {
    const slice = createAgentSlice(() => {}, () => ({}) as any, {} as any);
    expect(slice.agentState.activeAgents).toBeInstanceOf(Map);
    expect(slice.agentState.agentLogs).toEqual([]);
    expect(slice.agentState.agentMetrics).toBeInstanceOf(Map);
  });

  it('should throw error when agent not found', async () => {
    (agentRegistry.get as any).mockReturnValue(null);
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    await expect(slice.executeAgent('unknown-agent', {})).rejects.toThrow('not found');
  });

  it('should get agent logs filtered by name', () => {
    const logs: AgentLog[] = [
      { id: '1', agentName: 'agent-a', action: 'a1', inputs: {}, outputs: {}, timestamp: '2024' },
      { id: '2', agentName: 'agent-b', action: 'b1', inputs: {}, outputs: {}, timestamp: '2024' },
    ];
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: logs, activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: logs }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    expect(slice.getAgentLogs('agent-a')).toHaveLength(1);
  });

  it('should get all agent logs when no name provided', () => {
    const logs: AgentLog[] = [{ id: '1', agentName: 'a', action: 'x', inputs: {}, outputs: {}, timestamp: '2024' }];
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: logs, activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: logs }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    expect(slice.getAgentLogs()).toHaveLength(1);
  });

  it('should get agent KPIs', () => {
    (agentRegistry.get as any).mockReturnValue(mockAgent);
    mockAgent.getKPIs.mockReturnValue([{ name: 'executions', value: 100, unit: 'count' }]);
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    expect(slice.getAgentKPIs('test-agent')).toHaveLength(1);
  });

  it('should return empty KPIs when agent not found', () => {
    (agentRegistry.get as any).mockReturnValue(null);
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    expect(slice.getAgentKPIs('unknown')).toEqual([]);
  });

  it('should list all agents', () => {
    (agentRegistry.listAll as any).mockReturnValue([{ name: 'a1' }, { name: 'a2' }]);
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    expect(slice.listAllAgents()).toHaveLength(2);
  });

  it('should persist agent log when authenticated', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const mockInsert = vi.fn().mockResolvedValue({});
    (supabase.from as any).mockReturnValue({ insert: mockInsert });
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    await slice.persistAgentLog(mockLog);
    expect(mockInsert).toHaveBeenCalledWith([{ agent_name: 'test-agent', action: 'test-action', input: { key: 'value' }, output: { result: 'success' }, user_id: 'u1' }]);
  });

  it('should skip persist when not authenticated', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    await slice.persistAgentLog(mockLog);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should handle persist error gracefully', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    (supabase.from as any).mockReturnValue({ insert: vi.fn().mockRejectedValue(new Error('DB')) });
    const slice = createAgentSlice(
      () => ({ agentState: { agentLogs: [], activeAgents: new Map(), agentMetrics: new Map() } }),
      () => ({ agentState: { agentLogs: [] }, persistAgentLog: vi.fn() }) as any,
      {} as any
    );
    await slice.persistAgentLog(mockLog);
  });
});
