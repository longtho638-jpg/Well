/**
 * Server-side Rate Limiting Helper
 * Calls Supabase Edge Function to check rate limits before API calls
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from './logger';

const logger = createLogger('RateLimit');

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: string;
    fallback?: boolean;
    error?: string;
}

/**
 * Check rate limit for a specific action
 * Should be called before sensitive operations
 */
export async function checkRateLimit(
    action: string = 'default'
): Promise<RateLimitResult> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: '',
                error: 'Not authenticated',
            };
        }

        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-rate-limit`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    action,
                }),
            }
        );

        const result: RateLimitResult = await response.json();

        if (!result.allowed) {
            logger.warn('Rate limit exceeded', {
                action,
                remaining: result.remaining,
                resetAt: result.resetAt,
            });
        }

        return result;
    } catch (error) {
        logger.error('Rate limit check error', {
            error: error instanceof Error ? error.message : String(error),
        });
        // Fail open - allow request if rate limit check fails
        return {
            allowed: true,
            remaining: 99,
            resetAt: new Date(Date.now() + 60000).toISOString(),
            fallback: true,
        };
    }
}

/**
 * Rate limit actions enum
 */
export const RateLimitActions = {
    // Product operations
    CREATE_PRODUCT: 'products:create',
    UPDATE_PRODUCT: 'products:update',
    DELETE_PRODUCT: 'products:delete',

    // Order operations
    CREATE_ORDER: 'orders:create',
    CANCEL_ORDER: 'orders:cancel',

    // Auth operations
    LOGIN: 'auth:login',
    SIGNUP: 'auth:signup',
    RESET_PASSWORD: 'auth:reset_password',

    // API operations
    EXPORT_DATA: 'api:export',
    BULK_OPERATION: 'api:bulk',
} as const;

/**
 * Rate-limited mutation helper
 * Wraps mutations with rate limit check
 */
export async function withRateLimit<T>(
    mutationFn: () => Promise<T>,
    action: string,
    options?: { skipOnError?: boolean }
): Promise<T> {
    // Skip in development
    if (import.meta.env.DEV) {
        return mutationFn();
    }

    const result = await checkRateLimit(action);

    if (!result.allowed && !options?.skipOnError) {
        throw new Error(
            `Rate limit exceeded. Try again after ${new Date(result.resetAt).toLocaleTimeString()}`
        );
    }

    return mutationFn();
}
