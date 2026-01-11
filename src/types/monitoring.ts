/**
 * Error Tracking & Performance Monitoring Types
 * Phase 3: Scale Optimization
 */

// ============================================================================
// ERROR TRACKING (SENTRY-COMPATIBLE)
// ============================================================================

export interface ErrorEvent {
    eventId: string;
    timestamp: string;
    level: ErrorLevel;
    message: string;
    stackTrace?: string;
    tags: Record<string, string>;
    user?: ErrorUser;
    context?: Record<string, unknown>;
    breadcrumbs?: Breadcrumb[];
}

export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorUser {
    id: string;
    email?: string;
    username?: string;
    ipAddress?: string;
}

export interface Breadcrumb {
    timestamp: string;
    category: 'navigation' | 'http' | 'ui.click' | 'console' | 'user';
    message: string;
    level: ErrorLevel;
    data?: Record<string, unknown>;
}

export interface SentryConfig {
    dsn: string;
    environment: 'development' | 'staging' | 'production';
    release: string;
    sampleRate: number;
    tracesSampleRate: number;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
    // Core Web Vitals
    lcp: number;  // Largest Contentful Paint
    fid: number;  // First Input Delay
    cls: number;  // Cumulative Layout Shift
    fcp: number;  // First Contentful Paint
    ttfb: number; // Time to First Byte

    // Custom Metrics
    bundleLoadTime: number;
    apiResponseTime: number;
    renderTime: number;
    hydrationTime: number;
}

export interface PerformanceThresholds {
    lcp: { good: 2500; needsImprovement: 4000 };
    fid: { good: 100; needsImprovement: 300 };
    cls: { good: 0.1; needsImprovement: 0.25 };
}

export interface PerformanceReport {
    timestamp: string;
    url: string;
    metrics: PerformanceMetrics;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
    isRated: 'good' | 'needs-improvement' | 'poor';
}

// ============================================================================
// MONITORING SERVICE INTERFACE
// ============================================================================

export interface MonitoringService {
    captureException: (error: Error, context?: Record<string, unknown>) => string;
    captureMessage: (message: string, level?: ErrorLevel) => string;
    addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
    setUser: (user: ErrorUser | null) => void;
    setTag: (key: string, value: string) => void;
    startTransaction: (name: string, op: string) => TransactionContext;
}

export interface TransactionContext {
    traceId: string;
    spanId: string;
    finish: () => void;
    setStatus: (status: 'ok' | 'error' | 'cancelled') => void;
}

// ============================================================================
// LAZY LOADING TYPES
// ============================================================================

export interface LazyLoadConfig {
    rootMargin: string;
    threshold: number | number[];
    preloadDistance: number;
}

export interface LazyComponentState {
    isLoaded: boolean;
    isLoading: boolean;
    error: Error | null;
    retryCount: number;
}

// ============================================================================
// SERVICE WORKER TYPES
// ============================================================================

export interface ServiceWorkerConfig {
    cacheName: string;
    cacheVersion: string;
    offlineUrl: string;
    cacheStrategies: CacheStrategy[];
}

export interface CacheStrategy {
    urlPattern: RegExp;
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
    maxAge?: number;
    maxEntries?: number;
}

export interface OfflineCapability {
    isOffline: boolean;
    cachedPages: string[];
    pendingSync: SyncRequest[];
    lastOnlineAt: string | null;
}

export interface SyncRequest {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE';
    body: unknown;
    timestamp: string;
    retryCount: number;
}
