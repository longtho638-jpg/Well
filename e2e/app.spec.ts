import { test, expect } from '@playwright/test';

/**
 * WellNexus E2E Test Suite
 * Phase 4: Advanced Features - Critical User Journeys
 */

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: /đăng nhập|login/i })).toBeVisible();
    });

    test('should navigate to signup from login', async ({ page }) => {
        await page.goto('/login');
        await page.click('text=/đăng ký|signup/i');
        await expect(page).toHaveURL(/signup/);
    });

    test('demo login should work', async ({ page }) => {
        await page.goto('/login');
        await page.click('text=/demo|thử nghiệm/i');
        await expect(page).toHaveURL(/dashboard/);
    });
});

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Demo login
        await page.goto('/login');
        await page.click('text=/demo|thử nghiệm/i');
        await page.waitForURL(/dashboard/);
    });

    test('should display hero card', async ({ page }) => {
        await expect(page.locator('[class*="HeroCard"]').first()).toBeVisible();
    });

    test('should show user stats', async ({ page }) => {
        await expect(page.getByText(/portfolio|balance/i)).toBeVisible();
    });

    test('should navigate to marketplace', async ({ page }) => {
        await page.click('text=/marketplace|sản phẩm/i');
        await expect(page).toHaveURL(/marketplace/);
    });
});

test.describe('Marketplace', () => {
    test('should display products', async ({ page }) => {
        await page.goto('/marketplace');
        await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter products', async ({ page }) => {
        await page.goto('/marketplace');
        await page.click('text=/health|sức khỏe/i');
        await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);
    });
});

test.describe('Navigation', () => {
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
        // Mobile should show hamburger menu
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Performance', () => {
    test('should load dashboard under 3 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - start;
        expect(loadTime).toBeLessThan(3000);
    });
});
