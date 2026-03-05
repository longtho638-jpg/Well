/**
 * Authentication Utilities
 * Phase 11: Auth and Media
 *
 * Re-exports all auth modules for backward compatibility
 */

// Types
export * from './auth/auth-types';

// Token & JWT utilities
export * from './auth/auth-token-utils';

// Permission utilities
export * from './auth/auth-permissions';

// Vendor authorization
export {
    checkProductAuthorization,
    isUserVendor,
    getProductVendorId,
    logAuditEvent,
    checkRateLimit,
    getRateLimitRemaining,
} from './auth/auth-vendor';

// Session utilities
export {
    updateLastActive,
    isSessionActive,
    clearSession,
    getInitialAuthState,
} from './auth/auth-session';
