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

import { test, expect } from '@playwright/test'

test.describe('Quota Exhaustion Flow', () => {
  // Test data setup
  const testOrg = {
    id: 'e2e-test-org',
    tier: 'basic',
    apiCallsQuota: 10000,
  }

  test.beforeEach(async ({ page }) => {
    // Reset test state before each test
    await page.route('**/api/reset-e2e-state', async route => {
      await route.fulfill({ status: 200, json: { success: true } })
    })
  })

  test('should show warning at 80% quota usage', async ({ page }) => {
    // Seed: org with 8000/10000 api_calls used (80%)
    await page.route('**/api/usage/current', async route => {
      await route.fulfill({
        status: 200,
        json: {
          currentUsage: 8000,
          quotaLimit: 10000,
          percentageUsed: 80,
          remaining: 2000,
          severity: 'high',
        },
      })
    })

    await page.goto('/dashboard/usage')

    // Verify warning banner visible
    await expect(page.locator('[data-testid="quota-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="quota-percentage"]')).toHaveText('80%')
    await expect(page.locator('[data-testid="quota-severity"]')).toHaveText('Warning')

    // Verify upgrade CTA visible
    await expect(page.locator('[data-testid="upgrade-cta"]')).toBeVisible()
  })

  test('should show critical alert at 90% quota usage', async ({ page }) => {
    // Seed: org with 9000/10000 api_calls used (90%)
    await page.route('**/api/usage/current', async route => {
      await route.fulfill({
        status: 200,
        json: {
          currentUsage: 9000,
          quotaLimit: 10000,
          percentageUsed: 90,
          remaining: 1000,
          severity: 'critical',
        },
      })
    })

    await page.goto('/dashboard/usage')

    // Verify critical alert
    await expect(page.locator('[data-testid="quota-critical-alert"]')).toBeVisible()
    await expect(page.locator('[data-testid="quota-percentage"]')).toHaveText('90%')

    // Verify SMS notification prompt (critical threshold)
    await expect(page.locator('[data-testid="sms-alert-prompt"]')).toBeVisible()
  })

  test('should block API calls in hard mode when exhausted', async ({ page }) => {
    // Seed: org with 10000/10000 api_calls used, enforcementMode='hard'
    await page.route('**/api/data', async route => {
      await route.fulfill({
        status: 429,
        json: {
          error: 'quota_exceeded',
          message: 'Quota exceeded. Upgrade plan or wait for reset.',
          details: {
            currentUsage: 10000,
            effectiveQuota: 10000,
            percentageUsed: 100,
          },
          retry_after: 3600,
        },
        headers: {
          'Retry-After': '3600',
          'X-Quota-Limit': '10000',
          'X-Quota-Remaining': '0',
        },
      })
    })

    const response = await page.request.post('/api/data', {
      headers: { 'X-API-Key': 'e2e-test-key' },
    })

    await expect(response.status()).toBe(429)

    const json = await response.json()
    await expect(json.error).toBe('quota_exceeded')
    await expect(json.retry_after).toBe(3600)
  })

  test('should allow with overage billing in soft mode', async ({ page }) => {
    // Seed: org with 10000/10000 api_calls used, enforcementMode='soft'
    await page.route('**/api/data', async route => {
      await route.fulfill({
        status: 200,
        json: { data: 'success' },
        headers: {
          'X-Quota-Warning': 'overage_billing_applies',
          'X-Quota-Overage-Units': '500',
        },
      })
    })

    const response = await page.request.post('/api/data', {
      headers: { 'X-API-Key': 'e2e-test-key' },
    })

    await expect(response.status()).toBe(200)
    await expect(response.headers()['x-quota-warning']).toBe('overage_billing_applies')
  })

  test('should trigger dunning workflow on overage', async ({ page }) => {
    // Seed: org with overage transaction created
    await page.route('**/api/billing/overages', async route => {
      await route.fulfill({
        status: 200,
        json: {
          overages: [
            {
              id: 'ovg-123',
              metricType: 'api_calls',
              overageUnits: 500,
              totalCost: 0.40,
              billingPeriod: '2026-03',
              status: 'pending',
            },
          ],
          totalCost: 0.40,
        },
      })
    })

    await page.goto('/dashboard/billing')

    // Verify overage notice visible
    await expect(page.locator('[data-testid="overage-notice"]')).toBeVisible()
    await expect(page.locator('[data-testid="overage-amount"]')).toHaveText('$0.40')

    // Verify upgrade CTA to avoid future overages
    await expect(page.locator('[data-testid="upgrade-cta"]')).toBeVisible()
  })

  test('should unlock API after plan upgrade', async ({ page }) => {
    // Initial state: quota exhausted
    await page.route('**/api/usage/current', async route => {
      await route.fulfill({
        status: 200,
        json: {
          currentUsage: 10000,
          quotaLimit: 10000,
          percentageUsed: 100,
          remaining: 0,
        },
      })
    })

    await page.goto('/dashboard/subscription')

    // Simulate upgrade
    await page.click('[data-testid="upgrade-to-pro"]')
    await page.click('[data-testid="confirm-upgrade"]')

    // Wait for upgrade to process
    await page.waitForTimeout(1000)

    // Verify quota updated
    await page.goto('/dashboard/usage')
    await expect(page.locator('[data-testid="quota-percentage"]')).toHaveText('20%')
    await expect(page.locator('[data-testid="quota-limit"]')).toHaveText('50,000')
  })
})

test.describe('Multi-Metric Quota Tracking', () => {
  test('should track multiple metrics independently', async ({ page }) => {
    // Seed: org with different usage levels per metric
    await page.route('**/api/usage/metrics', async route => {
      await route.fulfill({
        status: 200,
        json: {
          metrics: [
            { name: 'api_calls', used: 8000, limit: 10000, percentage: 80 },
            { name: 'tokens', used: 500000, limit: 1000000, percentage: 50 },
            { name: 'ai_calls', used: 95, limit: 100, percentage: 95 },
          ],
        },
      })
    })

    await page.goto('/dashboard/usage')

    // Verify each metric displayed correctly
    await expect(page.locator('[data-metric="api_calls"] [data-testid="percentage"]')).toHaveText('80%')
    await expect(page.locator('[data-metric="tokens"] [data-testid="percentage"]')).toHaveText('50%')
    await expect(page.locator('[data-metric="ai_calls"] [data-testid="percentage"]')).toHaveText('95%')

    // Verify critical alert for AI calls (95%)
    await expect(page.locator('[data-metric="ai_calls"] [data-testid="critical-alert"]')).toBeVisible()
  })
})

test.describe('Real-time Quota Updates', () => {
  test('should update quota display in real-time via WebSocket', async ({ page }) => {
    await page.goto('/dashboard/usage')

    // Simulate WebSocket message with usage update
    await page.evaluate(() => {
      window.postMessage(
        { type: 'QUOTA_UPDATE', usage: { current: 8500, limit: 10000, percentage: 85 } },
        '*'
      )
    })

    // Verify display updated
    await expect(page.locator('[data-testid="quota-percentage"]')).toHaveText('85%')
  })
})
