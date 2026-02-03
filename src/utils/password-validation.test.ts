import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  getStrengthColor,
  getStrengthLabel,
} from './password-validation';

describe('password-validation', () => {
  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = validatePassword('Test123!@#');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('test123!@#');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('good');
      expect(result.errors).toContain('auth.password.requirements.uppercase');
      expect(result.score).toBe(80);
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('TEST123!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('auth.password.requirements.lowercase');
      expect(result.score).toBe(80);
    });

    it('should reject password without numbers', () => {
      const result = validatePassword('TestAbc!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('auth.password.requirements.number');
      expect(result.score).toBe(80);
    });

    it('should reject password without special characters', () => {
      const result = validatePassword('TestAbc123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('auth.password.requirements.special');
      expect(result.score).toBe(85);
    });

    it('should reject password too short', () => {
      const result = validatePassword('Tst12!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('auth.password.requirements.length');
      expect(result.score).toBe(75);
    });

    it('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors).toHaveLength(5);
      expect(result.score).toBe(0);
    });
  });

  describe('getStrengthColor', () => {
    it('should return correct colors for all strengths', () => {
      expect(getStrengthColor('weak')).toBe('bg-rose-500');
      expect(getStrengthColor('fair')).toBe('bg-amber-500');
      expect(getStrengthColor('good')).toBe('bg-blue-500');
      expect(getStrengthColor('strong')).toBe('bg-emerald-500');
      expect(getStrengthColor('invalid')).toBe('bg-slate-700');
    });
  });

  describe('getStrengthLabel', () => {
    it('should return correct labels for all strengths', () => {
      expect(getStrengthLabel('weak')).toBe('Weak');
      expect(getStrengthLabel('fair')).toBe('Fair');
      expect(getStrengthLabel('good')).toBe('Good');
      expect(getStrengthLabel('strong')).toBe('Strong');
      expect(getStrengthLabel('invalid')).toBe('');
    });
  });
});
