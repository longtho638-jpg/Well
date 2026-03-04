#!/bin/bash

# WellNexus Navigation Test Script
# Usage: ./scripts/test-navigation.sh https://your-project.vercel.app

BASE_URL=${1:-"https://wellnexus-raas.vercel.app"}

echo "Testing navigation paths for: $BASE_URL"
echo "========================================="

# Test routes
ROUTES=(
  "/"
  "/dashboard"
  "/dashboard/marketplace"
  "/dashboard/wallet"
  "/dashboard/referral"
  "/dashboard/leader"
  "/dashboard/product/1"
)

PASSED=0
FAILED=0

for route in "${ROUTES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")

  if [ "$STATUS" -eq 200 ]; then
    echo "✅ $route - OK ($STATUS)"
    ((PASSED++))
  else
    echo "❌ $route - FAILED ($STATUS)"
    ((FAILED++))
  fi
done

echo "========================================="
echo "Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo "🎉 All navigation tests passed!"
  exit 0
else
  echo "⚠️  Some navigation tests failed"
  exit 1
fi
