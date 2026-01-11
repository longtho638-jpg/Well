/**
 * Store Slices - Barrel Export
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

export { createAuthSlice, enrichUserWithWealthMetrics, createEmptyUser } from './authSlice';
export type { AuthSlice, AuthState, AuthActions } from './authSlice';

export { createWalletSlice } from './walletSlice';
export type { WalletSlice, WalletState, WalletActions } from './walletSlice';

export { createQuestSlice } from './questSlice';
export type { QuestSlice, QuestState, QuestActions } from './questSlice';

export { createTeamSlice, defaultTeamMetrics, defaultTeamInsights } from './teamSlice';
export type { TeamSlice, TeamState, TeamActions, TreeNode } from './teamSlice';

export { createAgentSlice } from './agentSlice';
export type { AgentSlice, AgentOSState, AgentOSActions } from './agentSlice';
