#!/bin/bash
#
# Phase 7: Zero-Regression Testing Workflow
#
# This script runs comprehensive E2E tests before allowing production deployment.
# All tests MUST pass before promoting to production.
#
# Usage: ./scripts/zero-regression-test.sh
#
# Exit codes:
#   0 - All tests passed, safe to deploy
#   1 - Tests failed, DO NOT DEPLOY
#   2 - Environment not ready
#

set -e

echo "=============================================="
echo " Phase 7: Zero-Regression Testing Suite"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${RAAS_GATEWAY_URL:-https://raas.agencyos.network}"
DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:5173}"
TEST_MODE="${TEST_MODE:-staging}" # staging or production

echo "Configuration:"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Dashboard URL: $DASHBOARD_URL"
echo "  Test Mode: $TEST_MODE"
echo ""

# Step 1: Check environment
echo "Step 1: Checking environment..."

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found${NC}"
    exit 2
fi

# Check if test credentials are available
if [ -z "$TEST_MK_API_KEY" ]; then
    echo -e "${YELLOW}Warning: TEST_MK_API_KEY not set, using default test key${NC}"
fi

# Check gateway health
echo "Checking gateway health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo -e "${RED}Gateway health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    echo "The gateway at $GATEWAY_URL is not responding."
    echo "Please ensure the gateway is deployed and accessible."
    exit 2
fi

echo -e "${GREEN}Gateway health check passed${NC}"
echo ""

# Step 2: Run unit tests
echo "Step 2: Running unit tests..."
npm run test:run -- src/lib/__tests__/raas-*.test.ts --reporter=verbose

if [ $? -ne 0 ]; then
    echo -e "${RED}Unit tests failed${NC}"
    exit 1
fi

echo -e "${GREEN}Unit tests passed${NC}"
echo ""

# Step 3: Run E2E tests
echo "Step 3: Running E2E tests..."

# Run core E2E tests
npx playwright test e2e/raas-gateway-integration.spec.ts --reporter=list

if [ $? -ne 0 ]; then
    echo -e "${RED}Core E2E tests failed${NC}"
    exit 1
fi

echo -e "${GREEN}Core E2E tests passed${NC}"
echo ""

# Run advanced E2E tests
echo "Step 4: Running advanced E2E tests..."
npx playwright test e2e/raas-advanced.spec.ts --reporter=list

if [ $? -ne 0 ]; then
    echo -e "${RED}Advanced E2E tests failed${NC}"
    exit 1
fi

echo -e "${GREEN}Advanced E2E tests passed${NC}"
echo ""

# Step 5: Production smoke tests (only if TEST_MODE=production)
if [ "$TEST_MODE" = "production" ]; then
    echo "Step 5: Running production smoke tests..."
    npx playwright test e2e/raas-advanced.spec.ts --grep "Production Smoke" --reporter=list

    if [ $? -ne 0 ]; then
        echo -e "${RED}Production smoke tests failed${NC}"
        exit 1
    fi

    echo -e "${GREEN}Production smoke tests passed${NC}"
    echo ""
fi

# Step 6: Generate test report
echo "Step 6: Generating test report..."

mkdir -p test-reports
REPORT_FILE="test-reports/zero-regression-$(date +%Y%m%d-%H%M%S).json"

npx playwright test --reporter=json > "$REPORT_FILE" 2>&1 || true

echo "Test report saved to: $REPORT_FILE"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}Zero-Regression Testing: PASSED${NC}"
echo "=============================================="
echo ""
echo "Summary:"
echo "  Unit tests: PASSED"
echo "  Core E2E tests: PASSED"
echo "  Advanced E2E tests: PASSED"
if [ "$TEST_MODE" = "production" ]; then
    echo "  Production smoke tests: PASSED"
fi
echo ""
echo -e "${GREEN}Safe to deploy to production${NC}"
echo ""

exit 0
