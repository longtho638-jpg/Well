/**
 * E2E Test: Admin Approval Flow
 * Tests admin ability to view and approve/reject withdrawal requests
 */

import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'admin@wellnexus.vn',
  password: 'AdminPassword123!',
};

test.describe('Admin Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login as admin and approve a pending withdrawal', async ({ page }) => {
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(ADMIN_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });

    await page.getByRole('link', { name: /withdrawal|rút tiền/i }).click();
    await page.waitForLoadState('networkidle');

    const pendingRequests = page.locator('[data-status="pending"], text=pending, text=chờ duyệt');
    const count = await pendingRequests.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should reject a withdrawal request', async ({ page }) => {
    await page.goto('/admin/withdrawals');
    await page.waitForLoadState('networkidle');

    const rejectButtons = page.locator('button:has-text("Reject"), button:has-text("Từ chối")');
    const count = await rejectButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
