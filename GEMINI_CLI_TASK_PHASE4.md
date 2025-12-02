# Task for Gemini CLI: Phase 4 - Store Integration

## Context
✅ **Phase 1-3 Complete**: Types, Architecture, and Custom Agents ready

You are implementing **Phase 4**: Integrating the Agent-OS into the Zustand store so React components can use agents.

---

## Objectives

1. Add `AgentState` to the Zustand store
2. Implement agent action functions in the store
3. Make agents accessible to all React components
4. Maintain compatibility with existing store structure

---

## Task 1: Modify `src/store.ts`

### Step 1: Add Imports

Add these imports at the top of the file:

```typescript
import { AgentState, AgentLog, AgentKPI } from './types/agentic';
import { agentRegistry } from './agents';
```

### Step 2: Add AgentState to AppState Interface

Locate the `interface AppState` (around line 83) and add:

```typescript
interface AppState {
  // ... existing state ...
  
  // Agent-OS State
  agentState: AgentState;
  
  // Agent Actions
  executeAgent: (agentName: string, input: any) => Promise<any>;
  getAgentLogs: (agentName?: string) => AgentLog[];
  getAgentKPIs: (agentName: string) => AgentKPI[];
  listAllAgents: () => any[];
  
  // ... existing actions ...
}
```

### Step 3: Initialize AgentState

In the `useStore` create function (around line 134), add initial state:

```typescript
export const useStore = create<AppState>((set, get) => ({
  // ... existing initial state ...
  
  // Agent-OS Initial State
  agentState: {
    activeAgents: new Map(),
    agentLogs: [],
    agentMetrics: new Map(),
  },
  
  // ... existing state continues ...
```

### Step 4: Implement Agent Actions

Add these methods at the end of the store, before the closing `}))`:

```typescript
  // ============================================================================
  // AGENT-OS ACTIONS
  // ============================================================================

  /**
   * Execute an agent action.
   */
  executeAgent: async (agentName, input) => {
    const agent = agentRegistry.get(agentName);
    if (!agent) {
      throw new Error(`Agent "${agentName}" not found in registry`);
    }

    try {
      const output = await agent.execute(input);

      // Update logs in store
      const newLogs = agent.getLogs();
      set((state) => ({
        agentState: {
          ...state.agentState,
          agentLogs: [...state.agentState.agentLogs, ...newLogs],
        },
      }));

      return output;
    } catch (error) {
      console.error(`[AgentOS] Error executing ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Get logs for a specific agent or all agents.
   */
  getAgentLogs: (agentName) => {
    const logs = get().agentState.agentLogs;
    return agentName
      ? logs.filter((log) => log.agentName === agentName)
      : logs;
  },

  /**
   * Get KPIs for a specific agent.
   */
  getAgentKPIs: (agentName) => {
    const agent = agentRegistry.get(agentName);
    return agent ? agent.getKPIs() : [];
  },

  /**
   * List all registered agents.
   */
  listAllAgents: () => {
    return agentRegistry.listAll();
  },
```

---

## Task 2: Verify Store Integration

### Test 1: Check imports compile

```bash
npm run build
```

Should compile without new errors.

### Test 2: Verify store actions are accessible

In any component, you should be able to:

```typescript
import { useStore } from '@/store';

const executeAgent = useStore((state) => state.executeAgent);
const logs = useStore((state) => state.getAgentLogs());
const allAgents = useStore((state) => state.listAllAgents());
```

---

## Important Notes

**DO NOT:**
- Remove any existing state or actions
- Change the signature of existing functions
- Modify the Zustand `create()` call structure

**DO:**
- Only add new properties to `AppState`
- Only add new methods
- Preserve all existing functionality
- Keep the same indentation style (2 spaces)

---

## Expected File Changes

You will modify **1 file**:
- `src/store.ts` (add ~60 lines)

---

## Success Criteria

- ✅ `AgentState` added to store interface
- ✅ 4 new agent methods implemented
- ✅ Store compiles without errors
- ✅ No existing functionality broken
- ✅ `npm run build` succeeds

---

## Verification Commands

```bash
# Build check
npm run build

# Optional: Start dev server to verify runtime
npm run dev
```

Proceed with Phase 4 implementation.
