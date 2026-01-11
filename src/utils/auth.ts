/**
 * Authentication Utilities
 * Phase 11: Auth and Media
 */

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const TOKEN_KEY = 'wellnexus_auth_token';
const REFRESH_TOKEN_KEY = 'wellnexus_refresh_token';
const TOKEN_EXPIRY_KEY = 'wellnexus_token_expiry';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export function setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
}

export function getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isTokenExpired(): boolean {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry, 10);
}

export function getTokenExpiresIn(): number {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return 0;
    return Math.max(0, parseInt(expiry, 10) - Date.now());
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
    role: 'user' | 'admin' | 'distributor';
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
    | 'admin:all';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    user: ['read:products', 'read:orders'],
    distributor: ['read:products', 'read:orders', 'write:orders', 'read:analytics'],
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
