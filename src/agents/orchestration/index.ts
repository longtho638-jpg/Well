/**
 * Agent Orchestration — Railway/Nixpacks-inspired patterns
 * Supervisor pattern + auto-detection intent classifier
 */

export { classifyIntent, getAvailableIntents } from './agent-intent-classifier';
export type { AgentIntent, ClassificationResult } from './agent-intent-classifier';

export { orchestrateAgentRequest, getOrchestratorStatus } from './agent-supervisor-orchestrator';
export type { OrchestratorInput, OrchestratorResult } from './agent-supervisor-orchestrator';
