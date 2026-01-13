/**
 * Performance Monitoring Utilities
 * Phase 3: Scale Optimization
 * 
 * High-performance monitoring using Browser Performance API (Mark/Measure).
 */

import { PerformanceMetrics, PerformanceReport, ErrorLevel } from '@/types/monitoring';
import { perfLogger } from './logger';

/**
 * Collect Core Web Vitals and basic navigation metrics
 */
export function collectWebVitals(): Partial<PerformanceMetrics> {
    if (typeof window === 'undefined' || !window.performance) {
        return {};
    }

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
 * Rate performance based on industry thresholds (Core Web Vitals)
 */
export function ratePerformance(metrics: Partial<PerformanceMetrics>): 'good' | 'needs-improvement' | 'poor' {
    const { lcp = 0, fid = 0, cls = 0 } = metrics;

    if (lcp === 0 && fid === 0 && cls === 0) return 'good';

    // Industry standard thresholds
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
    const connection = nav.connection;

    if (!connection) return 'wifi';
    return connection.effectiveType || 'wifi';
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

/**
 * Capture exceptions into the logging system (Mocking Sentry/Telemetry)
 */
export function captureException(error: unknown, context?: Record<string, unknown>): string {
    const eventId = `ERR-${Date.now().toString(36)}`;
    const message = error instanceof Error ? error.message : String(error);

    perfLogger.error(`[PerformanceMonitor] ID: ${eventId} | Msg: ${message}`, context);

    return eventId;
}

/**
 * Capture non-error messages with standardized levels
 */
export function captureMessage(message: string, level: ErrorLevel = 'info'): string {
    const eventId = `MSG-${Date.now().toString(36)}`;
    const prefix = `[${level.toUpperCase()}] ${message}`;

    switch (level) {
        case 'error':
        case 'fatal':
            perfLogger.error(prefix);
            break;
        case 'warning':
            perfLogger.warn(prefix);
            break;
        default:
            perfLogger.info(prefix);
    }

    return eventId;
}

/**
 * Measure execution time of an asynchronous operation using Mark/Measure
 */
export async function measureAsync<T>(
    name: string,
    operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
    const markStart = `${name}-start`;
    const markEnd = `${name}-end`;

    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(markStart);
    }

    const t0 = performance.now();

    try {
        const result = await operation();
        const duration = performance.now() - t0;

        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(markEnd);
            performance.measure(name, markStart, markEnd);
        }

        if (duration > 1500) {
            captureMessage(`Critical latency in operation: ${name} (${duration.toFixed(0)}ms)`, 'warning');
        }

        return { result, duration };
    } catch (error) {
        captureException(error, { operation: name });
        throw error;
    }
}

/**
 * Standard debounce with proper type safety
 */
export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
}

/**
 * Standard throttle with proper type safety
 */
export function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}
