/**
 * Auth Token Utilities
 * Extracted from auth.ts for better modularity
 */

import { secureTokenStorage } from '../secure-token-storage';
import type { AuthTokens, JWTPayload } from './auth-types';

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

/**
 * Decode a JWT token and return the payload.
 * Uses proper Base64URL decoding with padding restoration.
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Decode payload with proper Base64URL handling
        const decodedPayload = decodeBase64Url(parts[1]);
        if (!decodedPayload) return null;

        const parsed = JSON.parse(decodedPayload) as unknown;

        // Validate payload is an object with required fields
        if (typeof parsed !== 'object' || parsed === null) {
            return null;
        }

        const jwtPayload = parsed as Record<string, unknown>;

        // Validate required JWT fields
        if (typeof jwtPayload.sub !== 'string') {
            return null;
        }
        if (typeof jwtPayload.exp !== 'number') {
            return null;
        }
        if (typeof jwtPayload.iat !== 'number') {
            return null;
        }

        // Build JWTPayload with verified fields
        return {
            sub: jwtPayload.sub as string,
            exp: jwtPayload.exp as number,
            iat: jwtPayload.iat as number,
            email: jwtPayload.email as string | undefined,
            role: jwtPayload.role as string | undefined,
            iss: jwtPayload.iss as string | undefined,
            aud: jwtPayload.aud as string | undefined,
            jti: jwtPayload.jti as string | undefined,
        };
    } catch {
        return null;
    }
}

/**
 * Decode Base64URL string with proper padding restoration.
 * JWT uses Base64URL encoding which differs from standard Base64.
 */
function decodeBase64Url(base64Url: string): string | null {
    try {
        // Convert Base64URL to Base64
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Restore padding (Base64URL removes padding, atob requires it)
        const paddingNeeded = (4 - (base64.length % 4)) % 4;
        base64 = base64.padEnd(base64.length + paddingNeeded, '=');

        return atob(base64);
    } catch {
        return null;
    }
}

/**
 * Check if a JWT token is expired.
 * Validates payload structure and expiration timestamp.
 */
export function isJWTExpired(token: string): boolean {
    const payload = decodeJWT(token);
    if (!payload) return true;

    // Validate exp field exists and is a number
    if (typeof payload.exp !== 'number') {
        return true;
    }

    // JWT exp is in seconds, convert to milliseconds for comparison
    const expiryMs = payload.exp * 1000;
    return Date.now() >= expiryMs;
}

/**
 * Get remaining time in milliseconds before JWT expiration.
 * Returns 0 if token is invalid or already expired.
 */
export function getJWTRemainingTime(token: string): number {
    const payload = decodeJWT(token);
    if (!payload) return 0;

    // Validate exp field exists and is a number
    if (typeof payload.exp !== 'number') {
        return 0;
    }

    // JWT exp is in seconds, convert to milliseconds for comparison
    const expiryMs = payload.exp * 1000;
    return Math.max(0, expiryMs - Date.now());
}
