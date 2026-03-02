/**
 * Security Utilities — barrel re-exporting XSS sanitization, CSRF, rate limiting, secure storage, and password strength
 * Phase 6: Security + i18n
 */

export {
    sanitizeHtml,
    sanitizeInput,
    sanitizeUrl,
} from './security-xss-sanitization-helpers';

export {
    generateCsrfToken,
    csrfToken,
} from './security-csrf-token-generator-and-session-store';

export {
    isRateLimited,
    resetRateLimit,
} from './security-rate-limiter-with-sliding-window';

export {
    encodeSecure,
    decodeSecure,
    secureStorage,
} from './security-obfuscated-localstorage-wrapper';

export type { PasswordStrength } from './security-password-strength-checker';
export { checkPasswordStrength } from './security-password-strength-checker';
