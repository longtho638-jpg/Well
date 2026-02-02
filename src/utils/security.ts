/**
 * Security Utilities
 * Phase 6: Security + i18n
 */

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .slice(0, 10000); // Limit length
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol)) {
            return parsed.href;
        }
        return null;
    } catch {
        return null;
    }
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token
 * Safari-safe: uses fallback for crypto API
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);

    // Safari-safe crypto with fallback
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
        try {
            crypto.getRandomValues(array);
        } catch {
            // Fallback to Math.random for non-HTTPS contexts
            for (let i = 0; i < 32; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
    } else {
        // Fallback to Math.random
        for (let i = 0; i < 32; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }

    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store and retrieve CSRF token
 */
export const csrfToken = {
    get(): string {
        let token = sessionStorage.getItem('csrf_token');
        if (!token) {
            token = generateCsrfToken();
            sessionStorage.setItem('csrf_token', token);
        }
        return token;
    },
    refresh(): string {
        const token = generateCsrfToken();
        sessionStorage.setItem('csrf_token', token);
        return token;
    },
};

// ============================================================================
// RATE LIMITING
// ============================================================================

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

// ============================================================================
// SECURE STORAGE
// ============================================================================

const ENCRYPTION_KEY = 'wellnexus_secure_v1';

/**
 * Encode sensitive data (basic obfuscation - not true encryption)
 */
export function encodeSecure(data: string): string {
    return btoa(encodeURIComponent(data));
}

/**
 * Decode secure data
 */
export function decodeSecure(encoded: string): string | null {
    try {
        return decodeURIComponent(atob(encoded));
    } catch {
        return null;
    }
}

/**
 * Secure localStorage wrapper
 */
export const secureStorage = {
    set(key: string, value: unknown): void {
        const encoded = encodeSecure(JSON.stringify(value));
        localStorage.setItem(`${ENCRYPTION_KEY}_${key}`, encoded);
    },

    get<T>(key: string): T | null {
        const encoded = localStorage.getItem(`${ENCRYPTION_KEY}_${key}`);
        if (!encoded) return null;

        const decoded = decodeSecure(encoded);
        if (!decoded) return null;

        try {
            return JSON.parse(decoded) as T;
        } catch {
            return null;
        }
    },

    remove(key: string): void {
        localStorage.removeItem(`${ENCRYPTION_KEY}_${key}`);
    },
};

// ============================================================================
// PASSWORD STRENGTH
// ============================================================================

export interface PasswordStrength {
    score: number; // 0-4
    label: 'weak' | 'fair' | 'good' | 'strong';
    suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 8) score++;
    else suggestions.push('Tối thiểu 8 ký tự');

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else suggestions.push('Kết hợp chữ hoa và chữ thường');

    if (/\d/.test(password)) score++;
    else suggestions.push('Thêm ít nhất 1 số');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else suggestions.push('Thêm ký tự đặc biệt');

    const labels: PasswordStrength['label'][] = ['weak', 'weak', 'fair', 'good', 'strong'];

    return {
        score,
        label: labels[score],
        suggestions,
    };
}
