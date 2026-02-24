#!/usr/bin/env node
/**
 * test-admin-login-and-verify-redirect.js
 * Tests admin account access after email confirmation
 * Verifies redirect to /admin dashboard (not /dashboard)
 *
 * Prerequisites:
 * - npm install playwright
 * - Admin email confirmed in Supabase
 * - Password: [REDACTED]
 *
 * Usage: node scripts/test-admin-login-and-verify-redirect.js
 */

const { chromium } = require('playwright');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LOGIN_URL = process.env.LOGIN_URL || 'https://wellnexus.vn/login';
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || 'https://wellnexus.vn/admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
  process.exit(1);
}

(async () => {
  console.log('🔐 Admin Login Test');
  console.log('===================\n');

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    slowMo: 500       // Slow down for visibility
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to login
    console.log('📍 Step 1: Navigate to login page...');
    await page.goto(LOGIN_URL);
    console.log(`✅ Loaded: ${page.url()}\n`);

    // Step 2: Fill credentials
    console.log('📝 Step 2: Fill credentials...');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    console.log('✅ Credentials filled\n');

    // Step 3: Click login
    console.log('🖱️  Step 3: Click login button...');
    await page.click('button:has-text("Đăng nhập")');
    console.log('✅ Login button clicked\n');

    // Step 4: Wait for navigation
    console.log('⏳ Step 4: Waiting for redirect...');

    try {
      await page.waitForURL('**/admin', { timeout: 10000 });
      console.log('✅ Redirected to admin dashboard!\n');

      // Step 5: Verify admin page
      console.log('🔍 Step 5: Verify admin page...');
      const currentURL = page.url();
      const pageTitle = await page.title();

      console.log(`Current URL: ${currentURL}`);
      console.log(`Page Title: ${pageTitle}\n`);

      if (currentURL.includes('/admin')) {
        console.log('✅ SUCCESS: Admin access verified!\n');

        // Step 6: Screenshot
        console.log('📸 Step 6: Taking screenshot...');
        await page.screenshot({
          path: 'admin-dashboard-verified.png',
          fullPage: true
        });
        console.log('✅ Screenshot saved: admin-dashboard-verified.png\n');

        // Step 7: Check admin features
        console.log('🔍 Step 7: Checking admin features...');
        const bodyText = await page.textContent('body');

        const features = {
          'Partner Management': bodyText.includes('Partner') || bodyText.includes('Đối tác'),
          'Order Approval': bodyText.includes('Order') || bodyText.includes('Đơn hàng'),
          'Dashboard': bodyText.includes('Dashboard') || bodyText.includes('Bảng điều khiển')
        };

        console.log('Admin Features Found:');
        for (const [feature, found] of Object.entries(features)) {
          console.log(`  ${found ? '✅' : '❌'} ${feature}`);
        }

        console.log('\n🎉 ADMIN LOGIN TEST PASSED!\n');

        await browser.close();
        process.exit(0);

      } else {
        throw new Error('Not redirected to /admin');
      }

    } catch (timeoutError) {
      // Check if redirected to dashboard instead (wrong redirect)
      const currentURL = page.url();

      if (currentURL.includes('/dashboard')) {
        console.log('❌ FAILED: Redirected to /dashboard instead of /admin\n');
        console.log('Issue: User logged in but NOT detected as admin');
        console.log('Check: VITE_ADMIN_EMAILS env var in production\n');
        console.log('Expected: VITE_ADMIN_EMAILS=[REDACTED]\n');

        await page.screenshot({
          path: 'failed-dashboard-redirect.png',
          fullPage: true
        });
        console.log('Screenshot saved: failed-dashboard-redirect.png\n');

        await browser.close();
        process.exit(1);

      } else if (currentURL.includes('/login')) {
        // Still on login page - check for errors
        console.log('❌ FAILED: Still on login page\n');

        const errorText = await page.textContent('body').catch(() => '');
        if (errorText.includes('Email hoặc mật khẩu không đúng')) {
          console.log('Issue: Email still not verified OR wrong password');
          console.log('Action: Re-check email confirmation status in Supabase Dashboard\n');
        }

        await page.screenshot({
          path: 'failed-login-error.png',
          fullPage: true
        });
        console.log('Screenshot saved: failed-login-error.png\n');

        await browser.close();
        process.exit(1);

      } else {
        console.log(`❌ FAILED: Unexpected redirect to ${currentURL}\n`);

        await page.screenshot({
          path: 'failed-unexpected-redirect.png',
          fullPage: true
        });
        console.log('Screenshot saved: failed-unexpected-redirect.png\n');

        await browser.close();
        process.exit(1);
      }
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Stack:', error.stack);

    await page.screenshot({
      path: 'test-error.png',
      fullPage: true
    });
    console.log('Screenshot saved: test-error.png\n');

    await browser.close();
    process.exit(1);
  }
})();
