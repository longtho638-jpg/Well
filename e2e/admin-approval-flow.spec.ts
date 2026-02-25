import { test, expect } from '@playwright/test';

/**
 * E2E Test: Admin Approval Flow
 * Tests admin ability to view and approve/reject withdrawal requests
 */

// Admin user credentials (should match your test environment)
const ADMIN_USER = {
  email: 'admin@wellnexus.vn',
  password: 'AdminPassword123!',
};

test.describe('Admin Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
  });

  test('should login as admin and approve a pending withdrawal', async ({ page }) => {
    // Step 1: Admin login
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(ADMIN_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Wait for redirect - admin should go to admin panel
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });

    // Step 2: Navigate to Admin Withdrawals page
    // Try both possible navigation patterns
    const withdrawalsLink = page.getByRole('link', { 
      name: /quản lý rút tiền|withdrawal.*management|withdrawals/i 
    });
    
    if (await withdrawalsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await withdrawalsLink.click();
    } else {
      // Alternative: navigate directly via URL
      await page.goto('/admin/withdrawals');
    }

    await expect(page).toHaveURL(/\/admin\/withdrawals/, { timeout: 5000 });

    // Step 3: Verify pending requests are visible
    const pendingStatus = page.getByText(/đang chờ|pending/i).first();
    await expect(pendingStatus).toBeVisible({ timeout: 5000 });

    // Step 4: Click on first pending withdrawal row to view details
    const firstPendingRow = page.locator('tr').filter({ 
      hasText: /đang chờ|pending/i 
    }).first();
    await firstPendingRow.click();

    // Step 5: Click Approve button
    const approveButton = page.getByRole('button', { 
      name: /phê duyệt|approve/i 
    });
    await expect(approveButton).toBeVisible({ timeout: 3000 });
    await approveButton.click();

    // Step 6: Confirm approval in modal (if exists)
    const confirmButton = page.getByRole('button', { 
      name: /xác nhận|confirm/i 
    });
    
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Step 7: Verify success toast notification
    await expect(page.getByText(/phê duyệt thành công|approved successfully/i)).toBeVisible({ 
      timeout: 5000 
    });

    // Step 8: Verify status changed to "Approved" in the list
    await expect(page.getByText(/đã duyệt|approved/i)).toBeVisible({ timeout: 5000 });
  });

  test('should reject a pending withdrawal with reason', async ({ page }) => {
    // Step 1: Admin login
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(ADMIN_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });

    // Step 2: Navigate to withdrawals
    const withdrawalsLink = page.getByRole('link', { 
      name: /quản lý rút tiền|withdrawal.*management|withdrawals/i 
    });
    
    if (await withdrawalsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await withdrawalsLink.click();
    } else {
      await page.goto('/admin/withdrawals');
    }

    await expect(page).toHaveURL(/\/admin\/withdrawals/, { timeout: 5000 });

    // Step 3: Click on first pending withdrawal
    const firstPendingRow = page.locator('tr').filter({ 
      hasText: /đang chờ|pending/i 
    }).first();
    await firstPendingRow.click();

    // Step 4: Click Reject button
    const rejectButton = page.getByRole('button', { 
      name: /từ chối|reject/i 
    });
    await expect(rejectButton).toBeVisible({ timeout: 3000 });
    await rejectButton.click();

    // Step 5: Fill rejection reason (if modal appears)
    const reasonInput = page.getByLabel(/lý do|reason/i);
    if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reasonInput.fill('Thông tin tài khoản không hợp lệ');
    }

    // Step 6: Confirm rejection
    const confirmButton = page.getByRole('button', { 
      name: /xác nhận|confirm/i 
    });
    
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Step 7: Verify success toast
    await expect(page.getByText(/từ chối thành công|rejected successfully/i)).toBeVisible({ 
      timeout: 5000 
    });

    // Step 8: Verify status changed to "Rejected"
    await expect(page.getByText(/đã từ chối|rejected/i)).toBeVisible({ timeout: 5000 });
  });

  test('should filter withdrawals by status', async ({ page }) => {
    // Login as admin
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(ADMIN_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });

    // Navigate to withdrawals
    const withdrawalsLink = page.getByRole('link', { 
      name: /quản lý rút tiền|withdrawal.*management|withdrawals/i 
    });
    
    if (await withdrawalsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await withdrawalsLink.click();
    } else {
      await page.goto('/admin/withdrawals');
    }

    // Test filter for "Pending" status
    const statusFilter = page.getByLabel(/trạng thái|status/i);
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.click();
      await page.getByRole('option', { name: /đang chờ|pending/i }).click();

      // Verify only pending withdrawals are shown
      const allRows = page.locator('tbody tr');
      const rowCount = await allRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = allRows.nth(i);
        await expect(row.getByText(/đang chờ|pending/i)).toBeVisible();
      }
    }
  });

  test('should export withdrawal data as CSV', async ({ page }) => {
    // Login as admin
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(ADMIN_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });

    // Navigate to withdrawals
    const withdrawalsLink = page.getByRole('link', { 
      name: /quản lý rút tiền|withdrawal.*management|withdrawals/i 
    });
    
    if (await withdrawalsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await withdrawalsLink.click();
    } else {
      await page.goto('/admin/withdrawals');
    }

    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export CSV button
    const exportButton = page.getByRole('button', { 
      name: /xuất csv|export.*csv|download/i 
    });
    await expect(exportButton).toBeVisible({ timeout: 3000 });
    await exportButton.click();

    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename contains expected pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/withdrawals.*\.csv/i);

    // Verify success toast
    await expect(page.getByText(/xuất thành công|export.*success/i)).toBeVisible({ 
      timeout: 3000 
    });
  });

  test('should display withdrawal details in modal', async ({ page }) => {
    // Login as admin
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(ADMIN_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });

    // Navigate to withdrawals
    const withdrawalsLink = page.getByRole('link', { 
      name: /quản lý rút tiền|withdrawal.*management|withdrawals/i 
    });
    
    if (await withdrawalsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await withdrawalsLink.click();
    } else {
      await page.goto('/admin/withdrawals');
    }

    // Click on first withdrawal row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Verify details modal appears with key information
    await expect(page.getByText(/thông tin chi tiết|details/i)).toBeVisible({ timeout: 3000 });
    
    // Verify required fields are displayed
    await expect(page.getByText(/số tiền|amount/i)).toBeVisible();
    await expect(page.getByText(/ngân hàng|bank/i)).toBeVisible();
    await expect(page.getByText(/số tài khoản|account number/i)).toBeVisible();
    await expect(page.getByText(/tên tài khoản|account name/i)).toBeVisible();
  });
});
