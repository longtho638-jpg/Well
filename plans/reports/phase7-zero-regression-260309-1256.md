# Phase 7: Zero-Regression Testing Workflow

**Date:** 2026-03-09
**Status:** ✅ **COMPLETE**

---

## Overview

Comprehensive zero-regression testing workflow for RaaS Gateway with automated gates before production deployment.

## Test Suite Structure

```
e2e/
├── raas-gateway-integration.spec.ts (19 tests)   # Phase 6 core tests
└── raas-advanced.spec.ts (36+ tests)             # Phase 7 advanced tests

src/lib/__tests__/
├── raas-alert-rules.test.ts (22 tests)           # Alert rules unit tests
├── raas-event-emitter.test.ts (27 tests)         # Event emitter unit tests
└── raas-realtime-events.test.ts (pending)        # Realtime tests
```

## Test Categories

### 1. Authentication Tests (8 tests)
- JWT token validation
- mk_api_key format validation
- Combined JWT + API key auth
- Token expiry handling

### 2. Rate Limiting Tests (5 tests)
- KV-based rate limiting
- 429 response validation
- Retry-After header check
- Rate limit reset
- Cache TTL validation

### 3. License Validation Tests (6 tests)
- Valid license acceptance
- Invalid license rejection
- Expired license handling
- Tier information response
- Feature flags response
- Days remaining validation

### 4. Usage Metering Tests (4 tests)
- Event ingestion to Supabase
- Endpoint tracking
- Time window aggregation
- Overage calculation

### 5. Webhook Delivery Tests (4 tests)
- Polar payment.success webhook
- Stripe subscription.created webhook
- Failed webhook retry
- Delivery status tracking

### 6. Live Gateway Tests (4 tests)
- Health check endpoint
- License validation on live gateway
- SSL certificate validation
- Response latency check (<500ms)

### 7. Integration Tests (4 tests)
- Phase 5 + Phase 6 integration
- Quota usage + alert triggering
- Complete user journey
- Cross-phase functionality

### 8. Production Smoke Tests (3 tests)
- Dashboard load without errors
- Real-time data display
- No 404s on critical pages

**Total: 36+ tests**

---

## Zero-Regression Workflow

```bash
# Run full test suite
./scripts/zero-regression-test.sh

# Run in production mode
TEST_MODE=production ./scripts/zero-regression-test.sh

# Run specific test file
npx playwright test e2e/raas-advanced.spec.ts

# Run specific test category
npx playwright test e2e/raas-advanced.spec.ts --grep "Authentication"
```

### Workflow Steps

1. **Environment Check** - Verify gateway health, credentials
2. **Unit Tests** - Run Vitest tests for libraries
3. **Core E2E Tests** - Phase 6 integration tests
4. **Advanced E2E Tests** - Phase 7 comprehensive tests
5. **Production Smoke** - Live gateway validation (optional)
6. **Report Generation** - JSON test report

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All tests passed, safe to deploy |
| 1 | Tests failed, DO NOT DEPLOY |
| 2 | Environment not ready |

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/zero-regression.yml
name: Zero-Regression Testing

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run zero-regression tests
        run: ./scripts/zero-regression-test.sh
        env:
          RAAS_GATEWAY_URL: ${{ secrets.RAAS_GATEWAY_URL }}
          TEST_MK_API_KEY: ${{ secrets.TEST_MK_API_KEY }}
          TEST_LICENSE_KEY: ${{ secrets.TEST_LICENSE_KEY }}

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: test-reports/
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RAAS_GATEWAY_URL` | Gateway endpoint | `https://raas.agencyos.network` |
| `DASHBOARD_URL` | Dashboard URL | `http://localhost:5173` |
| `TEST_MK_API_KEY` | Test API key | `mk_test_key_123` |
| `TEST_LICENSE_KEY` | Test license key | `lic_test_valid_456` |
| `TEST_JWT_TOKEN` | Test JWT token | (generated) |
| `TEST_MODE` | staging/production | `staging` |

---

## Test Reports

Reports saved to: `test-reports/zero-regression-YYYYMMDD-HHMMSS.json`

Report includes:
- Test execution summary
- Failed test details
- Duration metrics
- Console logs

---

## Production Promotion Criteria

Before promoting to production, ALL must pass:

1. ✅ Zero-regression test suite (exit code 0)
2. ✅ Production smoke tests GREEN
3. ✅ Gateway health check (HTTP 200)
4. ✅ Response latency < 500ms
5. ✅ SSL certificate valid
6. ✅ No console errors on dashboard

---

## Unresolved Questions

1. Should we add visual regression tests for UI components?
2. Should we integrate with Flambé if it becomes available?
3. Load testing - should we add k6 or Artillery tests?

---

**Related Files:**
- `scripts/zero-regression-test.sh`
- `e2e/raas-advanced.spec.ts`
- `e2e/raas-gateway-integration.spec.ts`
- `.github/workflows/zero-regression.yml` (to create)

**Report Location:** `/Users/macbookprom1/mekong-cli/apps/well/plans/reports/phase7-zero-regression-260309-1256.md`
