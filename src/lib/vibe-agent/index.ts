/**
 * Vibe Agent SDK — Entry Point
 *
 * Provider-agnostic agent framework for RaaS projects.
 * Re-exports organized by domain from 4 category barrels.
 *
 * Usage:
 *   import { VibeBaseAgent, createAgentRegistry } from '@/lib/vibe-agent';
 *   import type { VibeAgentDefinition } from '@/lib/vibe-agent';
 */

// Core agent types, base class, registry, event bus, domain events,
// health/heartbeat monitors, memory config & store
export * from './exports-agent-patterns';

// Notification dispatcher, message queue (QStash), LLM router (LiteLLM),
// model fallback, agent bridge (Electron), worker supervisor,
// Vercel AI adapter, AGI core engine & commerce tools
export * from './exports-communication';

// Metrics collector (Netdata), status page (Uptime-Kuma), lint rule engine,
// diagnostic reporter, workspace analyzer, incremental computation (Biome),
// session replay (Highlight.io), survey engine (Formbricks)
export * from './exports-monitoring';

// Workflow execution (Temporal), node graph engine (n8n), node type registry,
// credential manager, expression resolver, execution queue, error workflow,
// script runner (zx), Cal.com services/registry/automation engine
export * from './exports-workflow-engine';
