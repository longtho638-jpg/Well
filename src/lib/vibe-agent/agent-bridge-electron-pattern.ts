/**
 * Agent Bridge — Electron contextBridge Pattern
 *
 * Provides a safe, decoupled API for UI components to interact with the
 * Agent Supervisor (Main Process). This prevents React components from
 * directly manipulating agent state or having direct access to the registry.
 *
 * Pattern source: electron/electron contextBridge.exposeInMainWorld
 */

import { agentEventBus, type AgentEventChannel } from './agent-event-bus';
import type { VibeAgentDefinition, VibeAgentLog } from './types';

export interface VibeAgentBridge {
  /** Invoke an agent action (ipcRenderer.invoke equivalent) */
  invoke: <T = unknown>(agentName: string, action: string, payload: unknown) => Promise<T>;

  /** Send a message to an agent (ipcRenderer.send equivalent) */
  send: (agentName: string, channel: AgentEventChannel, payload: unknown) => void;

  /** Subscribe to agent events (ipcRenderer.on equivalent) */
  on: <T = unknown>(channel: AgentEventChannel, callback: (payload: T) => void) => () => void;

  /** Get list of available agents without exposing instances */
  getAvailableAgents: () => Promise<VibeAgentDefinition[]>;

  /** Get recent logs for a specific agent */
  getLogs: (agentName: string) => Promise<VibeAgentLog[]>;
}

/**
 * The Bridge instance that would be exposed to the window object in a real Electron app.
 * In this web-based implementation, it acts as the primary interface for the UI.
 */
export const vibeAgentBridge: VibeAgentBridge = {
  /**
   * Invokes an agent action and returns a promise for the result.
   * Internally uses a request-response pattern over the event bus.
   */
  async invoke<T = unknown>(agentName: string, action: string, payload: unknown): Promise<T> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return new Promise((resolve, reject) => {
      // Set up a one-time listener for the response
      const cleanup = agentEventBus.on(`agent:completed` as AgentEventChannel, (event) => {
        const data = event.payload as any;
        if (data.requestId === requestId && data.agentName === agentName) {
          cleanup();
          resolve(data.result as T);
        }
      });

      // Set up a one-time listener for errors
      const errorCleanup = agentEventBus.on(`agent:error` as AgentEventChannel, (event) => {
        const data = event.payload as any;
        if (data.requestId === requestId && data.agentName === agentName) {
          cleanup();
          errorCleanup();
          reject(new Error(data.error || 'Agent invocation failed'));
        }
      });

      // Emit the invocation event
      agentEventBus.emit(
        'tool:executed',
        { agentName, action, payload, requestId },
        'UI_BRIDGE'
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        cleanup();
        errorCleanup();
        reject(new Error(`Agent invocation timed out for ${agentName}:${action}`));
      }, 30000);
    });
  },

  /**
   * Sends a fire-and-forget message to an agent.
   */
  send(agentName: string, channel: AgentEventChannel, payload: unknown): void {
    agentEventBus.emit(channel, { agentName, ...payload as any }, 'UI_BRIDGE');
  },

  /**
   * Subscribes to events on a specific channel.
   * Returns an unsubscribe function.
   */
  on<T = unknown>(channel: AgentEventChannel, callback: (payload: T) => void): () => void {
    return agentEventBus.on(channel, (event) => {
      callback(event.payload as T);
    });
  },

  /**
   * Fetches the current list of registered agent definitions.
   * Uses the internal supervisor logic rather than direct registry access.
   */
  async getAvailableAgents(): Promise<VibeAgentDefinition[]> {
    // In a real bridge, this would be an IPC call to the main process
    return vibeAgentBridge.invoke('supervisor', 'listAgents', {});
  },

  /**
   * Fetches logs for a specific agent.
   */
  async getLogs(agentName: string): Promise<VibeAgentLog[]> {
    return vibeAgentBridge.invoke('supervisor', 'getAgentLogs', { agentName });
  }
};
