/**
 * Authentication Utilities
 * Phase 11: Auth and Media
 */

import { secureTokenStorage } from './secure-token-storage';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export function setTokens(tokens: AuthTokens): void {
    secureTokenStorage.setAccessToken(tokens.accessToken);
    secureTokenStorage.setRefreshToken(tokens.refreshToken);
    secureTokenStorage.setExpiresAt(tokens.expiresAt);
}

export function getAccessToken(): string | null {
    return secureTokenStorage.getAccessToken();
}

export function getRefreshToken(): string | null {
    return secureTokenStorage.getRefreshToken();
}

export function clearTokens(): void {
    secureTokenStorage.clear();
}

export function isTokenExpired(): boolean {
    const expiry = secureTokenStorage.getExpiresAt();
    if (!expiry) return true;
    return Date.now() > expiry;
}

export function getTokenExpiresIn(): number {
    const expiry = secureTokenStorage.getExpiresAt();
    if (!expiry) return 0;
    return Math.max(0, expiry - Date.now());
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

export interface JWTPayload {
    sub: string;
    exp: number;
    iat: number;
    email?: string;
    role?: string;
    [key: string]: unknown;
}

export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded) as JWTPayload;
    } catch {
        return null;
    }
}

export function isJWTExpired(token: string): boolean {
    const payload = decodeJWT(token);
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
}

export function getJWTRemainingTime(token: string): number {
    const payload = decodeJWT(token);
    if (!payload) return 0;
    return Math.max(0, payload.exp * 1000 - Date.now());
}

// ============================================================================
// AUTH STATE
// ============================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
    status: AuthStatus;
    user: AuthUser | null;
    token: string | null;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'distributor' | 'vendor';
    avatar?: string;
}

export function getInitialAuthState(): AuthState {
    const token = getAccessToken();

    if (!token || isTokenExpired()) {
        return { status: 'unauthenticated', user: null, token: null };
    }

    return { status: 'loading', user: null, token };
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

export type Permission =
    | 'read:products'
    | 'write:products'
    | 'read:orders'
    | 'write:orders'
    | 'read:users'
    | 'write:users'
    | 'read:analytics'
    | 'admin:all'
    | 'vendor:manage-products';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    user: ['read:products', 'read:orders'],
    distributor: ['read:products', 'read:orders', 'write:orders', 'read:analytics'],
    vendor: ['read:products', 'read:orders', 'write:orders', 'read:analytics', 'vendor:manage-products'],
    admin: ['admin:all'],
};

export function hasPermission(role: string, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes('admin:all') || permissions.includes(permission);
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

// ============================================================================
// VENDOR-SPECIFIC AUTHORIZATION UTILITIES
// ============================================================================

/**
 * Checks if a user is authorized to perform operations on a specific product
 * @param productId - The ID of the product
 * @param userId - The ID of the user requesting access
 * @returns Promise<boolean> - True if user is authorized, false otherwise
 */
export const checkProductAuthorization = async (productId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('vendor_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - product doesn't belong to this user
        await logAuditEvent(userId, 'UNAUTHORIZED_ACCESS', 'products', productId);
        return false;
      }
      console.error('Error checking product authorization:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error in checkProductAuthorization:', error);
    return false;
  }
};

/**
 * Verifies if a user has vendor role
 * @param userId - The ID of the user
 * @returns Promise<boolean> - True if user is a vendor, false otherwise
 */
export const isUserVendor = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }

    return data?.role === 'vendor' || data?.role === 'admin';
  } catch (error) {
    console.error('Unexpected error in isUserVendor:', error);
    return false;
  }
};

/**
 * Gets the vendor ID associated with a product
 * @param productId - The ID of the product
 * @returns Promise<string|null> - The vendor ID or null if not found
 */
export const getProductVendorId = async (productId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error getting product vendor ID:', error);
      return null;
    }

    return data?.vendor_id || null;
  } catch (error) {
    console.error('Unexpected error in getProductVendorId:', error);
    return null;
  }
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export type AuditEventType =
  | 'UNAUTHORIZED_ACCESS'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VENDOR_LOGIN'
  | 'SETTINGS_UPDATED';

/**
 * Logs audit events for vendor actions
 * @param userId - The ID of the user
 * @param eventType - Type of audit event
 * @param resource - Resource type (e.g., 'products', 'settings')
 * @param resourceId - ID of the affected resource
 * @param metadata - Additional metadata
 */
export const logAuditEvent = async (
  userId: string,
  eventType: AuditEventType,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      event_type: eventType,
      resource,
      resource_id: resourceId,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

// ============================================================================
// RATE LIMITING
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const RATE_LIMIT_STORAGE_KEY = 'vendor_rate_limit_';

/**
 * Checks if a vendor has exceeded their rate limit
 * @param userId - The ID of the user
 * @returns boolean - True if rate limit exceeded, false otherwise
 */
export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const key = RATE_LIMIT_STORAGE_KEY + userId;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }));
      return false;
    }

    const { count, resetAt } = JSON.parse(stored);

    if (now > resetAt) {
      // Window expired, reset counter
      localStorage.setItem(key, JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }));
      return false;
    }

    if (count >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limit exceeded
      logAuditEvent(userId, 'RATE_LIMIT_EXCEEDED', 'api', undefined, { count, resetAt });
      return true;
    }

    // Increment counter
    localStorage.setItem(key, JSON.stringify({ count: count + 1, resetAt }));
    return false;
  } catch {
    // If localStorage fails, allow the request
    return false;
  }
};

/**
 * Gets remaining requests in current rate limit window
 * @param userId - The ID of the user
 * @returns number - Remaining requests
 */
export const getRateLimitRemaining = (userId: string): number => {
  const key = RATE_LIMIT_STORAGE_KEY + userId;
  const stored = localStorage.getItem(key);

  if (!stored) return RATE_LIMIT_MAX_REQUESTS;

  const { count, resetAt } = JSON.parse(stored);
  if (Date.now() > resetAt) return RATE_LIMIT_MAX_REQUESTS;

  return Math.max(0, RATE_LIMIT_MAX_REQUESTS - count);
};

// ============================================================================
// SESSION UTILITIES
// ============================================================================

const SESSION_LAST_ACTIVE_KEY = 'wellnexus_last_active';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function updateLastActive(): void {
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
}

export function isSessionActive(): boolean {
    const lastActive = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    if (!lastActive) return false;
    return Date.now() - parseInt(lastActive, 10) < SESSION_TIMEOUT_MS;
}

export function clearSession(): void {
    sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
    clearTokens();
}
