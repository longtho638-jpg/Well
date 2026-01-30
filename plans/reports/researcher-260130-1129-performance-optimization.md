# Performance Optimization for Static Admin Dashboards

## Executive Summary
For a static admin dashboard (manual refresh) handling large datasets on the WellNexus stack (React, TypeScript, Supabase, Zustand), performance hinges on **virtualization** for rendering and **efficient data fetching** (solving N+1 issues). While Zustand handles client state well, **TanStack Query** is recommended for server state caching.

## 1. Data Fetching Strategies
### Problem: The N+1 Bottleneck
Current `orderService.ts` fetches orders then loops to fetch users:
```typescript
// ❌ Current N+1 Pattern (Slow)
const ordersWithUsers = await Promise.all((data || []).map(async (order) => { ... }));
```
### Solution: Supabase Joins & RPC
Use Supabase's efficient join capability to fetch related data in a single query.
```typescript
// ✅ Optimized Pattern (1 Request)
.select('*, user:users(name, email)')
```

### Pagination vs. Virtualization
*   **Virtualization (Recommended for "Static" UX):** For datasets < 10k rows where users want "infinite" scrolling without page clicks. Use `react-virtuoso` or `react-window`. It renders only visible DOM nodes.
*   **Server-Side Pagination:** Mandatory for datasets > 10k rows. Fetch 50-100 rows at a time.
*   **Strategy:** Hybrid. Fetch all IDs (lightweight), then fetch data chunks, or use standard offset-based pagination with a virtualized list for the view.

## 2. Caching Patterns
### React Query vs. Zustand
*   **React Query (Recommended):** Handles caching, deduping, background updates, and stale-while-revalidate out of the box. Essential for preventing unnecessary network requests on tab focus or component remount.
*   **Zustand (Manual):** If avoiding new dependencies, implement a `lastFetched` timestamp pattern:
    ```typescript
    if (Date.now() - store.lastFetched < 60000) return; // Use cached data
    ```
    *Trade-off:* Requires manual boilerplate for loading states, error handling, and cache invalidation.

## 3. Rendering Performance (Metrics & Optimization)
*   **Goal:** Maintain 60fps scrolling and < 200ms interaction delay.
*   **Virtual DOM:** Never render 1000+ rows. Use `react-virtuoso`.
*   **Memoization:** Wrap table rows in `React.memo`. Ensure event handlers are stable (use `useCallback`) to preventing re-rendering all rows on a single checkbox click.
*   **Web Workers:** Offload heavy data transformation (sorting/filtering 10k+ arrays) to a Web Worker to keep the UI thread responsive.

## 4. Export Features (CSV/Excel)
*   **Small/Medium Data (< 5k rows):** Client-side generation using `Blob`.
*   **Large Data (> 5k rows):** **Do not** generate on the main thread (freezes UI).
    *   **Option A (Web Worker):** Generate CSV in a background thread.
    *   **Option B (Server-Side):** Create a Supabase Edge Function that streams the CSV or generates a signed URL. This is the most robust method for "thousands" of records.

## 5. Search/Filter Performance
*   **Debouncing:** Debounce text inputs by 300-500ms to prevent filtering on every keystroke.
*   **Client-Side Indexing:** For fully loaded datasets, use `match-sorter` coupled with `useMemo`.
*   **Server-Side Filtering:** If using pagination, filtering **must** happen on the server (Supabase `.ilike()`), otherwise you only filter the current page.

## Citations & Resources
*   [TanStack Query (React Query) Overview](https://tanstack.com/query/latest)
*   [React Virtuoso (Virtualization)](https://virtuoso.dev/)
*   [Supabase: Querying with Joins](https://supabase.com/docs/guides/database/joins)
*   [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## Unresolved Questions
*   Is adding `tanstack/react-query` permitted in the current stack, or must we strictly use `zustand`?
*   What is the maximum expected number of records (1k, 10k, 100k)?
