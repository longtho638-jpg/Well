/**
 * XSS Sanitization Helpers — DOMPurify wrappers for HTML, input, and URL sanitization
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks using DOMPurify
 */
export function sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input);
}

/**
 * Sanitize user input for safe display (strips all tags, plain text only)
 */
export function sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input.trim().slice(0, 10000), {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
}

/**
 * Validate and sanitize URL — returns null for non-http(s) protocols
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
