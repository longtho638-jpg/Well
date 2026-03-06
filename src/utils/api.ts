/**
 * Type-Safe API Client
 * Phase 5: Production Hardening
 */

import { captureException } from './performance';
import { csrfToken } from './security-csrf-token-generator-and-session-store';
import { UsageMeter } from '@/lib/usage-metering';

// ============================================================================
// API CONFIGURATION
// ============================================================================

interface ApiConfig {
    baseUrl: string;
    timeout: number;
    headers: Record<string, string>;
    usageMeter?: UsageMeter;
}

const defaultConfig: ApiConfig = {
    baseUrl: import.meta.env.VITE_API_URL || '',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface ApiError {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
}

export type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; error: ApiError };

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
    private config: ApiConfig;
    private authToken: string | null = null;

    constructor(config: Partial<ApiConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    setAuthToken(token: string | null): void {
        this.authToken = token;
    }

    setUsageMeter(meter: UsageMeter): void {
        this.config.usageMeter = meter;
    }

    protected getHeaders(method: string): Record<string, string> {
        const headers = { ...this.config.headers };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        // CSRF token for state-changing requests (defense-in-depth)
        if (method !== 'GET' && method !== 'HEAD') {
            headers['X-CSRF-Token'] = csrfToken.get();
        }
        return headers;
    }

    private async request<T>(
        method: string,
        endpoint: string,
        body?: unknown
    ): Promise<ApiResult<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
                method,
                headers: this.getHeaders(method),
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            const data = await response.json();

            if (!response.ok) {
                // Track failed API call
                if (this.config.usageMeter) {
                    await this.config.usageMeter.trackApiCall(endpoint, method, {
                        statusCode: response.status,
                        duration,
                        error: data.message || 'Request failed',
                    }).catch(console.error);
                }

                return {
                    success: false,
                    error: {
                        code: data.code || 'API_ERROR',
                        message: data.message || 'Request failed',
                        status: response.status,
                        details: data.details,
                    },
                };
            }

            // Track successful API call
            if (this.config.usageMeter) {
                await this.config.usageMeter.trackApiCall(endpoint, method, {
                    statusCode: response.status,
                    duration,
                }).catch(console.error);
            }

            return { success: true, data: data as T };
        } catch (error) {
            clearTimeout(timeoutId);

            const isAborted = error instanceof Error && error.name === 'AbortError';

            captureException(error as Error, { endpoint, method });

            // Track failed request
            if (this.config.usageMeter) {
                await this.config.usageMeter.trackApiCall(endpoint, method, {
                    error: isAborted ? 'Timeout' : 'Network error',
                }).catch(console.error);
            }

            return {
                success: false,
                error: {
                    code: isAborted ? 'TIMEOUT' : 'NETWORK_ERROR',
                    message: isAborted ? 'Request timed out' : 'Network error',
                    status: 0,
                },
            };
        }
    }

    async get<T>(endpoint: string): Promise<ApiResult<T>> {
        return this.request<T>('GET', endpoint);
    }

    async post<T>(endpoint: string, body: unknown): Promise<ApiResult<T>> {
        return this.request<T>('POST', endpoint, body);
    }

    async put<T>(endpoint: string, body: unknown): Promise<ApiResult<T>> {
        return this.request<T>('PUT', endpoint, body);
    }

    async patch<T>(endpoint: string, body: unknown): Promise<ApiResult<T>> {
        return this.request<T>('PATCH', endpoint, body);
    }

    async delete<T>(endpoint: string): Promise<ApiResult<T>> {
        return this.request<T>('DELETE', endpoint);
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const api = new ApiClient();

// ============================================================================
// TYPED API ENDPOINTS
// ============================================================================

export const endpoints = {
    auth: {
        login: '/auth/login',
        signup: '/auth/signup',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
    },
    users: {
        me: '/users/me',
        profile: (id: string) => `/users/${id}`,
        update: '/users/me',
    },
    products: {
        list: '/products',
        detail: (id: string) => `/products/${id}`,
        search: (query: string) => `/products/search?q=${encodeURIComponent(query)}`,
    },
    orders: {
        list: '/orders',
        create: '/orders',
        detail: (id: string) => `/orders/${id}`,
    },
    transactions: {
        list: '/transactions',
        withdraw: '/transactions/withdraw',
    },
} as const;
