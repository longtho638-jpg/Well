import { agentEventBus } from '../agent-event-bus';
import { adminLogger } from '@/utils/logger';

/**
 * SystemEventBus — Unified event dispatcher for the Well project.
 *
 * Provides a centralized way to dispatch and subscribe to system-wide events
 * with structured logging and error isolation.
 */
export class SystemEventBus {
  private static instance: SystemEventBus;
  private logger = adminLogger;

  private constructor() {}

  public static getInstance(): SystemEventBus {
    if (!SystemEventBus.instance) {
      SystemEventBus.instance = new SystemEventBus();
    }
    return SystemEventBus.instance;
  }

  /**
   * Dispatch an event to the global agent event bus.
   */
  public async dispatch<T>(channel: string, payload: T, source: string): Promise<void> {
    this.logger.info(`Dispatching event: ${channel} from ${source}`, payload);
    try {
      // Mapping to AgentEventChannel types if necessary, but here we cast for flexibility
      await agentEventBus.emit(channel as any, payload, source);
    } catch (error) {
      this.logger.error(`Failed to dispatch event: ${channel}`, error);
    }
  }

  /**
   * Subscribe to a specific event channel.
   */
  public subscribe<T>(channel: string, handler: (payload: any) => void | Promise<void>): () => void {
    return agentEventBus.on(channel as any, (event) => {
      return handler(event.payload);
    });
  }
}

export const systemEventBus = SystemEventBus.getInstance();
