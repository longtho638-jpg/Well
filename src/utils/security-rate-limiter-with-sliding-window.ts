/**
 * Rate Limiter with Sliding Window — in-memory rate limiting by key with configurable attempts and window
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Check if action is rate limited
 */
export function isRateLimited(
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimits.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (entry.count >= maxAttempts) {
        return true;
    }

    entry.count++;
    return false;
}

/**
 * Reset rate limit for key
 */
export function resetRateLimit(key: string): void {
    rateLimits.delete(key);
}
