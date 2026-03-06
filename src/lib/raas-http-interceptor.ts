/**
 * RaaS HTTP Interceptor
 *
 * Intercept all API calls to inject license key for RaaS gate.
 * Phase 1: License Gating for Admin Dashboard & PayOS
 */

import { api } from '@/utils/api';
import { getCachedLicenseResult } from './raas-gate';

// ============================================================================
// INTERCEPTOR STATE
// ============================================================================

let interceptorEnabled = false;
let originalGetHeaders: ((method: string) => Record<string, string>) | null = null;

// ============================================================================
// INTERCEPTOR LOGIC
// ============================================================================

/**
 * Inject license key into API request headers
 */
function injectLicenseHeader(headers: Record<string, string>): Record<string, string> {
    const licenseResult = getCachedLicenseResult();

    // @ts-expect-error - tier comparison across different contexts
    if (licenseResult.isValid && licenseResult.tier !== 'free') {
        // Inject license key as header for server-side validation
        return {
            ...headers,
            'X-RAAS-License': licenseResult.tier,
            'X-RAAS-Valid': 'true',
        };
    }

    return {
        ...headers,
        'X-RAAS-Valid': 'false',
    };
}

/**
 * Patch ApiClient getHeaders to inject license info
 */
function patchApiClientHeaders(): void {
    // @ts-expect-error - getHeaders is protected, but we patch it at runtime
    const originalMethod = api.getHeaders.bind(api);

    // @ts-expect-error - getHeaders is protected, but we patch it at runtime
    api.getHeaders = function (method: string): Record<string, string> {
        const headers = originalMethod(method);
        return injectLicenseHeader(headers);
    };
}

/**
 * Restore original ApiClient headers
 */
function restoreApiClientHeaders(): void {
    if (originalGetHeaders) {
        // @ts-expect-error - getHeaders is protected, but we patch it at runtime
        api.getHeaders = originalGetHeaders;
        originalGetHeaders = null;
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Enable RaaS license interceptor for all API calls
 * Call this at app startup (before any API calls)
 */
export function enableRAASInterceptor(): void {
    if (interceptorEnabled) {
        return;
    }

    try {
        patchApiClientHeaders();
        interceptorEnabled = true;
        console.warn('[RaaS Interceptor] Enabled - License gating active');
    } catch (error) {
        console.error('[RaaS Interceptor] Failed to enable:', error);
        interceptorEnabled = false;
    }
}

/**
 * Disable RaaS license interceptor
 * Useful for testing or logout
 */
export function disableRAASInterceptor(): void {
    if (!interceptorEnabled) {
        return;
    }

    try {
        restoreApiClientHeaders();
        interceptorEnabled = false;
        console.warn('[RaaS Interceptor] Disabled');
    } catch (error) {
        console.error('[RaaS Interceptor] Failed to disable:', error);
    }
}

/**
 * Check if interceptor is currently enabled
 */
export function isRAASInterceptorEnabled(): boolean {
    return interceptorEnabled;
}
