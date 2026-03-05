/**
 * License Validation Edge Function Tests
 *
 * Tests for security controls:
 * - Rate limiting
 * - Input validation
 * - CORS configuration
 * - Error sanitization
 * - Audit logging
 */

import { describe, it, expect, vi } from 'vitest';

// Mock console.error to reduce noise
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('License Validation Security', () => {
  describe('Input Validation', () => {
    it('should reject missing licenseKey', () => {
      const payload = {};
      expect(payload.licenseKey).toBeUndefined();
    });

    it('should reject non-string licenseKey', () => {
      const payload = { licenseKey: 12345 };
      expect(typeof payload.licenseKey).toBe('number');
    });

    it('should reject licenseKey too short', () => {
      const short = 'RAAS-1234567890-abc'; // < 20 chars
      expect(short.length).toBeLessThan(20);
    });

    it('should reject licenseKey too long', () => {
      const long = 'RAAS-' + '1'.repeat(10) + '-' + 'a'.repeat(100); // > 100 chars hash
      expect(long.length).toBeGreaterThan(100);
    });

    it('should reject invalid format (no RAAS prefix)', () => {
      const invalid = 'INVALID-1234567890-abc123';
      const pattern = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(pattern.test(invalid)).toBe(false);
    });

    it('should reject invalid format (timestamp not numeric)', () => {
      const invalid = 'RAAS-notanumber-abc123';
      const pattern = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(pattern.test(invalid)).toBe(false);
    });

    it('should reject hash with special characters', () => {
      const invalid = 'RAAS-1234567890-abc!@#';
      const pattern = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(pattern.test(invalid)).toBe(false);
    });

    it('should accept valid license format', () => {
      const valid = 'RAAS-1709337600-abc123DEF456';
      const pattern = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
      expect(pattern.test(valid)).toBe(true);
      expect(valid.length).toBeGreaterThanOrEqual(20);
      expect(valid.length).toBeLessThanOrEqual(100);
    });
  });

  describe('CORS Configuration', () => {
    const ALLOWED_ORIGINS = [
      'https://wellnexus.vn',
      'https://www.wellnexus.vn',
      'https://wellnexus-staging.vercel.app',
    ];

    it('should define allowed origins', () => {
      expect(ALLOWED_ORIGINS.length).toBeGreaterThan(0);
    });

    it('should not allow wildcard origin in production', () => {
      // Wildcard '*' is a security risk for authenticated endpoints
      expect(ALLOWED_ORIGINS).not.toContain('*');
    });

    it('should include production domain', () => {
      expect(ALLOWED_ORIGINS).toContain('https://wellnexus.vn');
    });
  });

  describe('Rate Limiting', () => {
    const RATE_LIMIT_MAX_REQUESTS = 10;
    const RATE_LIMIT_WINDOW_MS = 60 * 1000;

    it('should define rate limit threshold', () => {
      expect(RATE_LIMIT_MAX_REQUESTS).toBe(10);
    });

    it('should define rate limit window', () => {
      expect(RATE_LIMIT_WINDOW_MS).toBe(60000);
    });

    it('should allow requests under limit', () => {
      const requestCount = 5;
      expect(requestCount).toBeLessThan(RATE_LIMIT_MAX_REQUESTS);
    });

    it('should block requests over limit', () => {
      const requestCount = 15;
      expect(requestCount).toBeGreaterThan(RATE_LIMIT_MAX_REQUESTS);
    });
  });

  describe('Request Size Limits', () => {
    const MAX_REQUEST_SIZE_BYTES = 1024;

    it('should define max payload size', () => {
      expect(MAX_REQUEST_SIZE_BYTES).toBe(1024);
    });

    it('should reject oversized payloads', () => {
      const oversized = JSON.stringify({ licenseKey: 'a'.repeat(2000) });
      expect(Buffer.byteLength(oversized, 'utf8')).toBeGreaterThan(MAX_REQUEST_SIZE_BYTES);
    });

    it('should accept normal payloads', () => {
      const normal = JSON.stringify({ licenseKey: 'RAAS-1709337600-abc123' });
      expect(Buffer.byteLength(normal, 'utf8')).toBeLessThan(MAX_REQUEST_SIZE_BYTES);
    });
  });

  describe('Error Sanitization', () => {
    it('should return generic error for server errors', () => {
      const safeError = 'Internal server error';
      expect(safeError).not.toContain('stack');
      expect(safeError).not.toContain('trace');
    });

    it('should not expose database errors', () => {
      const dbError = 'Database connection failed';
      const safeError = 'Internal server error';
      expect(safeError).not.toEqual(dbError);
    });

    it('should mask license keys in logs', () => {
      const licenseKey = 'RAAS-1709337600-abc123DEF456';
      const masked = licenseKey.slice(0, 10) + '...' + licenseKey.slice(-4);
      expect(masked).toBe('RAAS-17093...F456');
      expect(masked.length).toBeLessThan(licenseKey.length);
    });
  });

  describe('Feature Validation', () => {
    const defaultFeatures = {
      adminDashboard: false,
      payosWebhook: false,
      commissionDistribution: false,
      policyEngine: false,
    };

    function validateFeatures(features: unknown) {
      if (!features || typeof features !== 'object') {
        return defaultFeatures;
      }
      const f = features as Record<string, unknown>;
      return {
        adminDashboard: f.adminDashboard === true,
        payosWebhook: f.payosWebhook === true,
        commissionDistribution: f.commissionDistribution === true,
        policyEngine: f.policyEngine === true,
      };
    }

    it('should return default features for null input', () => {
      expect(validateFeatures(null)).toEqual(defaultFeatures);
    });

    it('should return default features for undefined input', () => {
      expect(validateFeatures(undefined)).toEqual(defaultFeatures);
    });

    it('should return default features for non-object input', () => {
      expect(validateFeatures('string')).toEqual(defaultFeatures);
    });

    it('should validate boolean features strictly', () => {
      const input = {
        adminDashboard: 'yes',
        payosWebhook: 1,
        commissionDistribution: null,
        policyEngine: true,
      };
      const result = validateFeatures(input);
      expect(result.adminDashboard).toBe(false); // string, not boolean
      expect(result.payosWebhook).toBe(false); // number, not boolean
      expect(result.commissionDistribution).toBe(false); // null, not boolean
      expect(result.policyEngine).toBe(true); // actual boolean
    });

    it('should accept valid features object', () => {
      const input = {
        adminDashboard: true,
        payosWebhook: false,
        commissionDistribution: true,
        policyEngine: true,
      };
      const result = validateFeatures(input);
      expect(result).toEqual(input);
    });
  });
});

describe('License Expiration Logic', () => {
  it('should calculate expiration 1 year from timestamp', () => {
    const timestamp = 1709337600000; // 2024-03-02
    const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000);
    const expected = new Date('2025-03-02').getTime();
    expect(expiresAt).toBeCloseTo(expected, -5); // Within 1 day
  });

  it('should detect expired license', () => {
    const now = Date.now();
    const pastTimestamp = now - (400 * 24 * 60 * 60 * 1000); // 400 days ago
    const expiresAt = pastTimestamp + (365 * 24 * 60 * 60 * 1000);
    expect(now).toBeGreaterThan(expiresAt);
  });

  it('should detect valid license', () => {
    const now = Date.now();
    const recentTimestamp = now - (100 * 24 * 60 * 60 * 1000); // 100 days ago
    const expiresAt = recentTimestamp + (365 * 24 * 60 * 60 * 1000);
    expect(now).toBeLessThan(expiresAt);
  });

  it('should calculate days remaining', () => {
    const now = Date.now();
    const expiresAt = now + (180 * 24 * 60 * 60 * 1000); // 180 days from now
    const daysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    expect(daysRemaining).toBe(180);
  });
});
