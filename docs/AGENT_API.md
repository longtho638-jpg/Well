# Agent-OS API Documentation

## Overview

The Agent-OS is a modular framework for integrating AI agents into the WellNexus platform. It provides a unified interface for executing agent actions, tracking KPIs, and managing agent lifecycle.

## Core Concepts

- **Agent:** An autonomous entity with specific business functions (e.g., Sales Copilot, The Bee).
- **Registry:** A singleton service that manages all available agents.
- **Store:** The Zustand store acts as the single source of truth for agent state (logs, metrics).
- **Hook:** `useAgentOS` provides a React-friendly interface to interact with agents.

## Usage (React Components)

### `useAgentOS` Hook

```typescript
import { useAgentOS } from '@/hooks/useAgentOS';

function MyComponent() {
  const { executeAgent, listAgents, getAgentLogs } = useAgentOS();

  const handleAction = async () => {
    try {
      const result = await executeAgent('Agent Name', { action: 'doSomething', data: '...' });
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={handleAction}>Execute Agent</button>;
}
```

### API Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `executeAgent` | Executes an action on a specific agent. | `agentName` (string), `input` (any), `useCache` (boolean, optional) | `Promise<any>` |
| `listAgents` | Returns a list of all registered agents. | None | `AgentDefinition[]` |
| `getAgentLogs` | Retrieves execution logs. | `agentName` (string, optional) | `AgentLog[]` |
| `getAgentKPIs` | Retrieves KPIs for a specific agent. | `agentName` (string) | `AgentKPI[]` |
| `getAgent` | Gets the raw agent instance (advanced). | `agentName` (string) | `BaseAgent | undefined` |

## Available Agents

### 1. The Bee (Reward Engine)
- **Function:** Calculates and distributes rewards (Nexus Points / GROW tokens).
- **Actions:** `processReward`
- **Inputs:** Transaction object, User Rank.

### 2. Sales Copilot
- **Function:** Assists with sales conversations.
- **Actions:** `detectObjection`, `suggestResponse`
- **Inputs:** User message string.

### 3. Gemini Coach
- **Function:** Provides personalized business coaching.
- **Actions:** `getCoachAdvice`
- **Inputs:** User profile, context string.

### 4. ClaudeKit Agents (Development)
- A suite of 20+ specialist agents for code analysis, refactoring, and testing (e.g., `react-expert`, `typescript-expert`).

## Database Integration

Agent logs are persisted to Supabase in the `agent_logs` table for audit and analysis. RLS policies ensure users can only see their own agent interactions.

## Caching

The `executeAgent` method supports an optional simple in-memory cache (1 minute) to reduce API calls for identical inputs. Pass `true` as the third argument to enable.
