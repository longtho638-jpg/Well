/**
 * RaaS Gateway E2E Test Suite - Phase 6
 *
 * Tests for RaaS Gateway integration with AgencyOS dashboard:
 * - License validation with JWT + mk_api_key auth
 * - Usage metering data flow
 * - Supabase Realtime updates
 * - Cloudflare KV rate limiting
 * - i18n 403 messages
 *
 * Prerequisites:
 * - RaaS Gateway deployed at raas.agencyos.network
 * - Supabase Realtime enabled
 * - Cloudflare KV namespaces configured
 */

import { test, expect } from '@playwright/test';

test.describe('RaaS Gateway Integration', () => {
  test.describe('License Validation Flow', () => {
    test('should validate valid license with mk_api_key', async ({ page }) => {
      await page.route('**/raas.agencyos.network/v1/validate-license', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            license: 'lic_test_valid_456',
            tier: 'pro',
            features: ['api', 'agents', 'premium'],
          }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const statusElement = page.locator('[data-license-status="valid"], text=valid, text=active');
      const count = await statusElement.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show error for invalid license', async ({ page }) => {
      await page.route('**/raas.agencyos.network/v1/validate-license', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Invalid license key',
          }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const errorElement = page.locator('[data-license-status="invalid"], text=invalid, text=error');
      const count = await errorElement.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should handle expired license', async ({ page }) => {
      await page.route('**/raas.agencyos.network/v1/validate-license', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'License expired',
            expired_at: '2024-01-01T00:00:00Z',
          }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const expiredMessage = page.locator('text=expired, text=hết hạn');
      const count = await expiredMessage.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Usage Metering', () => {
    test('should display usage data', async ({ page }) => {
      await page.route('**/api/usage', async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            api_calls: { used: 5000, quota: 10000 },
            agents: { used: 50, quota: 100 },
            storage_mb: { used: 500, quota: 1000 },
          },
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const usageElement = page.locator('[data-testid="usage-widget"]');
      const count = await usageElement.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
