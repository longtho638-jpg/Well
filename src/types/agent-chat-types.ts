/**
 * Shared AgentMessage type for useAgentChat hook and components.
 */

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string;
  timestamp: string;
  isStreaming?: boolean;
  metadata?: Record<string, unknown>;
}
