/**
 * Phase 7: Advanced E2E Testing Suite for RaaS Gateway
 *
 * Comprehensive tests for:
 * - JWT + mk_api_key authentication flow
 * - KV-based rate limiting validation
 * - License key validation (RAAS_LICENSE_KEY gate)
 * - Usage metering ingestion to Supabase
 * - Stripe/Polar webhook delivery
 * - Live gateway testing at raas.agencyos.network
 *
 * Run: npx playwright test e2e/raas-advanced.spec.ts
 */

import { test, expect } from '@playwright/test';

const GATEWAY_URL = process.env.RAAS_GATEWAY_URL || 'https://raas.agencyos.network';
const _DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';
const TEST_MK_API_KEY = process.env.TEST_MK_API_KEY || 'mk_test_key_123';
const TEST_LICENSE_KEY = process.env.TEST_LICENSE_KEY || 'lic_test_valid_456';
const TEST_JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

test.describe('Phase 7: Authentication Flow', () => {
  test.describe('JWT Authentication', () => {
    test('should authenticate with valid JWT token', async ({ request }) => {
      const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
          'X-API-Key': TEST_MK_API_KEY,
        },
        data: {
          license_key: TEST_LICENSE_KEY,
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(400);
    });

    test('should reject invalid JWT token', async ({ request }) => {
      const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token',
          'X-API-Key': TEST_MK_API_KEY,
        },
        data: {
          license_key: TEST_LICENSE_KEY,
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should reject missing API key', async ({ request }) => {
      const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        },
        data: {
          license_key: TEST_LICENSE_KEY,
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('License Key Validation', () => {
    test('should accept valid license key', async ({ request }) => {
      const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
          'X-API-Key': TEST_MK_API_KEY,
        },
        data: {
          license_key: TEST_LICENSE_KEY,
        },
      });

      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body.valid).toBe(true);
    });

    test('should reject invalid license key', async ({ request }) => {
      const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
          'X-API-Key': TEST_MK_API_KEY,
        },
        data: {
          license_key: 'invalid_license_key',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});

test.describe('Rate Limiting', () => {
  test('should enforce rate limits', async ({ request }) => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post(`${GATEWAY_URL}/v1/validate-license`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
            'X-API-Key': TEST_MK_API_KEY,
          },
          data: {
            license_key: TEST_LICENSE_KEY,
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status());

    expect(statusCodes.some(code => code >= 429)).toBe(true);
  });
});

test.describe('Usage Metering', () => {
  test('should record API call usage', async ({ request }) => {
    const response = await request.post(`${GATEWAY_URL}/v1/usage/record`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'X-API-Key': TEST_MK_API_KEY,
      },
      data: {
        event_type: 'api_call',
        resource: '/v1/validate-license',
        timestamp: new Date().toISOString(),
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });
});
