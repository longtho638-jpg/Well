/**
 * EventBus - A basic event system for decoupling side effects.
 * Inspired by Node.js EventEmitter but client-side and type-safe.
 */

type EventCallback = (data: any) => void;

class EventBus {
  private subscribers: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  public subscribe(event: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
        if (eventSubscribers.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  /**
   * Publish an event
   */
  public publish(event: string, data?: any): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in subscriber for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Clear all subscribers for an event
   */
  public clear(event?: string): void {
    if (event) {
      this.subscribers.delete(event);
    } else {
      this.subscribers.clear();
    }
  }
}

export const eventBus = new EventBus();
