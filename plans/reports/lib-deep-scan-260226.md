# Binh Pháp Deep Scan 10x Report: `src/lib`
**Target:** `/Users/macbookprom1/archive-2026/Well/src/lib`
**Date:** 2026-02-26

## 🎯 Executive Summary
Initial shallow scan (for `any` types, `console.log`, `@ts-ignore`, `TODO/FIXME`) yielded 0 results, indicating a clean surface. However, deep analysis revealed **CRITICAL security and performance flaws** in 2 primary files.

---

## 🔴 TOP 1 CRITICAL: `src/lib/supabase-rls.sql`
**Category:** Security (Data Leak) - 第四篇 軍形 (Jun Xing)

### The Flaw
The policy `"Allow reading own inserted order"` contains a dangerous logical OR condition:
```sql
USING (
  (auth.uid() = user_id) OR
  (auth.uid() IS NULL AND created_at > now() - interval '1 minute')
);
```

### Impact (CVSS 9.0+ equivalent)
- **Data Leakage:** Any unauthenticated user (`anon` role) can query the `transactions` table and retrieve ALL transactions created globally within the last 60 seconds.
- **Exploitation:** An attacker can write a script to poll the database every 59 seconds to systematically scrape all guest orders, capturing PII, payment info, or order details.

### Recommended Fix
Remove the time-based window entirely. Guest orders should either:
1. Return data via the `INSERT ... RETURNING` clause instead of allowing generic `SELECT` access.
2. Be protected by a unique session ID, anonymous JWT, or unguessable token (e.g., UUID) passed during the insert.

---

## 🟠 TOP 2 HIGH: `src/lib/rate-limiter.ts`
**Category:** Performance (Memory Leak) - 第三篇 謀攻 (Mou Gong)

### The Flaw
The `RateLimiter` class uses an unbounded in-memory `Map` to store request logs:
```typescript
private requests: Map<string, RequestLog[]> = new Map();
```

### Impact
- **Memory Leak:** Stale keys are never actively cleaned up. If an IP address or user makes 1 request and never returns, their array remains in the `Map` forever.
- In a long-running Node.js/Edge process serving thousands of unique visitors, the `Map` will grow indefinitely, eventually causing an Out-Of-Memory (OOM) crash.

### Recommended Fix
Implement an active cleanup mechanism (garbage collection):
1. Use `setInterval` to periodically sweep the `Map` and delete keys where all requests are older than `windowMs`.
2. Alternatively, transition to a Redis-based rate limiter or a lightweight library like `lru-cache` which handles TTL and max size automatically.

---

## 🟡 Honorable Mention: `src/lib/analytics.ts`
**Category:** Reliability

### The Flaw
Direct access to the `window` object without checking for SSR environment:
```typescript
if (import.meta.env.PROD && window.va) {
```

### Impact
If this utility is ever imported or executed on the server side (e.g., Next.js SSR, Vite SSR, or Edge functions), it will throw a `ReferenceError: window is not defined` and crash the application.

### Recommended Fix
Add a simple safety check:
```typescript
if (import.meta.env.PROD && typeof window !== 'undefined' && window.va)
```
