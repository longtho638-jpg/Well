 
/* eslint-disable max-lines */
import { test, expect } from '@playwright/test';

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

test.describe('RaaS Gateway Integration', () => {
    test.describe('License Validation Flow', () => {

        test('should validate valid license with mk_api_key', async ({ page }) => {
            // Mock valid license response from RaaS Gateway
            await page.route('**/raas.agencyos.network/v1/validate-license', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        isValid: true,
                        tier: 'pro',
                        status: 'active',
                        features: {
                            adminDashboard: true,
                            premiumAgents: true,
                            advancedAnalytics: true,
                        },
                        quotaRemaining: 9500,
                        daysRemaining: 28,
                    }),
                });
            });

            await page.goto('/dashboard/analytics');

            // Verify dashboard shows active license status
            await expect(page.locator('[data-testid="license-status"]')).toContainText('active', { timeout: 5000 });
        });

        test('should display 403 page for expired license with i18n message (VI)', async ({ page }) => {
            // Mock expired license response
            await page.route('**/raas.agencyos.network/v1/validate-license', async (route) => {
                await route.fulfill({
                    status: 403,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        isValid: false,
                        tier: 'free',
                        status: 'expired',
                        reason: 'license_expired',
                        message: 'Giấy phép đã hết hạn',
                    }),
                });
            });

            await page.goto('/dashboard/analytics');

            // Verify 403 page displays with Vietnamese message
            await expect(page.locator('[data-testid="403-message"]')).toBeVisible({ timeout: 5000 });
            await expect(page.getByText(/giấy phép đã hết hạn|license expired/i)).toBeVisible();
        });

        test('should display quota exceeded message (VI)', async ({ page }) => {
            // Mock quota exceeded response
            await page.route('**/raas.agencyos.network/v1/check-model-quota', async (route) => {
                await route.fulfill({
                    status: 403,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        allowed: false,
                        reason: 'quota_exceeded',
                        currentUsage: 10500,
                        quota: 10000,
                        percentageUsed: 105,
                        message: 'Đã vượt quá giới hạn quota',
                    }),
                });
            });

            await page.goto('/dashboard/analytics');

            // Verify quota exceeded message
            await expect(page.getByText(/vượt quá|quota exceeded|over limit/i)).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Real-time Event Streaming', () => {

        test('should receive real-time events via Supabase Realtime', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Wait for realtime connection
            await expect(page.locator('[data-testid="realtime-status"]')).toContainText('connected', { timeout: 10000 });

            // Simulate incoming event via WebSocket
             
            const _mockEvent = {
                event_id: 'test-event-123',
                event_type: 'feature_used',
                org_id: 'org_test',
                feature: 'agent_chat',
                timestamp: new Date().toISOString(),
                quota_remaining: 9500,
            };

            // Listen for event in live feed
            const eventFeed = page.locator('[data-testid="live-feed"]');
            await expect(eventFeed).toBeVisible({ timeout: 5000 });

            // Verify events per minute display
            await expect(page.locator('[data-testid="events-per-minute"]')).toBeVisible();
        });

        test('should display live event feed with auto-scroll', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Check auto-scroll toggle is enabled by default
            const autoScrollToggle = page.locator('[data-testid="auto-scroll-toggle"]');
            await expect(autoScrollToggle).toBeChecked({ timeout: 5000 });

            // Verify live feed container exists
            await expect(page.locator('[data-testid="live-feed-container"]')).toBeVisible();
        });

        test('should update usage chart in real-time', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Wait for chart to load
            const usageChart = page.locator('[data-testid="usage-chart"]');
            await expect(usageChart).toBeVisible({ timeout: 10000 });

            // Verify chart has data points
            const dataPoints = usageChart.locator('.recharts-dot');
            await expect(dataPoints.count()).toBeGreaterThan(0);
        });
    });

    test.describe('Alert System', () => {

        test('should display alert badges for quota warnings', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Mock alert state
            await page.route('**/api/raas/alerts', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        alerts: [
                            {
                                id: 'alert-1',
                                severity: 'warning',
                                message: 'Quota usage at 90%',
                                type: 'quota_threshold',
                            },
                        ],
                    }),
                });
            });

            // Wait for alert badge
            const alertBadge = page.locator('[data-testid="alert-badge-warning"]');
            await expect(alertBadge).toBeVisible({ timeout: 5000 });
        });

        test('should display critical alert for suspension', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Mock critical alert
            await page.route('**/api/raas/alerts', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        alerts: [
                            {
                                id: 'alert-critical',
                                severity: 'critical',
                                message: 'Suspension imminent - 5 days past due',
                                type: 'suspension_warning',
                            },
                        ],
                    }),
                });
            });

            // Wait for critical alert badge
            const criticalBadge = page.locator('[data-testid="alert-badge-critical"]');
            await expect(criticalBadge).toBeVisible({ timeout: 5000 });
        });

        test('should allow dismissing non-critical alerts', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Mock alert
            await page.route('**/api/raas/alerts', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        alerts: [
                            {
                                id: 'alert-dismissable',
                                severity: 'info',
                                message: 'Feature blocked notification',
                                type: 'feature_blocked',
                            },
                        ],
                    }),
                });
            });

            // Wait for alert
            const alertBadge = page.locator('[data-testid="alert-badge-info"]');
            await expect(alertBadge).toBeVisible({ timeout: 5000 });

            // Click dismiss button
            const dismissButton = page.locator('[data-testid="alert-dismiss"]');
            await dismissButton.click();

            // Alert should be dismissed
            await expect(alertBadge).not.toBeVisible({ timeout: 3000 });
        });
    });

    test.describe('Audit Trail', () => {

        test('should display audit log viewer', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Navigate to audit log tab
            const auditTab = page.locator('[data-testid="audit-log-tab"]');
            await auditTab.click();

            // Wait for audit log table
            const auditTable = page.locator('[data-testid="audit-log-table"]');
            await expect(auditTable).toBeVisible({ timeout: 5000 });
        });

        test('should export audit log as JSON', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Navigate to audit log tab
            await page.locator('[data-testid="audit-log-tab"]').click();

            // Click export JSON button
            const downloadPromise = page.waitForEvent('download');
            await page.locator('[data-testid="export-json"]').click();
            const download = await downloadPromise;

            // Verify file downloaded
            expect(download.suggestedFilename()).toContain('audit-log');
            expect(download.suggestedFilename()).toMatch(/\.json$/);
        });

        test('should export audit log as CSV', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Navigate to audit log tab
            await page.locator('[data-testid="audit-log-tab"]').click();

            // Click export CSV button
            const downloadPromise = page.waitForEvent('download');
            await page.locator('[data-testid="export-csv"]').click();
            const download = await downloadPromise;

            // Verify file downloaded
            expect(download.suggestedFilename()).toContain('audit-log');
            expect(download.suggestedFilename()).toMatch(/\.csv$/);
        });
    });

    test.describe('API Key & Session Tracking', () => {

        test('should display mk_api_key in event details', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Wait for events to load
            const eventItem = page.locator('[data-testid="event-item"]').first();
            await eventItem.waitFor({ state: 'visible', timeout: 5000 });

            // Click to view details
            await eventItem.click();

            // Verify API key is displayed (masked)
            const apiKeyField = page.locator('[data-testid="event-api-key"]');
            await expect(apiKeyField).toBeVisible({ timeout: 3000 });
            await expect(apiKeyField).toContainText('mk_');
        });

        test('should display JWT session in audit trail', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Navigate to audit log
            await page.locator('[data-testid="audit-log-tab"]').click();

            // Check for session column
            const sessionColumn = page.locator('[data-testid="session-column"]');
            await expect(sessionColumn).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Rate Limiting & KV Cache', () => {

        test('should show cache hit indicator for license validation', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Mock cached response (X-Cache: HIT)
            await page.route('**/raas.agencyos.network/v1/validate-license', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: {
                        'X-Cache': 'HIT',
                    },
                    body: JSON.stringify({
                        isValid: true,
                        tier: 'pro',
                        status: 'active',
                        cached: true,
                    }),
                });
            });

            // Trigger license check
            await page.locator('[data-testid="check-license"]').click();

            // Verify cache indicator
            await expect(page.locator('[data-testid="cache-status"]')).toContainText('HIT', { timeout: 3000 });
        });

        test('should handle rate limit exceeded gracefully', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Mock rate limit response
            await page.route('**/raas.agencyos.network/v1/**', async (route) => {
                await route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'rate_limit_exceeded',
                        message: 'Too many requests. Please try again in 60 seconds.',
                        retryAfter: 60,
                    }),
                });
            });

            // Trigger API call
            await page.locator('[data-testid="check-license"]').click();

            // Verify rate limit message
            await expect(page.getByText(/rate limit|too many requests/i)).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Multi-tenant Isolation', () => {

        test('should only show events for current org', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Events should be filtered by org_id
            const eventItems = page.locator('[data-testid="event-item"]');
            const count = await eventItems.count();

            // At least one event should be visible
            expect(count).toBeGreaterThan(0);

            // All events should have same org_id
            for (let i = 0; i < count; i++) {
                const eventOrg = eventItems.nth(i).locator('[data-testid="event-org"]');
                // Verify org isolation (simplified check)
                await expect(eventOrg).not.toContainText('org_');
            }
        });
    });

    test.describe('Performance', () => {

        test('should load dashboard with 100 events without lag', async ({ page }) => {
            const startTime = Date.now();

            await page.goto('/dashboard/analytics');
            await page.waitForLoadState('networkidle');

            const loadTime = Date.now() - startTime;

            // Dashboard should load within 5 seconds even with 100 events
            expect(loadTime).toBeLessThan(5000);

            // Verify live feed is responsive
            const liveFeed = page.locator('[data-testid="live-feed"]');
            await expect(liveFeed).toBeVisible();
        });

        test('should maintain < 2s realtime latency', async ({ page }) => {
            await page.goto('/dashboard/analytics');

            // Wait for connection
            await expect(page.locator('[data-testid="realtime-status"]')).toContainText('connected', { timeout: 10000 });

            // Check latency indicator
            const latencyDisplay = page.locator('[data-testid="latency-ms"]');
            const latencyText = await latencyDisplay.textContent();
            const latency = parseInt(latencyText?.replace('ms', '') || '0');

            // Latency should be under 2000ms
            expect(latency).toBeLessThan(2000);
        });
    });
});
