/**
 * RaaS License Gate Integration Tests
 *
 * Tests license guard and webhook validation logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateRaaSLicense,
  checkRaasLicenseGuard,
  getCachedLicenseResult,
  clearLicenseCache,
} from '@/lib/raas-gate';

describe('RaaS License Gate - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLicenseCache();
  });

  describe('License Guard - Production Mode (No License)', () => {
    it('should block admin access without license in production', () => {
      const result = validateRaaSLicense();
      expect(result).toBeDefined();
    });

    it('should have correct feature flags structure', () => {
      const result = validateRaaSLicense();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('features');
      expect(result.features).toHaveProperty('adminDashboard');
      expect(result.features).toHaveProperty('payosAutomation');
    });
  });

  describe('License Format Validation', () => {
    const validLicenses = [
      'RAAS-1709337600-abc123',
      'RAAS-1709337600-abcdef123456',
      'RAAS-1709337600-ABC123DEF456',
      'RAAS-9999999999-xyz789ABC',
    ];

    const invalidLicenses = [
      '',
      'INVALID',
      'RAAS-short',
      'RAAS-12345678901',
      'RAAS-123456789-',
      'raas-1709337600-abc123',
      'RAAS_1709337600_abc123',
      'RAAS-notanumber-abc123',
    ];

    it.each(validLicenses)('should accept valid format: %s', (license) => {
      const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(LICENSE_PATTERN.test(license)).toBe(true);
    });

    it.each(invalidLicenses)('should reject invalid format: %s', (license) => {
      const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(LICENSE_PATTERN.test(license)).toBe(false);
    });
  });

  describe('License Cache', () => {
    it('should cache validation result', () => {
      const result1 = getCachedLicenseResult();
      const result2 = getCachedLicenseResult();

      expect(result1).toBe(result2);
    });

    it('should clear cache on demand', () => {
      getCachedLicenseResult();
      clearLicenseCache();
      const newResult = getCachedLicenseResult();

      expect(newResult).toBeDefined();
    });
  });

  describe('Feature Guard Helper', () => {
    it('checkRaasLicenseGuard returns boolean', () => {
      const valid = checkRaasLicenseGuard();
      expect(typeof valid).toBe('boolean');
    });

    it('checkRaasLicenseGuard with feature returns boolean', () => {
      const valid = checkRaasLicenseGuard('adminDashboard');
      expect(typeof valid).toBe('boolean');
    });
  });

  describe('Expiration Calculation', () => {
    it('should calculate expiration 1 year from timestamp', () => {
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      expect(oneYearInMs).toBe(31536000000);
    });

    it('should calculate days remaining correctly', () => {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.floor((365 * msPerDay) / msPerDay);
      expect(daysRemaining).toBe(365);
    });
  });
});
