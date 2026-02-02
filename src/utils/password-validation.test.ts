
import { describe, it, expect } from 'vitest';
import { validatePassword } from './password-validation';

describe('validatePassword', () => {
    it('should identify empty password as weak and invalid', () => {
        const result = validatePassword('');
        expect(result.isValid).toBe(false);
        expect(result.strength).toBe('weak');
        expect(result.errors.length).toBe(5); // All rules fail
    });

    it('should fail short passwords', () => {
        const result = validatePassword('Ab1!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('auth.password.requirements.length');
    });

    it('should require uppercase letter', () => {
        const result = validatePassword('password123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('auth.password.requirements.uppercase');
    });

    it('should require lowercase letter', () => {
        const result = validatePassword('PASSWORD123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('auth.password.requirements.lowercase');
    });

    it('should require number', () => {
        const result = validatePassword('Password!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('auth.password.requirements.number');
    });

    it('should require special character', () => {
        const result = validatePassword('Password123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('auth.password.requirements.special');
    });

    it('should pass strong passwords', () => {
        const result = validatePassword('StrongP@ssw0rd!');
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.score).toBe(100);
        expect(result.strength).toBe('strong');
    });

    it('should correctly grade "fair" passwords', () => {
        // 8 chars + number + uppercase + lowercase (missing special)
        // 25 + 20 + 20 + 20 = 85 (Good) - wait, score logic check
        // Missing special char means score -= 15 => max 85.
        // Let's create something weaker.
        // 8 chars + lowercase + number. Missing uppercase, special.
        // 25 + 20 + 20 = 65 (Fair)
        const result = validatePassword('password123');
        expect(result.strength).toBe('fair');
    });

    it('should correctly grade "good" passwords', () => {
        // 8 chars + uppercase + lowercase + number (no special)
        // 25 + 20 + 20 + 20 = 85
        const result = validatePassword('Password123');
        expect(result.strength).toBe('good');
    });
});
