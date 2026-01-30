# Phase 1: Localization Audit & Fix

## Context
The `AgentDashboard.tsx` uses `t('agentdashboard.*')` (lowercase) while `useAgentCenter.ts` uses `t('agentDashboard.*')` (camelCase). We need to standardize this and ensure all keys exist in `en.ts` and `vi.ts`.

## Requirements
1.  **Standardize Keys:** Use `agentDashboard` (camelCase) as the standard namespace.
2.  **Update Components:** Update `AgentDashboard.tsx` to use camelCase keys.
3.  **Update Locales:** Ensure `src/locales/en.ts` and `src/locales/vi.ts` contain the required keys.

## Keys to Verify/Add
- `agentDashboard.establishingNodeSync`
- `agentDashboard.agentCommandCenter`
- `agentDashboard.intelligenceGridOptimal`
- `agentDashboard.operationalTier`
- `agentDashboard.version` (was v1_2_0_stable)
- `agentDashboard.registry`
- `agentDashboard.nodes`
- `agentDashboard.strategicSimulatorOffline`
- `agentDashboard.connectPolicyEngine`
- `agentDashboard.stats.totalAgents`
- `agentDashboard.stats.activeFunctions`
- `agentDashboard.stats.customAgents`

## Implementation Steps
1.  Read `src/locales/en.ts` and `src/locales/vi.ts`.
2.  Update `AgentDashboard.tsx` to use camelCase keys.
3.  Update `src/locales/en.ts` with missing keys.
4.  Update `src/locales/vi.ts` with missing keys.
