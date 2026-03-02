/**
 * Performance Timing, Capture, Debounce and Throttle — measureAsync with Mark/Measure API, exception/message capture, debounce, and throttle utilities
 */

import { ErrorLevel } from '@/types/monitoring';
import { perfLogger } from './logger';

/**
 * Capture exceptions into the logging system (mocking Sentry/Telemetry)
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
 * Measure execution time of an async operation using Browser Performance Mark/Measure API
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
