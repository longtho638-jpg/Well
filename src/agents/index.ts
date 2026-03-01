// Core exports
export { BaseAgent } from './core/BaseAgent';
export { agentRegistry, AgentRegistry } from './registry';
export { ClaudeKitAdapter } from './claudekit/ClaudeKitAdapter';

// Orchestration (Railway/Nixpacks-inspired patterns)
export {
  classifyIntent,
  getAvailableIntents,
  orchestrateAgentRequest,
  getOrchestratorStatus,
} from './orchestration';
export type {
  AgentIntent,
  ClassificationResult,
  OrchestratorInput,
  OrchestratorResult,
} from './orchestration';

// Custom agents
export { GeminiCoachAgent } from './custom/GeminiCoachAgent';
export { SalesCopilotAgent } from './custom/SalesCopilotAgent';
export { TheBeeAgent } from './custom/TheBeeAgent';
export { AgencyOSAgent } from './custom/AgencyOSAgent';
export { AGENCYOS_COMMANDS } from './custom/commandDefinitions';
export { DebuggerAgent } from './custom/DebuggerAgent';
export { CodeReviewerAgent } from './custom/CodeReviewerAgent';
export { ScoutAgent } from './custom/ScoutAgent';
export { DocsManagerAgent } from './custom/DocsManagerAgent';
export { ScoutExternalAgent } from './custom/ScoutExternalAgent';
export { ProjectManagerAgent } from './custom/ProjectManagerAgent';
