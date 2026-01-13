// Core exports
export { BaseAgent } from './core/BaseAgent';
export { agentRegistry, AgentRegistry } from './registry';
export { ClaudeKitAdapter } from './claudekit/ClaudeKitAdapter';

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
