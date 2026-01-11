/**
 * Network Utilities
 * Phase 13: Network and Colors
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// ONLINE STATUS
// ============================================================================

export function useOnline(): boolean {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

// ============================================================================
// NETWORK INFORMATION
// ============================================================================

interface NetworkInfo {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
    downlink: number;
    rtt: number;
    saveData: boolean;
}

export function getNetworkInfo(): NetworkInfo {
    const connection = (navigator as NavigatorWithConnection).connection;

    if (!connection) {
        return {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false,
        };
    }

    return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
    };
}

interface NavigatorWithConnection extends Navigator {
    connection?: {
        effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
        addEventListener?: (event: string, handler: () => void) => void;
        removeEventListener?: (event: string, handler: () => void) => void;
    };
}

export function useNetworkInfo(): NetworkInfo {
    const [info, setInfo] = useState<NetworkInfo>(getNetworkInfo);

    useEffect(() => {
        const connection = (navigator as NavigatorWithConnection).connection;
        if (!connection) return;

        const handleChange = () => setInfo(getNetworkInfo());
        connection.addEventListener?.('change', handleChange);

        return () => connection.removeEventListener?.('change', handleChange);
    }, []);

    return info;
}

// ============================================================================
// FETCH WRAPPER
// ============================================================================

interface FetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

export async function fetchWithRetry<T>(
    url: string,
    options: FetchOptions = {}
): Promise<T> {
    const { timeout = 10000, retries = 3, retryDelay = 1000, ...fetchOptions } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error as Error;

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }
        }
    }

    throw lastError;
}

// ============================================================================
// CONNECTION CHECK
// ============================================================================

export async function checkConnection(testUrl = '/api/health'): Promise<boolean> {
    try {
        const response = await fetch(testUrl, {
            method: 'HEAD',
            cache: 'no-store',
        });
        return response.ok;
    } catch {
        return false;
    }
}

export function useConnectionCheck(testUrl?: string, interval = 30000) {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const check = async () => {
            const connected = await checkConnection(testUrl);
            setIsConnected(connected);
        };

        check();
        const timer = setInterval(check, interval);

        return () => clearInterval(timer);
    }, [testUrl, interval]);

    return isConnected;
}
