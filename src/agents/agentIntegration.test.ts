import { describe, it, expect, beforeEach } from 'vitest';
import { agentRegistry } from './registry';
import { createAgentSlice } from '../store/slices/agentSlice';
import { create } from 'zustand';
import { AgentSlice } from '../store/slices/agentSlice';

// Mock store creation
const useTestStore = create<AgentSlice>((...a) => ({
  ...createAgentSlice(...a),
}));

describe('Agent Integration Flow', () => {
  beforeEach(() => {
    // Registry is a singleton, so we might need to reset it or assume it's initialized
    // In this codebase, it initializes in the constructor.
  });

  it('Registry should have default agents registered', () => {
    const agents = agentRegistry.getAll();
    expect(agents.length).toBeGreaterThan(0);

    const geminiCoach = agentRegistry.get('Gemini Coach');
    expect(geminiCoach).toBeDefined();
    expect(geminiCoach?.getDefinition().business_function).toBe('Market & Research');
  });

  it('Store slice should retrieve agents from registry', () => {
    const { listAllAgents } = useTestStore.getState();
    const agents = listAllAgents();

    expect(agents.length).toBe(agentRegistry.count());
    expect(agents[0].agent_name).toBeDefined();
  });

  it('Should group agents by business function correctly', () => {
    const agents = agentRegistry.getAll();
    const grouped = agents.reduce((acc, agent) => {
        const fn = agent.getDefinition().business_function;
        if (!acc[fn]) acc[fn] = [];
        acc[fn].push(agent);
        return acc;
    }, {} as Record<string, any[]>);

    expect(Object.keys(grouped).length).toBeGreaterThan(0);
    // Check for a known function
    expect(grouped['Market & Research']).toBeDefined();
  });
});
