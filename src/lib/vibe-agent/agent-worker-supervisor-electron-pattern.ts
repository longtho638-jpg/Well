/**
 * Agent Worker Supervisor — Electron Main Process Pattern
 *
 * Acts as the "Main Process" that manages agent lifecycles, permissions,
 * and context isolation. It listens for requests from the AgentBridge
 * and routes them to the appropriate worker agents.
 *
 * Pattern source: electron/electron ipcMain.handle + BrowserWindow (Worker) management
 */

import { VibeAgentRegistry, createAgentRegistry } from './agent-registry-singleton';
import { agentEventBus } from './agent-event-bus';
import { agentHealthMonitor } from './agent-health-monitor';
import { agentExecutionQueue } from './agent-execution-queue-n8n-pattern';
import type { VibeBaseAgent } from './base-agent-abstract';
import type { VibeAgentDefinition, VibeAgentLog } from './types';

class AgentWorkerSupervisor {
  private registry: VibeAgentRegistry;
  private logs: VibeAgentLog[] = [];
  private maxLogs = 1000;

  constructor() {
    this.registry = createAgentRegistry();
    this.setupIpcHandlers();
  }

  /**
   * Set up handlers for bridge invocations (equivalent to ipcMain.handle)
   */
  private setupIpcHandlers(): void {
    // Listen for tool:executed events which are used by vibeAgentBridge.invoke
    agentEventBus.on('tool:executed', async (event) => {
      const { agentName, action, payload, requestId } = event.payload as any;

      // Special case for supervisor commands
      if (agentName === 'supervisor') {
        return this.handleSupervisorCommand(action, payload, requestId);
      }

      const agent = this.registry.get(agentName);
      if (!agent) {
        return this.sendError(agentName, requestId, `Agent "${agentName}" not found`);
      }

      // Check agent health before execution
      const health = agentHealthMonitor.getStatus(agentName);
      if (health && health.state === 'disabled') {
        return this.sendError(agentName, requestId, `Agent "${agentName}" is currently offline (Circuit Breaker)`);
      }

      // Route through the execution queue for concurrency control
      try {
        agentExecutionQueue.add(
          `${agentName}:${action}`,
          { agent, action, payload, requestId },
          { priority: 3 }
        );
      } catch (err) {
        this.sendError(agentName, requestId, err instanceof Error ? err.message : 'Queue failed');
      }
    });

    // Register the queue processor
    agentExecutionQueue.registerProcessor(/.*/ as any, async (job) => {
      const { agent, action, payload, requestId } = job.data as {
        agent: VibeBaseAgent;
        action: string;
        payload: unknown;
        requestId: string
      };

      try {
        // Execute the actual agent logic
        const result = await agent.execute({ action, payload });

        // Record log
        this.recordLog(agent.getDefinition().agent_name, action, payload, result);

        // Notify completion back to the bridge
        await agentEventBus.emit('agent:completed', {
          agentName: agent.getDefinition().agent_name,
          requestId,
          result
        }, 'SUPERVISOR');

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.sendError(agent.getDefinition().agent_name, requestId, errorMsg);
        throw err;
      }
    });
  }

  /**
   * Internal commands for managing the agent system itself
   */
  private async handleSupervisorCommand(action: string, payload: any, requestId: string): Promise<void> {
    try {
      let result: any;

      switch (action) {
        case 'listAgents':
          result = this.registry.listDefinitions();
          break;
        case 'getAgentLogs':
          result = this.logs.filter(l => l.agentName === payload.agentName);
          break;
        case 'getSystemStatus':
          result = {
            agentCount: this.registry.count(),
            queueStats: agentExecutionQueue.getStats(),
            health: agentHealthMonitor.getAllStatuses()
          };
          break;
        default:
          throw new Error(`Unknown supervisor action: ${action}`);
      }

      await agentEventBus.emit('agent:completed', {
        agentName: 'supervisor',
        requestId,
        result
      }, 'SUPERVISOR');
    } catch (err) {
      this.sendError('supervisor', requestId, err instanceof Error ? err.message : 'Supervisor command failed');
    }
  }

  private async sendError(agentName: string, requestId: string, error: string): Promise<void> {
    await agentEventBus.emit('agent:error', {
      agentName,
      requestId,
      error
    }, 'SUPERVISOR');
  }

  private recordLog(agentName: string, action: string, inputs: any, outputs: any): void {
    const log: VibeAgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agentName,
      action,
      timestamp: new Date().toISOString(),
      inputs,
      outputs
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  /** Register an agent with the supervisor's registry */
  registerAgent(agent: VibeBaseAgent): void {
    this.registry.register(agent);
  }

  /** Get the supervisor's registry (for direct access if absolutely needed) */
  getRegistry(): VibeAgentRegistry {
    return this.registry;
  }
}

/**
 * Global Agent Supervisor instance.
 * In a real Electron app, this would live only in the main process.
 */
export const agentWorkerSupervisor = new AgentWorkerSupervisor();
