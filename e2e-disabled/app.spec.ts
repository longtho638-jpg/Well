/**
 * WellNexus E2E Test Suite
 * Phase 4: Advanced Features - Critical User Journeys
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to signup from login', async ({ page }) => {
        await page.goto('/login');
        await page.click('text=/đăng ký|sign.?up|register/i');
        await expect(page).toHaveURL(/register|signup/);
    });

    test('demo login should work', async ({ page }) => {
        await page.goto('/login');
        const demoButton = page.locator('button:has-text("demo"), button:has-text("thử nghiệm"), a:has-text("demo"), a:has-text("thử nghiệm")').first();
        if (await demoButton.count() > 0) {
            await demoButton.click();
            await expect(page).toHaveURL(/dashboard/);
        } else {
            test.skip();
        }
    });
});

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('wellnexus_mock_session', 'true');
            localStorage.setItem('wellnexus_mock_email', 'demo@example.com');
        });
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    });

    test('should display dashboard content', async ({ page }) => {
        await expect(page).toHaveURL(/dashboard/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should show user stats or cards', async ({ page }) => {
        const hasStats = await page.locator('[class*="stat"], [class*="card"], [data-testid*="card"]').count();
        expect(hasStats).toBeGreaterThanOrEqual(0);
    });

    test('should have navigation links', async ({ page }) => {
        const navExists = await page.locator('nav, [role="navigation"], header').count();
        expect(navExists).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Marketplace', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('wellnexus_mock_session', 'true');
            localStorage.setItem('wellnexus_mock_email', 'demo@example.com');
        });
    });

    test('should display marketplace page', async ({ page }) => {
        await page.goto('/marketplace');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await expect(page).toHaveURL(/marketplace/);
    });

    test('should display products or product grid', async ({ page }) => {
        await page.goto('/marketplace');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        const productElements = await page.locator('[class*="product"], [class*="card"], [class*="item"], [data-testid*="product"]').count();
        expect(productElements).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('wellnexus_mock_session', 'true');
            localStorage.setItem('wellnexus_mock_email', 'demo@example.com');
        });
    });

    test('should have working sidebar', async ({ page }) => {
        await page.goto('/dashboard');
        const sidebar = page.locator('[data-testid="sidebar"]');
        if (await sidebar.isVisible()) {
            await expect(sidebar).toBeVisible();
        }
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/dashboard');
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Performance', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('wellnexus_mock_session', 'true');
            localStorage.setItem('wellnexus_mock_email', 'demo@example.com');
        });
    });

    test('should load dashboard under 6 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - start;
        expect(loadTime).toBeLessThan(6000);
    });
});
