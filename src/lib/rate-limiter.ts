/**
 * Rate Limiter for AgencyOS commands
 * Prevents command spam and provides user feedback
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RequestLog {
    timestamp: number;
    command?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 10, // 10 commands
    windowMs: 60000, // per minute
};

class RateLimiter {
    private requests: Map<string, RequestLog[]> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
        this.config = config;
    }

    /**
     * Check if a request is allowed
     */
    isAllowed(key: string, command?: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];

        // Filter out old requests outside the time window
        const recentRequests = userRequests.filter(
            (req) => now - req.timestamp < this.config.windowMs
        );

        // Update the requests log
        this.requests.set(key, recentRequests);

        // Check if under limit
        if (recentRequests.length >= this.config.maxRequests) {
            return false;
        }

        // Add new request
        recentRequests.push({ timestamp: now, command });
        this.requests.set(key, recentRequests);

        return true;
    }

    /**
     * Get remaining requests for a key
     */
    getRemaining(key: string): number {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        const recentRequests = userRequests.filter(
            (req) => now - req.timestamp < this.config.windowMs
        );

        return Math.max(0, this.config.maxRequests - recentRequests.length);
    }

    /**
     * Get time until rate limit resets (in ms) — based on oldest request in window
     */
    getResetTime(key: string): number {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        const recentRequests = userRequests.filter(
            (req) => now - req.timestamp < this.config.windowMs
        );
        if (recentRequests.length === 0) return 0;

        const oldestInWindow = recentRequests[0];
        return Math.max(0, oldestInWindow.timestamp + this.config.windowMs - now);
    }

    /**
     * Clear all rate limit data for a key
     */
    reset(key: string): void {
        this.requests.delete(key);
    }

    /**
     * Clear all rate limit data
     */
    resetAll(): void {
        this.requests.clear();
    }
}

// Singleton instance for AgencyOS commands
export const commandRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60000, // 10 commands per minute
});

// Singleton instance for general API calls
export const apiRateLimiter = new RateLimiter({
    maxRequests: 30,
    windowMs: 60000, // 30 requests per minute
});

export default RateLimiter;
