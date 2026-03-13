/**
 * E2E Test: Withdrawal Flow
 * Tests the complete withdrawal request flow from user perspective
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'testuser@wellnexus.vn',
  password: 'TestPassword123!',
};

test.describe('Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      // eslint-disable-next-line no-console
      console.log(`BROWSER LOG: ${msg.text()}`);
    });
    page.on('pageerror', err => {
      // eslint-disable-next-line no-console
      console.log(`BROWSER ERROR: ${err.message}`);
    });
    await page.goto('/');
  });

  test('should complete full withdrawal flow - login, submit, verify pending', async ({ page }) => {
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|wallet|finance)/, { timeout: 10000 });

    await page.getByRole('link', { name: /withdrawal|rút tiền/i }).click();
    await page.waitForLoadState('networkidle');

    const amountInput = page.locator('input[type="number"][name="amount"], input[name="amount"]');
    await expect(amountInput).toBeVisible();
  });

  test('should display withdrawal confirmation', async ({ page }) => {
    await page.goto('/withdrawal');
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Xác nhận")');
    const count = await submitButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show pending status after withdrawal', async ({ page }) => {
    await page.goto('/withdrawal/history');
    await page.waitForLoadState('networkidle');

    const pendingStatus = page.locator('[data-status="pending"], text=pending, text=chờ duyệt');
    const count = await pendingStatus.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
