/**
 * Analytics Tracking Utilities
 * Phase 5: Production Hardening
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export type AnalyticsEvent =
    | { name: 'page_view'; properties: { path: string; title: string } }
    | { name: 'login'; properties: { method: 'email' | 'social' | 'demo' } }
    | { name: 'signup'; properties: { method: 'email' | 'social' } }
    | { name: 'product_view'; properties: { productId: string; productName: string } }
    | { name: 'add_to_cart'; properties: { productId: string; price: number } }
    | { name: 'purchase'; properties: { orderId: string; amount: number; items: number } }
    | { name: 'withdrawal'; properties: { amount: number; method: string } }
    | { name: 'referral_share'; properties: { channel: 'copy' | 'social' | 'qr' } }
    | { name: 'agent_executed'; properties: { agentName: string; action: string } }
    | { name: 'error'; properties: { code: string; message: string; page: string } };

// ============================================================================
// USER PROPERTIES
// ============================================================================

export interface AnalyticsUser {
    userId: string;
    email?: string;
    name?: string;
    rank?: string;
    joinedAt?: string;
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
    private enabled: boolean;
    private user: AnalyticsUser | null = null;
    private queue: AnalyticsEvent[] = [];

    constructor() {
        this.enabled = import.meta.env.PROD;
    }

    identify(user: AnalyticsUser): void {
        this.user = user;

        if (!this.enabled) {
            console.log('[Analytics] Identify:', user);
            return;
        }

        // Send to analytics provider (GA4, Mixpanel, etc.)
        this.sendToProvider('identify', { user });
    }

    track(event: AnalyticsEvent): void {
        if (!this.enabled) {
            console.log('[Analytics] Track:', event.name, event.properties);
            return;
        }

        // Add common properties
        const enrichedEvent = {
            ...event,
            properties: {
                ...event.properties,
                timestamp: new Date().toISOString(),
                userId: this.user?.userId,
                sessionId: this.getSessionId(),
            },
        };

        this.sendToProvider('track', enrichedEvent);
    }

    page(path: string, title: string): void {
        this.track({
            name: 'page_view',
            properties: { path, title },
        });
    }

    private getSessionId(): string {
        let sessionId = sessionStorage.getItem('analytics_session');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            sessionStorage.setItem('analytics_session', sessionId);
        }
        return sessionId;
    }

    private sendToProvider(type: string, payload: unknown): void {
        // Placeholder for actual analytics provider integration
        // Could be Google Analytics, Mixpanel, Amplitude, etc.

        // Example GA4 integration:
        // if (window.gtag) {
        //   window.gtag('event', payload.name, payload.properties);
        // }

        // For now, just log in production
        if (import.meta.env.DEV) {
            console.debug('[Analytics]', type, payload);
        }
    }

    // ============================================================================
    // CONVENIENCE METHODS
    // ============================================================================

    trackPurchase(orderId: string, amount: number, items: number): void {
        this.track({
            name: 'purchase',
            properties: { orderId, amount, items },
        });
    }

    trackAgentExecution(agentName: string, action: string): void {
        this.track({
            name: 'agent_executed',
            properties: { agentName, action },
        });
    }

    trackError(code: string, message: string): void {
        this.track({
            name: 'error',
            properties: {
                code,
                message,
                page: typeof window !== 'undefined' ? window.location.pathname : ''
            },
        });
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const analytics = new AnalyticsService();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracking(): void {
    const location = useLocation();

    useEffect(() => {
        analytics.page(location.pathname, document.title);
    }, [location.pathname]);
}
