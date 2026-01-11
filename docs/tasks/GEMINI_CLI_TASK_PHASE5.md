# Task for Gemini CLI: Phase 5 - React Hook

## Context
✅ **Phase 1-4 Complete**: Agents integrated into Zustand store

You are implementing **Phase 5**: Creating a React hook for easy agent access.

---

## Objective

Create `useAgentOS` hook that wraps store selectors for cleaner component code.

---

## Task: Create `src/hooks/useAgentOS.ts`

**Implementation:**

```typescript
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
```

---

## Task 2: Update `src/hooks/index.ts`

If the file exists, add export:

```typescript
export { useAgentOS } from './useAgentOS';
```

If the file doesn't exist, create it with:

```typescript
export { useAgentOS } from './useAgentOS';
```

---

## Usage Example (for verification)

```typescript
// In any component:
import { useAgentOS } from '@/hooks/useAgentOS';

function MyComponent() {
  const { executeAgent, listAgents, getTotalAgentCount } = useAgentOS();

  const handleCoachAdvice = async () => {
    const result = await executeAgent('Gemini Coach', {
      action: 'getCoachAdvice',
      user: currentUser,
    });
    console.log(result);
  };

  return (
    <div>
      <p>Total Agents: {getTotalAgentCount()}</p>
      <button onClick={handleCoachAdvice}>Get Coach Advice</button>
    </div>
  );
}
```

---

## Deliverables

- `src/hooks/useAgentOS.ts`
- `src/hooks/index.ts` (created or updated)

---

## Success Criteria

- ✅ Hook exports all agent functions
- ✅ TypeScript compilation succeeds
- ✅ Hook can be imported in components
- ✅ `npm run build` succeeds

Proceed with Phase 5 implementation.
