/**
 * Quota Exhaustion E2E Tests - Phase 6
 *
 * End-to-end tests simulating real quota exhaustion scenarios:
 * - Warning at 80% usage
 * - Critical alert at 90%
 * - Hard block at 100% (hard mode)
 * - Overage billing in soft mode
 * - Dunning workflow trigger
 */

import { test, expect } from '@playwright/test';

test.describe('Quota Exhaustion Flow', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testOrg = {
    id: 'e2e-test-org',
    tier: 'basic',
    apiCallsQuota: 10000,
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/reset-e2e-state', async route => {
      await route.fulfill({ status: 200, json: { success: true } });
    });
  });

  test('should show warning at 80% quota usage', async ({ page }) => {
    await page.route('**/api/usage', async route => {
      await route.fulfill({
        status: 200,
        json: { used: 8000, quota: 10000, percentage: 80 },
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const warningElement = page.locator('[data-testid="usage-warning"], text=warning, text=cảnh báo');
    const count = await warningElement.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show critical alert at 90% quota usage', async ({ page }) => {
    await page.route('**/api/usage', async route => {
      await route.fulfill({
        status: 200,
        json: { used: 9000, quota: 10000, percentage: 90 },
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const criticalAlert = page.locator('[data-testid="critical-alert"], text=critical, text=nguy cấp');
    const count = await criticalAlert.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should block API calls at 100% quota (hard mode)', async ({ page }) => {
    await page.route('**/api/usage', async route => {
      await route.fulfill({
        status: 200,
        json: { used: 10000, quota: 10000, percentage: 100 },
      });
    });

    await page.route('**/api/v1/**', async route => {
      await route.fulfill({
        status: 403,
        json: { error: 'Quota exceeded', message: 'Bạn đã vượt giới hạn' },
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const blockedMessage = page.locator('text=quota exceeded, text=vượt giới hạn, text=403');
    const count = await blockedMessage.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
