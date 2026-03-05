/**
 * CSRF Protection - Server-side Validation
 * Calls Supabase Edge Function to validate CSRF tokens on mutations
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from './logger';

// Get Supabase URL and anon key from environment (public values)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const logger = createLogger('CSRF');

interface CsrfValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate CSRF token server-side via Edge Function
 * Should be called before sensitive mutations
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            logger.warn('CSRF validation skipped - no authenticated user');
            return false;
        }

        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/validate-csrf`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    token,
                    userId: user.id,
                }),
            }
        );

        const result: CsrfValidationResult = await response.json();

        if (!result.valid) {
            logger.error('CSRF validation failed', { error: result.error });
            return false;
        }

        return true;
    } catch (error) {
        logger.error('CSRF validation error', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}

/**
 * Generate CSRF token client-side (for form submissions)
 * This token should be validated server-side before processing
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF-protected mutation helper
 * Wraps mutations with CSRF validation
 */
export async function withCsrfProtection<T>(
    mutationFn: () => Promise<T>,
    options?: { skipValidation?: boolean }
): Promise<T> {
    // Skip validation in development or if explicitly disabled
    if (import.meta.env.DEV || options?.skipValidation) {
        return mutationFn();
    }

    const token = generateCsrfToken();
    const isValid = await validateCsrfToken(token);

    if (!isValid) {
        throw new Error('CSRF validation failed');
    }

    return mutationFn();
}
