/**
 * RaaS License Guard Tests
 *
 * Simple unit tests for license validation logic.
 */

import { describe, it, expect } from 'vitest';
import { validateLicenseFormat, isLicenseExpired, getDaysRemaining } from '../raas-gate-utils';

describe('RaaS License Utils', () => {
  describe('validateLicenseFormat', () => {
    it('should accept valid license format', () => {
      expect(validateLicenseFormat('RAAS-1709337600-abc123')).toBe(true);
      expect(validateLicenseFormat('RAAS-1709337600-abcdef123456')).toBe(true);
      expect(validateLicenseFormat('RAAS-1709337600-ABC123DEF456')).toBe(true);
    });

    it('should reject invalid license format', () => {
      expect(validateLicenseFormat('')).toBe(false);
      expect(validateLicenseFormat('INVALID')).toBe(false);
      expect(validateLicenseFormat('RAAS-short')).toBe(false);
      expect(validateLicenseFormat('RAAS-123456789-')).toBe(false);
      expect(validateLicenseFormat('RAAS-notanumber-abc123')).toBe(false);
      expect(validateLicenseFormat('raas-1709337600-abc123')).toBe(false);
      expect(validateLicenseFormat('RAAS_1709337600_abc123')).toBe(false);
    });
  });

  describe('isLicenseExpired', () => {
    it('should return false for recent timestamp', () => {
      const recentTimestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      expect(isLicenseExpired(recentTimestamp)).toBe(false);
    });

    it('should return true for old timestamp', () => {
      const oldTimestamp = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000); // 2 years ago
      expect(isLicenseExpired(oldTimestamp)).toBe(true);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return positive days for valid license', () => {
      const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
      const days = getDaysRemaining(sixMonthsAgo);
      expect(days).toBeGreaterThan(180);
      expect(days).toBeLessThan(190);
    });

    it('should return negative days for expired license', () => {
      const oldTimestamp = Date.now() - (400 * 24 * 60 * 60 * 1000);
      const days = getDaysRemaining(oldTimestamp);
      expect(days).toBeLessThan(-30);
    });
  });
});
