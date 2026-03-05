/**
 * Auth Session Utilities
 * Extracted from auth.ts for better modularity
 */

import { getAccessToken, isTokenExpired, clearTokens } from './auth-token-utils';
import type { AuthState } from './auth-types';

const SESSION_LAST_ACTIVE_KEY = 'wellnexus_last_active';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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

export function getInitialAuthState(): AuthState {
    const token = getAccessToken();

    if (!token || isTokenExpired()) {
        return { status: 'unauthenticated', user: null, token: null };
    }

    return { status: 'loading', user: null, token };
}
