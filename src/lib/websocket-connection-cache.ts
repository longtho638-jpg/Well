/**
 * WebSocket Connection Cache Manager
 * Singleton pool for Supabase Realtime channels — prevents duplicate subscriptions.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

type ChannelFactory = (channelName: string) => RealtimeChannel;

interface CachedChannel {
    channel: RealtimeChannel;
    refCount: number;
}

class WebSocketConnectionCache {
    private static instance: WebSocketConnectionCache;
    private cache = new Map<string, CachedChannel>();

    private constructor() {}

    static getInstance(): WebSocketConnectionCache {
        if (!WebSocketConnectionCache.instance) {
            WebSocketConnectionCache.instance = new WebSocketConnectionCache();
        }
        return WebSocketConnectionCache.instance;
    }

    /**
     * Get or create a channel. Increments ref count for shared channels.
     */
    acquire(channelName: string, factory?: ChannelFactory): RealtimeChannel {
        const existing = this.cache.get(channelName);
        if (existing) {
            existing.refCount++;
            return existing.channel;
        }

        const channel = factory
            ? factory(channelName)
            : supabase.channel(channelName);

        this.cache.set(channelName, { channel, refCount: 1 });
        return channel;
    }

    /**
     * Release a channel reference. Unsubscribes and removes when refCount reaches 0.
     */
    release(channelName: string): void {
        const entry = this.cache.get(channelName);
        if (!entry) return;

        entry.refCount--;
        if (entry.refCount <= 0) {
            supabase.removeChannel(entry.channel);
            this.cache.delete(channelName);
        }
    }

    /**
     * Check if a channel is currently pooled.
     */
    has(channelName: string): boolean {
        return this.cache.has(channelName);
    }

    /**
     * Force-remove all channels (e.g., on logout / full cleanup).
     */
    releaseAll(): void {
        for (const [, entry] of this.cache) {
            supabase.removeChannel(entry.channel);
        }
        this.cache.clear();
    }

    /** Active channel count (for diagnostics). */
    get size(): number {
        return this.cache.size;
    }
}

export const wsConnectionCache = WebSocketConnectionCache.getInstance();
export default WebSocketConnectionCache;
