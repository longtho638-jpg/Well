/**
 * Performance Monitoring Utilities
 * Phase 3: Scale Optimization
 */

import { PerformanceMetrics, PerformanceReport, ErrorLevel } from '@/types/monitoring';
import { perfLogger } from './logger';

/**
 * Collect Core Web Vitals metrics
 */
export function collectWebVitals(): Partial<PerformanceMetrics> {
    if (typeof window === 'undefined' || !window.performance) {
        return {};
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

    return {
        ttfb: navigation?.responseStart || 0,
        fcp: fcp?.startTime || 0,
        bundleLoadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
    };
}

/**
 * Rate performance based on thresholds
 */
export function ratePerformance(metrics: Partial<PerformanceMetrics>): 'good' | 'needs-improvement' | 'poor' {
    const { lcp, fid, cls } = metrics;

    if (!lcp && !fid && !cls) return 'good'; // No data

    if ((lcp && lcp > 4000) || (fid && fid > 300) || (cls && cls > 0.25)) {
        return 'poor';
    }

    if ((lcp && lcp > 2500) || (fid && fid > 100) || (cls && cls > 0.1)) {
        return 'needs-improvement';
    }

    return 'good';
}

/**
 * Get device type from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof navigator === 'undefined') return 'desktop';

    const ua = navigator.userAgent.toLowerCase();

    if (/mobile|iphone|ipod|android.*mobile/.test(ua)) return 'mobile';
    if (/ipad|android(?!.*mobile)/.test(ua)) return 'tablet';

    return 'desktop';
}

/**
 * Get connection type
 */
export function getConnectionType(): 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' {
    if (typeof navigator === 'undefined') return '4g';

    const connection = (navigator as Navigator & { connection?: { effectiveType: string } }).connection;

    if (!connection) return 'wifi';

    const type = connection.effectiveType;
    if (type === 'slow-2g') return 'slow-2g';
    if (type === '2g') return '2g';
    if (type === '3g') return '3g';

    return '4g';
}

/**
 * Create performance report
 */
export function createPerformanceReport(): PerformanceReport {
    const metrics = collectWebVitals();

    return {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        metrics: {
            lcp: 0,
            fid: 0,
            cls: 0,
            fcp: metrics.fcp || 0,
            ttfb: metrics.ttfb || 0,
            bundleLoadTime: metrics.bundleLoadTime || 0,
            apiResponseTime: 0,
            renderTime: 0,
            hydrationTime: 0,
        },
        deviceType: getDeviceType(),
        connectionType: getConnectionType(),
        isRated: ratePerformance(metrics),
    };
}

/**
 * Console-based error capture (placeholder for Sentry)
 */
export function captureException(error: Error, context?: Record<string, unknown>): string {
    const eventId = `ERR-${Date.now().toString(36)}`;

    perfLogger.error(`[ErrorTracking] ${eventId}`, error.message, context);

    // In production, this would send to Sentry/monitoring service
    return eventId;
}

/**
 * Capture message with level
 */
export function captureMessage(message: string, level: ErrorLevel = 'info'): string {
    const eventId = `MSG-${Date.now().toString(36)}`;

    if (level === 'error' || level === 'fatal') {
        perfLogger.error(`[${level.toUpperCase()}] ${message}`);
    } else if (level === 'warning') {
        perfLogger.warn(`[${level.toUpperCase()}] ${message}`);
    } else {
        perfLogger.info(`[${level.toUpperCase()}] ${message}`);
    }

    return eventId;
}

/**
 * Measure async operation performance
 */
export async function measureAsync<T>(
    name: string,
    operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
    const start = performance.now();

    try {
        const result = await operation();
        const duration = performance.now() - start;

        if (duration > 1000) {
            captureMessage(`Slow operation: ${name} took ${duration.toFixed(0)}ms`, 'warning');
        }

        return { result, duration };
    } catch (error) {
        captureException(error as Error, { operation: name });
        throw error;
    }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
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
 * Throttle function for performance
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
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
