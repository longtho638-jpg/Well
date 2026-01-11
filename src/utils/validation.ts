/**
 * Form Validation Utilities
 * Phase 5: Production Hardening
 */

// ============================================================================
// VALIDATION RULES
// ============================================================================

export type ValidationRule<T> = (value: T) => string | null;

export const required = (message = 'Trường này là bắt buộc'): ValidationRule<unknown> =>
    (value) => value === '' || value === null || value === undefined ? message : null;

export const email = (message = 'Email không hợp lệ'): ValidationRule<string> =>
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message;

export const phone = (message = 'Số điện thoại không hợp lệ'): ValidationRule<string> =>
    (value) => /^(0|84|\+84)[0-9]{9}$/.test(value.replace(/\s/g, '')) ? null : message;

export const minLength = (min: number, message?: string): ValidationRule<string> =>
    (value) => value.length >= min ? null : message || `Tối thiểu ${min} ký tự`;

export const maxLength = (max: number, message?: string): ValidationRule<string> =>
    (value) => value.length <= max ? null : message || `Tối đa ${max} ký tự`;

export const minValue = (min: number, message?: string): ValidationRule<number> =>
    (value) => value >= min ? null : message || `Giá trị tối thiểu là ${min}`;

export const maxValue = (max: number, message?: string): ValidationRule<number> =>
    (value) => value <= max ? null : message || `Giá trị tối đa là ${max}`;

export const pattern = (regex: RegExp, message: string): ValidationRule<string> =>
    (value) => regex.test(value) ? null : message;

export const match = (otherValue: () => string, message = 'Giá trị không khớp'): ValidationRule<string> =>
    (value) => value === otherValue() ? null : message;

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

export interface ValidationResult<T> {
    isValid: boolean;
    errors: Partial<Record<keyof T, string>>;
    firstError: string | null;
}

export function validate<T extends Record<string, unknown>>(
    data: T,
    rules: Partial<Record<keyof T, ValidationRule<unknown>[]>>
): ValidationResult<T> {
    const errors: Partial<Record<keyof T, string>> = {};
    let firstError: string | null = null;

    for (const [field, fieldRules] of Object.entries(rules)) {
        if (!fieldRules) continue;

        const value = data[field as keyof T];

        for (const rule of fieldRules) {
            const error = rule(value);
            if (error) {
                errors[field as keyof T] = error;
                if (!firstError) firstError = error;
                break;
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        firstError,
    };
}

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const loginSchema = {
    email: [required(), email()],
    password: [required(), minLength(6)],
};

export const signupSchema = {
    name: [required(), minLength(2), maxLength(50)],
    email: [required(), email()],
    phone: [required(), phone()],
    password: [required(), minLength(8)],
};

export const withdrawalSchema = {
    amount: [required(), minValue(100000, 'Tối thiểu 100,000đ')],
    bankAccount: [required(), minLength(8)],
    bankName: [required()],
};
