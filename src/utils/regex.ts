/**
 * Regex Utilities
 * Phase 15: Regex and Config
 */

// ============================================================================
// COMMON PATTERNS
// ============================================================================

export const patterns = {
    // Basic
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,

    // Vietnam specific
    phoneVN: /^(0|\+84)(3|5|7|8|9)\d{8}$/,
    citizenIdVN: /^\d{12}$/,

    // Formats
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^\d{2}:\d{2}(:\d{2})?$/,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,

    // Text
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    numericOnly: /^\d+$/,

    // Password
    strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,

    // Credit card (basic)
    creditCard: /^\d{4}(\s?\d{4}){3}$/,

    // UUID
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export type PatternName = keyof typeof patterns;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function matches(value: string, pattern: PatternName | RegExp): boolean {
    const regex = typeof pattern === 'string' ? patterns[pattern] : pattern;
    return regex.test(value);
}

export function isEmail(value: string): boolean {
    return patterns.email.test(value);
}

export function isPhoneVN(value: string): boolean {
    return patterns.phoneVN.test(value);
}

export function isUrl(value: string): boolean {
    return patterns.url.test(value);
}

export function isValidPassword(value: string): boolean {
    return patterns.strongPassword.test(value);
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

export function extractEmails(text: string): string[] {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    return text.match(emailRegex) || [];
}

export function extractPhones(text: string): string[] {
    const phoneRegex = /(0|\+84)(3|5|7|8|9)\d{8}/g;
    return text.match(phoneRegex) || [];
}

export function extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
    return text.match(urlRegex) || [];
}

export function extractNumbers(text: string): number[] {
    const numberRegex = /-?\d+(\.\d+)?/g;
    const matches = text.match(numberRegex);
    return matches ? matches.map(Number) : [];
}

export function extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g;
    return text.match(hashtagRegex) || [];
}

// ============================================================================
// REPLACEMENT FUNCTIONS
// ============================================================================

export function maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
}

export function maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    const maskedName = name.slice(0, 2) + '***' + name.slice(-1);
    return `${maskedName}@${domain}`;
}

export function formatPhoneVN(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('84')) {
        return '+84 ' + cleaned.slice(2, 5) + ' ' + cleaned.slice(5, 8) + ' ' + cleaned.slice(8);
    }
    return cleaned.slice(0, 4) + ' ' + cleaned.slice(4, 7) + ' ' + cleaned.slice(7);
}

export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

export function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
