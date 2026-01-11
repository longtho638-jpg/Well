/**
 * Event Bus - Pub/Sub Pattern
 * Phase 9: Events and Notifications
 */

type EventCallback<T = unknown> = (data: T) => void;
type Unsubscribe = () => void;

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface AppEvents {
    'user:login': { userId: string; email: string };
    'user:logout': { userId: string };
    'user:update': { userId: string; changes: Record<string, unknown> };
    'order:created': { orderId: string; amount: number };
    'order:completed': { orderId: string };
    'transaction:completed': { transactionId: string; type: string; amount: number };
    'notification:new': { id: string; type: string; message: string };
    'network:online': undefined;
    'network:offline': undefined;
    'theme:change': { theme: 'light' | 'dark' };
    'locale:change': { locale: 'vi' | 'en' };
}

// ============================================================================
// EVENT BUS CLASS
// ============================================================================

class EventBus<Events extends Record<string, unknown>> {
    private listeners = new Map<keyof Events, Set<EventCallback>>();
    private onceListeners = new Map<keyof Events, Set<EventCallback>>();

    /**
     * Subscribe to event
     */
    on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): Unsubscribe {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback as EventCallback);

        return () => {
            this.listeners.get(event)?.delete(callback as EventCallback);
        };
    }

    /**
     * Subscribe to event once
     */
    once<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): Unsubscribe {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event)!.add(callback as EventCallback);

        return () => {
            this.onceListeners.get(event)?.delete(callback as EventCallback);
        };
    }

    /**
     * Emit event
     */
    emit<K extends keyof Events>(event: K, data: Events[K]): void {
        // Regular listeners
        this.listeners.get(event)?.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${String(event)}:`, error);
            }
        });

        // Once listeners
        const onceCallbacks = this.onceListeners.get(event);
        if (onceCallbacks) {
            onceCallbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in once listener for ${String(event)}:`, error);
                }
            });
            this.onceListeners.delete(event);
        }
    }

    /**
     * Remove all listeners for event
     */
    off<K extends keyof Events>(event: K): void {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }

    /**
     * Clear all listeners
     */
    clear(): void {
        this.listeners.clear();
        this.onceListeners.clear();
    }

    /**
     * Get listener count for event
     */
    listenerCount<K extends keyof Events>(event: K): number {
        return (this.listeners.get(event)?.size || 0) +
            (this.onceListeners.get(event)?.size || 0);
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const eventBus = new EventBus<AppEvents>();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useCallback } from 'react';

export function useEvent<K extends keyof AppEvents>(
    event: K,
    callback: EventCallback<AppEvents[K]>
): void {
    useEffect(() => {
        return eventBus.on(event, callback);
    }, [event, callback]);
}

export function useEmit() {
    return useCallback(<K extends keyof AppEvents>(event: K, data: AppEvents[K]) => {
        eventBus.emit(event, data);
    }, []);
}
