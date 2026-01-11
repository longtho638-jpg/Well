/**
 * Developer Tools & Debug Utilities
 * Phase 7: Developer Experience
 */

// ============================================================================
// DEBUG LOGGER
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    data?: unknown;
}

class DebugLogger {
    private enabled: boolean;
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    constructor() {
        this.enabled = import.meta.env.DEV;
    }

    private log(level: LogLevel, category: string, message: string, data?: unknown): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            data,
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        if (!this.enabled) return;

        const prefix = `[${category}]`;
        const logFn = console[level] || console.log;

        if (data !== undefined) {
            logFn(prefix, message, data);
        } else {
            logFn(prefix, message);
        }
    }

    debug(category: string, message: string, data?: unknown): void {
        this.log('debug', category, message, data);
    }

    info(category: string, message: string, data?: unknown): void {
        this.log('info', category, message, data);
    }

    warn(category: string, message: string, data?: unknown): void {
        this.log('warn', category, message, data);
    }

    error(category: string, message: string, data?: unknown): void {
        this.log('error', category, message, data);
    }

    getLogs(options?: { level?: LogLevel; category?: string; limit?: number }): LogEntry[] {
        let filtered = [...this.logs];

        if (options?.level) {
            filtered = filtered.filter(log => log.level === options.level);
        }
        if (options?.category) {
            filtered = filtered.filter(log => log.category === options.category);
        }
        if (options?.limit) {
            filtered = filtered.slice(-options.limit);
        }

        return filtered;
    }

    clear(): void {
        this.logs = [];
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }
}

export const logger = new DebugLogger();

// ============================================================================
// PERFORMANCE PROFILER
// ============================================================================

interface ProfileEntry {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
}

const profiles = new Map<string, ProfileEntry>();

export function startProfile(name: string): void {
    profiles.set(name, {
        name,
        startTime: performance.now(),
    });
}

export function endProfile(name: string): number {
    const entry = profiles.get(name);
    if (!entry) {
        logger.warn('Profiler', `No profile found for: ${name}`);
        return 0;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    logger.debug('Profiler', `${name}: ${entry.duration.toFixed(2)}ms`);

    return entry.duration;
}

export function profileAsync<T>(
    name: string,
    fn: () => Promise<T>
): Promise<T> {
    startProfile(name);
    return fn().finally(() => endProfile(name));
}

// ============================================================================
// FEATURE FLAGS (DEV)
// ============================================================================

interface DevFlags {
    showDebugPanel: boolean;
    logApiCalls: boolean;
    logStateChanges: boolean;
    mockApiResponses: boolean;
    slowNetwork: boolean;
}

const defaultDevFlags: DevFlags = {
    showDebugPanel: false,
    logApiCalls: true,
    logStateChanges: false,
    mockApiResponses: false,
    slowNetwork: false,
};

export function getDevFlags(): DevFlags {
    if (!import.meta.env.DEV) return defaultDevFlags;

    try {
        const stored = localStorage.getItem('dev_flags');
        return stored ? { ...defaultDevFlags, ...JSON.parse(stored) } : defaultDevFlags;
    } catch {
        return defaultDevFlags;
    }
}

export function setDevFlag<K extends keyof DevFlags>(key: K, value: DevFlags[K]): void {
    const flags = getDevFlags();
    flags[key] = value;
    localStorage.setItem('dev_flags', JSON.stringify(flags));
}

// ============================================================================
// RENDER COUNTER (DEV)
// ============================================================================

const renderCounts = new Map<string, number>();

export function countRender(componentName: string): number {
    const count = (renderCounts.get(componentName) || 0) + 1;
    renderCounts.set(componentName, count);

    if (import.meta.env.DEV && count > 10) {
        logger.warn('Render', `${componentName} rendered ${count} times`);
    }

    return count;
}

export function getRenderStats(): Record<string, number> {
    return Object.fromEntries(renderCounts);
}

export function resetRenderStats(): void {
    renderCounts.clear();
}

// ============================================================================
// ENV INFO
// ============================================================================

export function getEnvInfo(): Record<string, string | boolean> {
    return {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD,
        baseUrl: import.meta.env.BASE_URL,
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
    };
}
