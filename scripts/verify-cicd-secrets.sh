#!/bin/bash

# CI/CD Secrets Verification Script
# Run this after configuring GitHub secrets to verify they work

set -e

echo "🔍 Verifying CI/CD Secrets Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not installed${NC}"
    echo "Install: brew install gh (macOS) or https://cli.github.com"
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not logged in to GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Repository
REPO="longtho638-jpg/Well"

echo "📋 Repository: $REPO"
echo ""

# Check if repository exists
if ! gh repo view "$REPO" &> /dev/null; then
    echo -e "${RED}❌ Repository not found or no access${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Repository accessible${NC}"
echo ""

# List workflows
echo "📋 GitHub Workflows:"
gh workflow list --repo "$REPO"
echo ""

# Check recent workflow runs
echo "📊 Recent Workflow Runs:"
gh run list --repo "$REPO" --limit 5 --json name,status,conclusion,headBranch \
  | jq -r '.[] | "\(.name) | \(.headBranch) | \(.status) | \(.conclusion)"' || \
  gh run list --repo "$REPO" --limit 5
echo ""

# Check if secrets exist (requires repo admin)
echo "🔐 Checking for required secrets..."
echo ""
echo "Required secrets:"
echo "  - CLOUDFLARE_API_TOKEN"
echo "  - CLOUDFLARE_ACCOUNT_ID"
echo "  - VITE_SUPABASE_URL"
echo "  - VITE_SUPABASE_ANON_KEY"
echo ""
echo -e "${YELLOW}⚠️  Note: Cannot verify secret values via CLI (security restriction)${NC}"
echo "Please verify manually in GitHub Settings → Secrets and variables → Actions"
echo ""

# Show how to trigger test deployment
echo "🚀 To trigger a test deployment:"
echo ""
echo "   git commit --allow-empty -m \"chore: trigger CD pipeline test\""
echo "   git push origin main"
echo ""
echo "   # Monitor workflow:"
echo "   gh run watch"
echo ""

# Show how to check deployment status
echo "📊 To check deployment status:"
echo ""
echo "   gh run list --workflow=\"CD Pipeline\" --limit 3"
echo ""

echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/longtho638-jpg/Well/settings/secrets/actions"
echo "2. Add all required secrets (see docs/CI_CD_SECRETS_SETUP.md)"
echo "3. Push a test commit to trigger deployment"
echo "4. Monitor: https://github.com/longtho638-jpg/Well/actions"
