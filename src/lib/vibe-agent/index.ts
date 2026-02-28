/**
 * Vibe Agent SDK — Entry Point
 *
 * Provider-agnostic agent framework for RaaS projects.
 * Provides: abstract base agent, typed definitions, singleton registry.
 *
 * Usage:
 *   import { VibeBaseAgent, createAgentRegistry } from '@/lib/vibe-agent';
 *   import type { VibeAgentDefinition } from '@/lib/vibe-agent';
 */

// Types
export type {
  VibeAgentFunction,
  VibeAgentInput,
  VibeAgentKPI,
  VibeAgentPolicy,
  VibeAgentDefinition,
  VibeAgentLog,
  VibeAgentState,
  VibeAgentDeps,
} from './types';

// Base agent abstract class
export { VibeBaseAgent } from './base-agent-abstract';

// Registry
export {
  VibeAgentRegistry,
  createAgentRegistry,
} from './agent-registry-singleton';
