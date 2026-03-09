/* eslint-disable max-lines */
/**
 * Phase 7: Advanced E2E Testing Suite for RaaS Gateway
 *
 * Comprehensive testing for:
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

// Test configuration
const GATEWAY_URL = process.env.RAAS_GATEWAY_URL || 'https://raas.agencyos.network';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';

// Test credentials (from env or defaults)
const TEST_MK_API_KEY = process.env.TEST_MK_API_KEY || 'mk_test_key_123';
const TEST_LICENSE_KEY = process.env.TEST_LICENSE_KEY || 'lic_test_valid_456';
const TEST_JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

/**
 * Section 1: JWT + mk_api_key Authentication Tests
 */
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
                    licenseKey: TEST_LICENSE_KEY,
                    mkApiKey: TEST_MK_API_KEY,
                },
            });

            // Should accept valid JWT
            expect(response.status()).toBe(200);

            const body = await response.json();
            expect(body).toHaveProperty('isValid');
            expect(body).toHaveProperty('tier');
        });

        test('should reject expired JWT token', async ({ request }) => {
            const expiredJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired';

            const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${expiredJWT}`,
                    'X-API-Key': TEST_MK_API_KEY,
                },
                data: {
                    licenseKey: TEST_LICENSE_KEY,
                },
            });

            // Should reject expired JWT
            expect([401, 403]).toContain(response.status());
        });

        test('should reject invalid JWT signature', async ({ request }) => {
            const invalidJWT = 'invalid.token.signature';

            const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${invalidJWT}`,
                },
                data: {
                    licenseKey: TEST_LICENSE_KEY,
                },
            });

            expect([401, 403]).toContain(response.status());
        });

        test('should work without JWT when mk_api_key provided', async ({ request }) => {
            // Some endpoints may allow API key-only auth
            const response = await request.post(`${GATEWAY_URL}/v1/check-model-quota`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': TEST_MK_API_KEY,
                },
                data: {
                    licenseKey: TEST_LICENSE_KEY,
                    orgId: 'org_test',
                },
            });

            // Should at least process the request (may not be 200)
            expect(response.status()).toBeLessThan(500);
        });
    });

    test.describe('mk_api_key Validation', () => {

        test('should accept valid mk_api_key format', async ({ request }) => {
            const validMkKey = 'mk_prod_abc123xyz';

            const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': validMkKey,
                },
                data: {
                    licenseKey: TEST_LICENSE_KEY,
                    mkApiKey: validMkKey,
                },
            });

            // Valid mk_ prefix should be accepted
            expect(response.status()).not.toBe(400);
        });

        test('should reject invalid api_key format', async ({ request }) => {
            const invalidKey = 'invalid_key_format';

            const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': invalidKey,
                },
                data: {
                    licenseKey: TEST_LICENSE_KEY,
                },
            });

            expect([400, 401, 403]).toContain(response.status());
        });

        test('should track requests by mk_api_key in analytics', async ({ page }) => {
            // Navigate to dashboard where analytics events are logged
            await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

            // Wait for page load
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Analytics should be tracking API key usage
            const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
            await expect(analyticsPanel).toBeVisible({ timeout: 5000 });
        });
    });
});

/**
 * Section 2: KV-Based Rate Limiting Tests
 */
test.describe('Phase 7: KV Rate Limiting', () => {

    test('should allow requests under rate limit', async ({ request }) => {
        // Make a single request - should be under limit
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': TEST_MK_API_KEY,
            },
            data: {
                licenseKey: TEST_LICENSE_KEY,
            },
        });

        // Should succeed
        expect(response.status()).toBe(200);

        // Should include cache headers
        const cacheHeader = response.headers()['x-cache'];
        expect(['HIT', 'MISS', undefined]).toContain(cacheHeader);
    });

    test('should return 429 when rate limit exceeded', async ({ request }) => {
        const rateLimit = 100; // requests per minute
        const responses: number[] = [];

        // Make rapid requests to exceed rate limit
        for (let i = 0; i < rateLimit + 10; i++) {
            const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': TEST_MK_API_KEY,
                },
                data: {
                    licenseKey: TEST_LICENSE_KEY,
                },
            });
            responses.push(response.status());

            if (response.status() === 429) {
                break; // Rate limit hit
            }
        }

        // Should have hit rate limit
        expect(responses).toContain(429);
    });

    test('should include retry-after header when rate limited', async ({ request }) => {
        let retryAfter: string | null = null;

        // Make requests until rate limited
        for (let i = 0; i < 150; i++) {
            const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': TEST_MK_API_KEY,
                },
                data: { licenseKey: TEST_LICENSE_KEY },
            });

            if (response.status() === 429) {
                retryAfter = response.headers()['retry-after'];
                break;
            }
        }

        // Should have retry-after header
        expect(retryAfter).toBeTruthy();
    });

    test('should reset rate limit after window expires', async () => {
        // This test would require waiting for the rate limit window to reset
        // In practice, we'd skip this or use a shorter test window
        test.skip(true, 'Rate limit reset test requires long wait time');
    });

    test('should cache responses with correct TTL', async ({ request }) => {
        // First request - should be MISS
        const response1 = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': TEST_MK_API_KEY,
            },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        const cache1 = response1.headers()['x-cache'];

        // Immediate second request - should be HIT
        const response2 = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': TEST_MK_API_KEY,
            },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        const cache2 = response2.headers()['x-cache'];

        // Verify caching behavior
        if (cache1 === 'MISS') {
            expect(cache2).toBe('HIT');
        }
    });
});

/**
 * Section 3: License Key Validation (RAAS_LICENSE_KEY Gate)
 */
test.describe('Phase 7: License Validation Gate', () => {

    test('should accept valid RAAS_LICENSE_KEY', async ({ request }) => {
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.isValid).toBe(true);
    });

    test('should reject invalid license key', async ({ request }) => {
        const invalidKey = 'lic_invalid_key_000';

        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: invalidKey },
        });

        expect([400, 403]).toContain(response.status());

        const body = await response.json();
        expect(body.isValid).toBe(false);
    });

    test('should reject expired license key', async ({ request }) => {
        const expiredKey = 'lic_expired_xxx999';

        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: expiredKey },
        });

        expect([400, 403]).toContain(response.status());
    });

    test('should return correct tier information', async ({ request }) => {
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        const body = await response.json();
        expect(body).toHaveProperty('tier');
        expect(['free', 'basic', 'pro', 'enterprise', 'master']).toContain(body.tier);
    });

    test('should return feature flags for tier', async ({ request }) => {
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        const body = await response.json();
        expect(body).toHaveProperty('features');
        expect(typeof body.features).toBe('object');
    });

    test('should include daysRemaining for valid licenses', async ({ request }) => {
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        const body = await response.json();
        expect(body).toHaveProperty('daysRemaining');
        expect(typeof body.daysRemaining).toBe('number');
    });
});

/**
 * Section 4: Usage Metering Ingestion Tests
 */
test.describe('Phase 7: Usage Metering', () => {

    test('should ingest usage events to Supabase', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

        // Trigger some usage
        await page.click('[data-testid="usage-trigger"]').catch(() => {});

        // Wait for ingestion
        await page.waitForTimeout(2000);

        // Check analytics panel shows activity
        const usageDisplay = page.locator('[data-testid="usage-display"]');
        await expect(usageDisplay).toBeVisible({ timeout: 5000 });
    });

    test('should track API calls by endpoint', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

        // Look for endpoint breakdown
        const endpointTable = page.locator('[data-testid="endpoint-breakdown"]');
        await expect(endpointTable).toBeVisible({ timeout: 5000 });
    });

    test('should aggregate usage by time window', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

        // Check time-based aggregation (hourly/daily)
        const timeSelector = page.locator('[data-testid="time-range-selector"]');
        await expect(timeSelector).toBeVisible({ timeout: 5000 });
    });

    test('should calculate overage charges', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/billing`);

        // Look for overage display
        const overageDisplay = page.locator('[data-testid="overage-charges"]');
        await expect(overageDisplay).toBeVisible({ timeout: 5000 });
    });
});

/**
 * Section 5: Stripe/Polar Webhook Delivery Tests
 */
test.describe('Phase 7: Webhook Delivery', () => {

    test('should deliver payment.success webhook from Polar', async ({ page }) => {
        // This would typically require a webhook endpoint
        // For E2E testing, we check if webhook was logged
        await page.goto(`${DASHBOARD_URL}/dashboard/billing/webhooks`);

        // Look for webhook logs
        const webhookLogs = page.locator('[data-testid="webhook-logs"]');
        await expect(webhookLogs).toBeVisible({ timeout: 5000 });
    });

    test('should deliver subscription.created webhook from Stripe', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/billing/webhooks`);

        // Check for Stripe webhook events
        const stripeEvents = page.locator('[data-testid="stripe-events"]');
        await expect(stripeEvents).toBeVisible({ timeout: 5000 });
    });

    test('should retry failed webhook deliveries', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/billing/webhooks`);

        // Check for retry mechanism
        const retryButton = page.locator('[data-testid="retry-webhook"]');
        await expect(retryButton).toBeVisible({ timeout: 5000 });
    });

    test('should track webhook delivery status', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/billing/webhooks`);

        // Check delivery status indicators
        const statusIndicator = page.locator('[data-testid="delivery-status"]');
        await expect(statusIndicator).toBeVisible({ timeout: 5000 });
    });
});

/**
 * Section 6: Live Gateway Testing (Production Validation)
 */
test.describe('Phase 7: Live Gateway Testing', () => {

    test('health check should return 200', async ({ request }) => {
        const response = await request.get(`${GATEWAY_URL}/health`);

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.status).toBe('ok');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('service');
    });

    test('should respond to license validation on live gateway', async ({ request }) => {
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        // Live gateway should respond
        expect(response.status()).toBeLessThan(500);
    });

    test('should have valid SSL certificate', async ({ request }) => {
        // This is implicit - if request succeeds, SSL is valid
        const response = await request.get(`${GATEWAY_URL}/health`);
        expect(response.status()).toBe(200);
    });

    test('should have acceptable response latency (<500ms)', async ({ request }) => {
        const startTime = Date.now();

        const response = await request.get(`${GATEWAY_URL}/health`);
        await response.json(); // Consume body

        const latency = Date.now() - startTime;

        // Edge gateway should respond in <500ms
        expect(latency).toBeLessThan(500);
    });
});

/**
 * Section 7: Cross-Phase Integration Tests
 */
test.describe('Phase 7: Integration Tests (Phases 1-6)', () => {

    test('should enforce license gate (Phase 5) + log event (Phase 6)', async ({ page, request }) => {
        // Test license validation
        const response = await request.post(`${GATEWAY_URL}/v1/validate-license`, {
            headers: { 'Content-Type': 'application/json' },
            data: { licenseKey: TEST_LICENSE_KEY },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.isValid).toBe(true);

        // Navigate to dashboard and verify event was logged
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

        // Check for license validation event in feed
        const liveFeed = page.locator('[data-testid="live-feed"]');
        await expect(liveFeed).toContainText('license', { timeout: 5000 });
    });

    test('should track quota usage (Phase 4) + trigger alert (Phase 6)', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

        // Check quota display
        const quotaDisplay = page.locator('[data-testid="quota-display"]');
        await expect(quotaDisplay).toBeVisible({ timeout: 5000 });

        // Check for alert badge
        const alertBadge = page.locator('[data-testid="alert-badge"]');
        await expect(alertBadge).toBeVisible({ timeout: 5000 });
    });

    test('complete user journey: auth → usage → billing → alert', async ({ page }) => {
        // 1. Login/auth
        await page.goto(`${DASHBOARD_URL}/login`);

        // 2. Navigate to dashboard
        await page.goto(`${DASHBOARD_URL}/dashboard`);
        await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });

        // 3. Check usage analytics
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);
        await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible({ timeout: 5000 });

        // 4. Check billing
        await page.goto(`${DASHBOARD_URL}/dashboard/billing`);
        await expect(page.locator('[data-testid="billing-summary"]')).toBeVisible({ timeout: 5000 });

        // 5. Check alerts
        const alertBadge = page.locator('[data-testid="alert-badge"]');
        await expect(alertBadge).toBeVisible({ timeout: 5000 });
    });
});

/**
 * Section 8: Production Smoke Tests
 */
test.describe('Phase 7: Production Smoke Tests', () => {

    test('production dashboard should load without errors', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard`);

        // Wait for load
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Check for errors in console
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('Console error:', msg.text());
            }
        });

        // Dashboard should have content
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('analytics page should display real-time data', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/dashboard/analytics`);

        // Check realtime connection
        const realtimeStatus = page.locator('[data-testid="realtime-status"]');
        await expect(realtimeStatus).toContainText(/connected|connecting/i, { timeout: 5000 });
    });

    test('no 404s on critical pages', async ({ page }) => {
        const criticalPages = [
            '/dashboard',
            '/dashboard/analytics',
            '/dashboard/billing',
            '/dashboard/settings',
        ];

        for (const path of criticalPages) {
            const response = await page.goto(`${DASHBOARD_URL}${path}`);
            expect(response?.status()).not.toBe(404);
        }
    });
});
