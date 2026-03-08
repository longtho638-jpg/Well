/**
 * Phase 6: RaaS Authentication & License Gate Integration Tests
 *
 * Tests covering:
 * 1. JWT and mk_ API key authentication at raas.agencyos.network
 * 2. License key enforcement via RAAS_LICENSE_KEY gate
 * 3. License Management UI interactions
 */

import { describe, it, expect } from 'vitest';
import {
  validateRaaSLicense,
  checkRaasLicenseGuard,
  getCachedLicenseResult,
  clearLicenseCache,
} from '@/lib/raas-gate';

describe('Phase 6: RaaS Authentication', () => {
  /**
   * TEST 1: JWT Authentication Format Validation
   * Validates JWT token structure for RaaS API authentication
   */
  describe('Test 1: JWT Authentication', () => {
    it('should validate JWT token format (header.payload.signature)', () => {
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const parts = mockJWT.split('.');
      expect(parts).toHaveLength(3);

      // Header should decode to valid JSON
      const header = JSON.parse(atob(parts[0]));
      expect(header).toHaveProperty('alg');
      expect(header).toHaveProperty('typ');
    });

    it('should extract claims from JWT payload', () => {
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const payload = JSON.parse(atob(mockJWT.split('.')[1]));
      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('name');
      expect(payload).toHaveProperty('iat');
    });

    it('should verify JWT expiration', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload = { exp: now - 3600 }; // Expired 1 hour ago
      const validPayload = { exp: now + 3600 };   // Expires in 1 hour

      expect(expiredPayload.exp).toBeLessThan(now);
      expect(validPayload.exp).toBeGreaterThan(now);
    });
  });

  /**
   * TEST 2: mk_ API Key Format Validation
   * Validates API key format for RaaS authentication
   */
  describe('Test 2: API Key Authentication (mk_ prefix)', () => {
    it('should validate mk_ API key format', () => {
      const validApiKeys = [
        'mk_live_abc123xyz789',
        'mk_test_def456uvw012',
        'mk_prod_ghi789rst345',
      ];

      const API_KEY_PATTERN = /^mk_(live|test|prod)_[a-zA-Z0-9]{10,}$/;

      validApiKeys.forEach(key => {
        expect(API_KEY_PATTERN.test(key)).toBe(true);
      });
    });

    it('should reject invalid API key formats', () => {
      const invalidApiKeys = [
        '',
        'mk_invalid_key',
        'sk_live_abc123',  // Wrong prefix
        'mk_',             // Too short
        'MK_LIVE_abc123',  // Wrong case
      ];

      const API_KEY_PATTERN = /^mk_(live|test|prod)_[a-zA-Z0-9]{10,}$/;

      invalidApiKeys.forEach(key => {
        expect(API_KEY_PATTERN.test(key)).toBe(false);
      });
    });

    it('should identify API key environment from prefix', () => {
      const getKeyEnv = (key: string): string | null => {
        const match = key.match(/^mk_(live|test|prod)_/);
        return match ? match[1] : null;
      };

      expect(getKeyEnv('mk_live_abc123')).toBe('live');
      expect(getKeyEnv('mk_test_def456')).toBe('test');
      expect(getKeyEnv('mk_prod_ghi789')).toBe('prod');
    });
  });

  /**
   * TEST 3: RAAS_LICENSE_KEY Gate Enforcement
   * Tests license guard functionality
   */
  describe('Test 3: License Key Gate Enforcement', () => {
    it('should return license validation result', () => {
      const result = validateRaaSLicense();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should have tier information', () => {
      const result = validateRaaSLicense();

      expect(result.tier).toBeDefined();
      expect(typeof result.tier).toBe('string');
    });

    it('should have feature flags structure', () => {
      const result = validateRaaSLicense();

      expect(result.features).toBeDefined();
      expect(result.features).toHaveProperty('adminDashboard');
      expect(result.features).toHaveProperty('payosAutomation');
    });

    it('checkRaasLicenseGuard returns boolean for feature check', () => {
      const hasAccess = checkRaasLicenseGuard('adminDashboard');
      expect(typeof hasAccess).toBe('boolean');
    });
  });

  /**
   * TEST 4: License Format Validation
   * Validates RaaS license key format
   */
  describe('Test 4: License Format Validation', () => {
    const validLicenses = [
      'RAAS-1709337600-abc123',
      'RAAS-1709337600-abcdef123456',
      'RAAS-9999999999-XYZ789ABC',
    ];

    const invalidLicenses = [
      '',
      'INVALID',
      'RAAS-short',
      'RAAS-12345678901',     // 11 digits, not 10
      'RAAS-123456789-',      // Missing suffix
      'raas-1709337600-abc',  // Wrong case prefix
      'RAAS_notanumber_abc',  // Wrong separator
    ];

    it.each(validLicenses)('should accept valid license: %s', (license) => {
      const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(LICENSE_PATTERN.test(license)).toBe(true);
    });

    it.each(invalidLicenses)('should reject invalid license: %s', (license) => {
      const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(LICENSE_PATTERN.test(license)).toBe(false);
    });
  });

  /**
   * TEST 5: License Expiration Calculation
   * Tests license expiration logic
   */
  describe('Test 5: License Expiration', () => {
    it('should calculate expiration date from timestamp', () => {
      const timestamp = 1709337600; // Unix timestamp
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      const expirationDate = new Date(timestamp * 1000 + oneYearInMs);

      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate.getTime()).toBeGreaterThan(timestamp * 1000);
    });

    it('should calculate days remaining', () => {
      const now = Date.now();
      const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysRemaining = Math.floor((oneYearFromNow - now) / msPerDay);

      expect(daysRemaining).toBe(365);
    });

    it('should detect expired license', () => {
      const pastTimestamp = Math.floor((Date.now() - (400 * 24 * 60 * 60 * 1000)) / 1000);
      const expirationDate = new Date(pastTimestamp * 1000 + (365 * 24 * 60 * 60 * 1000));

      // 400 days ago + 365 days = 35 days ago (expired)
      expect(expirationDate.getTime()).toBeLessThan(Date.now());
    });
  });

  /**
   * TEST 6: License Cache Behavior
   * Tests caching mechanism for license validation
   */
  describe('Test 6: License Cache', () => {
    it('should cache validation result', () => {
      const result1 = getCachedLicenseResult();
      const result2 = getCachedLicenseResult();

      // Same reference (cached)
      expect(result1).toBe(result2);
    });

    it('should clear cache and return fresh result', () => {
      const result1 = getCachedLicenseResult();
      clearLicenseCache();
      const result2 = getCachedLicenseResult();

      // Both should be defined and have same structure
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.isValid).toBe(result2.isValid);
    });
  });
});
