import { useEffect } from 'react';
import { analyticsLogger } from '@/utils/logger';

declare global {
    interface Window {
        va?: (...args: unknown[]) => void;
    }
}

/**
 * Analytics utility for tracking events in production
 */
export const analytics = {
    /**
     * Track a page view
     */
    pageView: (path: string) => {
        if (import.meta.env.PROD && window.va) {
            window.va('pageview', { path });
        }
    },

    /**
     * Track a custom event
     */
    event: (name: string, data?: Record<string, any>) => {
        if (import.meta.env.PROD && window.va) {
            window.va('event', { name, data });
        }

        // Also log to console in development
        if (import.meta.env.DEV) {
            analyticsLogger.debug('Event tracked', { name, data });
        }
    },

    /**
     * Track AgencyOS command execution
     */
    trackCommand: (command: string, success: boolean, executionTime?: number) => {
        analytics.event('agencyos_command', {
            command,
            success,
            executionTime,
        });
    },

    /**
     * Track agent interaction
     */
    trackAgent: (agentName: string, action: string, data?: Record<string, any>) => {
        analytics.event('agent_interaction', {
            agentName,
            action,
            ...data,
        });
    },

    /**
     * Track errors
     */
    trackError: (error: Error, context?: Record<string, any>) => {
        analytics.event('error', {
            message: error.message,
            stack: error.stack,
            ...context,
        });

        // In production, you might want to send to a service like Sentry
        analyticsLogger.error('Error tracked', { error: error.message, context });
    },

    /**
     * Track performance metrics
     */
    trackPerformance: (metric: string, value: number, unit = 'ms') => {
        analytics.event('performance', {
            metric,
            value,
            unit,
        });
    },
};

/**
 * Hook to track page views automatically
 */
export function usePageTracking(pageName: string) {
    useEffect(() => {
        analytics.pageView(pageName);
    }, [pageName]);
}

export default analytics;
