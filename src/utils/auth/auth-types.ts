/**
 * Auth Types
 * Extracted from auth.ts for better modularity
 */

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'distributor' | 'vendor';
    avatar?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface JWTPayload {
    sub: string;
    exp: number;
    iat: number;
    email?: string;
    role?: string;
    [key: string]: unknown;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
    status: AuthStatus;
    user: AuthUser | null;
    token: string | null;
}

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

export type AuditEventType =
    | 'UNAUTHORIZED_ACCESS'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'VENDOR_LOGIN'
    | 'SETTINGS_UPDATED';
