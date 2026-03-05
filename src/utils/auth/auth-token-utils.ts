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
