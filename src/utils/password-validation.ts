
/**
 * Password Validation Utilities
 * Phase 5: Production Hardening
 */

export interface PasswordValidation {
    isValid: boolean;
    strength: 'weak' | 'fair' | 'good' | 'strong';
    errors: string[];
    score: number; // 0-100
}

/**
 * Validate a password against complexity rules
 *
 * Rules:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*)
 */
export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    let score = 0;

    // Length check (max 25 points)
    if (password.length >= 8) {
        score += 25;
    } else {
        errors.push('auth.password.requirements.length');
    }

    // Uppercase check (max 20 points)
    if (/[A-Z]/.test(password)) {
        score += 20;
    } else {
        errors.push('auth.password.requirements.uppercase');
    }

    // Lowercase check (max 20 points)
    if (/[a-z]/.test(password)) {
        score += 20;
    } else {
        errors.push('auth.password.requirements.lowercase');
    }

    // Number check (max 20 points)
    if (/[0-9]/.test(password)) {
        score += 20;
    } else {
        errors.push('auth.password.requirements.number');
    }

    // Special character check (max 15 points)
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 15;
    } else {
        errors.push('auth.password.requirements.special');
    }

    // Determine strength based on score
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';

    if (score < 50) {
        strength = 'weak';
    } else if (score < 75) {
        strength = 'fair';
    } else if (score < 90) {
        strength = 'good';
    } else {
        strength = 'strong';
    }

    // Overall validity requires no errors
    const isValid = errors.length === 0;

    return {
        isValid,
        strength,
        errors,
        score
    };
}

export function getStrengthColor(strength: string): string {
    switch (strength) {
        case 'weak':
            return 'bg-rose-500';
        case 'fair':
            return 'bg-amber-500';
        case 'good':
            return 'bg-blue-500';
        case 'strong':
            return 'bg-emerald-500';
        default:
            return 'bg-slate-700';
    }
}

export function getStrengthLabel(strength: string): string {
    switch (strength) {
        case 'weak':
            return 'Weak';
        case 'fair':
            return 'Fair';
        case 'good':
            return 'Good';
        case 'strong':
            return 'Strong';
        default:
            return '';
    }
}
