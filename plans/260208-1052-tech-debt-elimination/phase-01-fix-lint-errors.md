# Phase 1: Fix 8 Lint Errors (Empty Block Statements)

**Priority:** High | **Status:** Pending

## Overview

All 8 errors are `no-empty` (empty block statement). Fix by adding meaningful comments or removing dead code.

## Files & Fixes

### 1. `src/components/MarketingTools/ai-landing-page-builder.tsx` (lines 62, 66)
- Two empty catch blocks
- Fix: Add `// intentionally empty` or handle error

### 2. `src/services/hub-sdk.ts` (line 50)
- Empty block
- Fix: Add comment or remove

### 3. `src/components/auth/SignupForm.tsx` (line 18)
- Empty block
- Fix: Add comment or remove

### 4. `src/utils/encoding.ts` (line 65)
- Empty catch block
- Fix: Add `// decoding failed, return fallback`

### 5. `src/utils/secure-token-storage.ts` (line 164)
- Empty catch block
- Fix: Add `// storage unavailable, silently degrade`

### 6. `src/services/web-push-notification-service.ts` (lines 62, 75)
- Two empty catch blocks
- Fix: Add `// push notification not supported/available`

## Pattern

For all empty catch blocks: add a single-line `// <reason>` comment explaining why the block is intentionally empty. Do NOT add unnecessary error handling — these are legitimate silent catches.

## Success Criteria

- `npm run lint 2>&1 | grep "error " | wc -l` = 0
