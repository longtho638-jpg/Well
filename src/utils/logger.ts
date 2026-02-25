/**
 * Structured Logger Utility
 * Phase 9 Refactoring - Replaces direct console.log calls
 * 
 * Features:
 * - Environment-aware (dev vs prod)
 * - Namespace prefixes for easy filtering
 * - Structured log levels
 * - Console suppression in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    namespace: string;
    enabled?: boolean;
}

const IS_DEV = import.meta.env.DEV;
const LOG_COLORS: Record<LogLevel, string> = {
    debug: '#9ca3af',  // gray
    info: '#10b981',   // emerald
    warn: '#f59e0b',   // amber
    error: '#ef4444',  // red
};

class Logger {
    private namespace: string;
    private enabled: boolean;

    constructor(options: LoggerOptions) {
        this.namespace = options.namespace;
        this.enabled = options.enabled ?? IS_DEV;
    }

    private formatPrefix(): string {
        const timestamp = new Date().toISOString().slice(11, 19);
        return `[${timestamp}] [${this.namespace}]`;
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (!this.enabled) return;

        const prefix = this.formatPrefix();
        const color = LOG_COLORS[level];
        const logFn = console[level] || console.log; // eslint-disable-line no-console

        if (IS_DEV) {
            logFn(
                `%c${prefix}%c ${message}`,
                `color: ${color}; font-weight: bold`,
                'color: inherit',
                ...args
            );
        } else {
            // In production, only log warnings and errors
            if (level === 'warn' || level === 'error') {
                logFn(`${prefix} ${message}`, ...args);
            }
        }
    }

    debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }
}

// Pre-configured loggers for different modules
export const createLogger = (namespace: string): Logger => new Logger({ namespace });

// Common namespaced loggers
export const authLogger = createLogger('Auth');
export const teamLogger = createLogger('Team');
export const agentLogger = createLogger('AgentOS');
export const analyticsLogger = createLogger('Analytics');
export const storeLogger = createLogger('Store');
export const adminLogger = createLogger('Admin');
export const uiLogger = createLogger('UI');
export const walletLogger = createLogger('Wallet');
export const aiLogger = createLogger('AI');
export const perfLogger = createLogger('Perf');

export { Logger };


