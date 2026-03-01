# Phase 1: Fail-Fast Service Error Handling

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: zx throws on non-zero exit, `nothrow()` for opt-in ignore, `retry()` for flaky ops

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Standardize error handling across Well's service layer. Fail-fast by default (throw on error). Explicit opt-in for ignorable errors. Retry pattern for external APIs.

## Architecture

```typescript
// Fail-fast: all services throw by default
const result = await productService.getProducts(filters); // throws on error

// Opt-in ignore (like zx's nothrow)
const result = await nothrow(() => productService.getProducts(filters)); // returns null on error

// Retry for flaky APIs (like zx's retry)
const aiResponse = await retry(3, () => aiGateway.chat(messages)); // 3 attempts
```

## Implementation Steps
1. Create `nothrow()` utility — wraps async fn, returns null on error, logs warning
2. Create `retry()` utility — configurable attempts, exponential backoff
3. Standardize service errors (ServiceError class with code, message, context)
4. Refactor existing try/catch blocks to use fail-fast + nothrow/retry
5. Add error boundary logging (Sentry integration for uncaught service errors)

## Todo
- [ ] Create nothrow() utility | - [ ] Create retry() utility
- [ ] ServiceError class | - [ ] Refactor services | - [ ] Tests

## Success Criteria
- All services throw typed ServiceError on failure
- External API calls use retry() with backoff
- No silent error swallowing (`grep -r "catch {}" src/` = 0)
