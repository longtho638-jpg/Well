import { test, expect } from '@playwright/test';

/**
 * E2E Test: Withdrawal Flow
 * Tests the complete withdrawal request flow from user perspective
 */

// Test user credentials (should match your test environment)
const TEST_USER = {
  email: 'testuser@wellnexus.vn',
  password: 'TestPassword123!',
};

test.describe('Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // Navigate to app
    await page.goto('/');
  });

  test('should complete full withdrawal flow - login, submit, verify pending', async ({ page }) => {
    // Step 1: Login
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 2: Navigate to Withdrawal page
    await page.getByRole('button', { name: /rút tiền|withdrawal/i }).click();
    await expect(page).toHaveURL(/\/withdrawals?/, { timeout: 5000 });

    // Step 3: Fill withdrawal form
    const withdrawalAmount = 500000; // 500k VND
    await page.getByLabel(/số tiền|amount/i).fill(withdrawalAmount.toString());
    
    // Select bank from dropdown
    await page.getByLabel(/ngân hàng|bank/i).click();
    await page.getByRole('option', { name: /vietcombank|vcb/i }).first().click();

    // Fill bank account details
    await page.getByLabel(/số tài khoản|account number/i).fill('1234567890');
    await page.getByLabel(/tên tài khoản|account name/i).fill('NGUYEN VAN TEST');

    // Add optional note
    await page.getByLabel(/ghi chú|note/i).fill('Test withdrawal request');

    // Step 4: Submit withdrawal request
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Step 5: Verify success toast
    await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 5000 });

    // Step 6: Verify pending status appears in withdrawal history
    await expect(page.getByText(/đang chờ|pending/i)).toBeVisible({ timeout: 5000 });

    // Step 7: Verify withdrawal appears in list with correct amount
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(withdrawalAmount);
    await expect(page.getByText(formattedAmount)).toBeVisible();
  });

  test('should show validation error for amount below minimum (100k VND)', async ({ page }) => {
    // Login first
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to withdrawal page
    await page.getByRole('button', { name: /rút tiền|withdrawal/i }).click();

    // Try to submit with amount below minimum
    await page.getByLabel(/số tiền|amount/i).fill('50000'); // Below 100k minimum

    // Select bank
    await page.getByLabel(/ngân hàng|bank/i).click();
    await page.getByRole('option', { name: /vietcombank|vcb/i }).first().click();

    // Fill required fields
    await page.getByLabel(/số tài khoản|account number/i).fill('1234567890');
    await page.getByLabel(/tên tài khoản|account name/i).fill('NGUYEN VAN TEST');

    // Submit
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Verify validation error message
    await expect(page.getByText(/tối thiểu|minimum.*100,000/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show validation error when bank is not selected', async ({ page }) => {
    // Login
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to withdrawal
    await page.getByRole('button', { name: /rút tiền|withdrawal/i }).click();

    // Fill amount only (skip bank selection)
    await page.getByLabel(/số tiền|amount/i).fill('200000');
    await page.getByLabel(/số tài khoản|account number/i).fill('1234567890');
    await page.getByLabel(/tên tài khoản|account name/i).fill('NGUYEN VAN TEST');

    // Submit without bank
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Verify bank required error
    await expect(page.getByText(/vui lòng chọn ngân hàng|please select.*bank/i)).toBeVisible({ 
      timeout: 3000 
    });
  });

  test('should show validation error when account number is missing', async ({ page }) => {
    // Login
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to withdrawal
    await page.getByRole('button', { name: /rút tiền|withdrawal/i }).click();

    // Fill amount and bank, skip account number
    await page.getByLabel(/số tiền|amount/i).fill('200000');
    await page.getByLabel(/ngân hàng|bank/i).click();
    await page.getByRole('option', { name: /vietcombank|vcb/i }).first().click();
    await page.getByLabel(/tên tài khoản|account name/i).fill('NGUYEN VAN TEST');

    // Submit
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Verify account number required error
    await expect(page.getByText(/số tài khoản.*bắt buộc|account number.*required/i)).toBeVisible({ 
      timeout: 3000 
    });
  });

  test('should prevent withdrawal when insufficient balance', async ({ page }) => {
    // Login
    await page.getByRole('link', { name: /đăng nhập|login/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to withdrawal
    await page.getByRole('button', { name: /rút tiền|withdrawal/i }).click();

    // Try to withdraw more than available balance (assuming test user has limited balance)
    await page.getByLabel(/số tiền|amount/i).fill('999999999'); // Unrealistically high amount
    await page.getByLabel(/ngân hàng|bank/i).click();
    await page.getByRole('option', { name: /vietcombank|vcb/i }).first().click();
    await page.getByLabel(/số tài khoản|account number/i).fill('1234567890');
    await page.getByLabel(/tên tài khoản|account name/i).fill('NGUYEN VAN TEST');

    // Submit
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Verify insufficient balance error
    await expect(page.getByText(/số dư không đủ|insufficient.*balance/i)).toBeVisible({ 
      timeout: 3000 
    });
  });
});
