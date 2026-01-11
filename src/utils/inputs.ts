/**
 * Form Input Utilities
 * Phase 17: Forms and Tables
 */

// ============================================================================
// INPUT FORMATTING
// ============================================================================

/**
 * Format phone number as user types
 */
export function formatPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

/**
 * Format currency as user types
 */
export function formatCurrencyInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse formatted currency back to number
 */
export function parseCurrencyInput(value: string): number {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
}

/**
 * Format credit card number
 */
export function formatCardInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
}

/**
 * Format date input (DD/MM/YYYY)
 */
export function formatDateInput(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

// ============================================================================
// INPUT CONSTRAINTS
// ============================================================================

/**
 * Limit input to max length
 */
export function maxLength(value: string, max: number): string {
    return value.slice(0, max);
}

/**
 * Allow only digits
 */
export function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

/**
 * Allow only alphanumeric
 */
export function alphanumericOnly(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(value: string): string {
    return value.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Force lowercase
 */
export function lowercase(value: string): string {
    return value.toLowerCase();
}

/**
 * Force uppercase
 */
export function uppercase(value: string): string {
    return value.toUpperCase();
}

// ============================================================================
// SLUG GENERATION
// ============================================================================

/**
 * Convert string to URL slug
 */
export function toSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// ============================================================================
// INPUT MASKING
// ============================================================================

export type MaskType = 'phone' | 'currency' | 'card' | 'date';

export function applyMask(value: string, maskType: MaskType): string {
    switch (maskType) {
        case 'phone':
            return formatPhoneInput(value);
        case 'currency':
            return formatCurrencyInput(value);
        case 'card':
            return formatCardInput(value);
        case 'date':
            return formatDateInput(value);
        default:
            return value;
    }
}
