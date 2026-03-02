/**
 * Web Vitals and Device Metrics Collector — collects Core Web Vitals, device type, connection type, and generates performance reports
 */

import { PerformanceMetrics, PerformanceReport } from '@/types/monitoring';
import { perfLogger } from './logger';

/**
 * Collect Core Web Vitals and basic navigation metrics
 */
export function collectWebVitals(): Partial<PerformanceMetrics> {
    if (typeof window === 'undefined' || !window.performance) return {};

    try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

        return {
            ttfb: navigation?.responseStart || 0,
            fcp: fcp?.startTime || 0,
            bundleLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        };
    } catch (e) {
        perfLogger.warn('Failed to collect web vitals', e);
        return {};
    }
}

interface NetworkInformation extends EventTarget {
    readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    readonly downlink: number;
    readonly rtt: number;
    readonly saveData: boolean;
}

interface NavigatorWithConnection extends Navigator {
    readonly connection?: NetworkInformation;
}

/**
 * Rate performance based on Core Web Vitals industry thresholds
 */
export function ratePerformance(metrics: Partial<PerformanceMetrics>): 'good' | 'needs-improvement' | 'poor' {
    const { lcp = 0, fid = 0, cls = 0 } = metrics;
    if (lcp === 0 && fid === 0 && cls === 0) return 'good';
    if (lcp > 4000 || fid > 300 || cls > 0.25) return 'poor';
    if (lcp > 2500 || fid > 100 || cls > 0.1) return 'needs-improvement';
    return 'good';
}

/**
 * Detect device category from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|iphone|ipod|android.*mobile/.test(ua)) return 'mobile';
    if (/ipad|android(?!.*mobile)/.test(ua)) return 'tablet';
    return 'desktop';
}

/**
 * Get effective connection type via Network Information API
 */
export function getConnectionType(): 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' {
    if (typeof navigator === 'undefined') return 'wifi';
    const nav = navigator as NavigatorWithConnection;
    return nav.connection?.effectiveType || 'wifi';
}

/**
 * Generate a comprehensive performance report for the current session
 */
export function createPerformanceReport(): PerformanceReport {
    const metricsFromVitals = collectWebVitals();

    return {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        metrics: {
            lcp: 0,
            fid: 0,
            cls: 0,
            fcp: metricsFromVitals.fcp || 0,
            ttfb: metricsFromVitals.ttfb || 0,
            bundleLoadTime: metricsFromVitals.bundleLoadTime || 0,
            apiResponseTime: 0,
            renderTime: 0,
            hydrationTime: 0,
        },
        deviceType: getDeviceType(),
        connectionType: getConnectionType(),
        isRated: ratePerformance(metricsFromVitals),
    };
}
