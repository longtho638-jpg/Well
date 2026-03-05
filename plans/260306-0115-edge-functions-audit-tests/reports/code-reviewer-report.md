# Code Quality Audit Report — Edge Functions

**Date:** 2026-03-06
**Auditor:** code-reviewer
**Files:** webhook-retry/index.ts, dlq-retry-job/index.ts

---

## 🔴 webhook-retry/index.ts

### Security Issues

| Severity | Issue | Line | Fix |
|----------|-------|------|-----|
| HIGH | No authentication check | 14-71 | Add cron secret or service role validation |
| MEDIUM | Input validation missing | 21-25 | Validate payload structure with schema |
| LOW | Generic error messages | 66-69 | Sanitize error messages (no internal details) |

### Code Quality Issues

| Severity | Issue | Line | Fix |
|----------|-------|------|-----|
| MEDIUM | Hardcoded magic numbers | 48, 51 | Extract to constants |
| MEDIUM | Incomplete implementation | 59-64 | TODO comment — needs actual webhook processor |
| LOW | No logging/audit trail | - | Add audit log for each retry attempt |

### Type Safety
- ✅ No `any` types
- ✅ Proper TypeScript types
- ⚠️ Missing types for request/response

---

## 🟡 dlq-retry-job/index.ts

### Security Issues

| Severity | Issue | Line | Fix |
|----------|-------|------|-----|
| HIGH | Cron secret validation | 19-23 | ✅ Already implemented |
| MEDIUM | No rate limiting | 41-71 | Add guard against runaway loops |

### Code Quality Issues

| Severity | Issue | Line | Fix |
|----------|-------|------|-----|
| HIGH | Duplicated logic | 42-46 | Extract exponential backoff to shared utility |
| HIGH | Duplicated logic | 64-68 | Extract status update logic |
| MEDIUM | Hardcoded values | 34, 43, 64 | Extract to constants (MAX_RETRIES=5, BASE_DELAY=60000) |
| MEDIUM | Long function | 14-77 | Split into smaller functions |
| LOW | No logging | - | Add console.log for monitoring |
| LOW | Missing audit trail | - | Log each retry attempt to audit table |

### Type Safety
- ✅ No `any` types
- ⚠️ Inline type assertions
- ⚠️ Missing response types

---

## 📋 Common Issues (Both Files)

### Critical
1. **No unit tests** — 0% coverage
2. **No integration tests** — Cannot verify end-to-end flow
3. **Duplicated backoff logic** — Should be in shared utility

### High Priority
4. **Magic numbers** — MAX_RETRIES, BASE_DELAY, MAX_DELAY hardcoded inline
5. **No structured logging** — Debugging production will be hard
6. **Missing error categorization** — Transient vs permanent errors

### Medium Priority
7. **No timeout handling** — Function could hang indefinitely
8. **No concurrency control** — Could overwhelm downstream services
9. **Missing health check endpoint** — No way to verify function health

---

## ✅ Strengths

1. ✅ CORS headers properly configured
2. ✅ Cron secret validation (dlq-retry-job)
3. ✅ Exponential backoff implemented
4. ✅ State machine transitions (pending → processing → resolved/discarded)
5. ✅ Max retries protection

---

## 🎯 Recommendations

### Immediate (Pre-deployment)
1. Extract shared utilities:
   - `exponentialBackoffDelay(failureCount, baseDelay, maxDelay)`
   - `updateDLQStatus(supabase, id, status, metadata)`
2. Add structured logging
3. Write unit tests (80%+ coverage)
4. Add integration tests

### Post-deployment
5. Add monitoring dashboard
6. Add alerting on DLQ backlog
7. Add retry metrics (success rate, avg retries)

---

## 📊 Score

| Category | Score | Notes |
|----------|-------|-------|
| Security | 7/10 | Cron secret ✅, no input validation ❌ |
| Type Safety | 8/10 | No `any` but missing response types |
| Code Quality | 5/10 | Duplicated logic, magic numbers |
| Test Coverage | 0/10 | No tests |
| **Overall** | **5/10** | Needs work before production |

---

## ❓ Unresolved Questions

1. Should webhook-retry call actual webhook processor or just mark as success?
2. What's the expected throughput (items per cron run)?
3. Should we add dead letter queue alerting when backlog > threshold?
