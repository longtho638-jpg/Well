import { adminLogger } from '@/utils/logger';
import { agentEventBus, type AgentEventChannel } from '../agent-event-bus';

/**
 * Webhook Event Dispatcher pattern (inspired by Cal.com)
 *
 * Handles outgoing webhook notifications and system-wide event broadcasting.
 */
export interface SystemEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export class WebhookEventDispatcher {
  private static instance: WebhookEventDispatcher;
  private logger = adminLogger;

  private constructor() {}

  public static getInstance(): WebhookEventDispatcher {
    if (!WebhookEventDispatcher.instance) {
      WebhookEventDispatcher.instance = new WebhookEventDispatcher();
    }
    return WebhookEventDispatcher.instance;
  }

  /**
   * Dispatches an event to the internal event bus and potentially external webhooks.
   */
  public async dispatch(type: AgentEventChannel, payload: Record<string, unknown>, source: string): Promise<void> {
    this.logger.info(`Dispatching system event: ${type}`, { source, payload });

    try {
      // 1. Internal broadcast
      await agentEventBus.emit(type, payload, source);

      // 2. External webhook logic (if configured)
      // This is where we would trigger actual HTTP webhooks to external services
      // NOTE: Placeholder for future extension per system roadmap.

    } catch (error) {
      this.logger.error(`Failed to dispatch event ${type}:`, error);
      // We don't throw here to avoid breaking the main execution flow
    }
  }
}

export const webhookEventDispatcher = WebhookEventDispatcher.getInstance();
