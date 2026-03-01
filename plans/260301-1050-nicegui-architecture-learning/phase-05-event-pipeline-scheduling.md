# Phase 5: Event Pipeline & Scheduling

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: NiceGUI's event debouncing, throttling, timer scheduling

## Overview
- **Date:** 2026-03-01
- **Priority:** P3
- **Implementation:** pending
- **Review:** pending

Create standardized event pipeline with built-in debouncing, throttling, and timer scheduling. Periodic data refresh for commission updates, agent health checks, notification polling.

## Key Insights

NiceGUI handles high-frequency events with built-in debounce/throttle. Timers schedule periodic callbacks (`ui.timer(5, refresh_data)`). Events are async, non-blocking.

**Applied to Well:** Search inputs debounced. Scroll-based loading throttled. Commission data refreshed every 30s. Agent health checked periodically. Notification badge updated in real-time.

## Requirements
- Shared debounce/throttle utility hooks
- Timer hook for periodic data refresh
- Event pipeline with logging (for debugging)
- Cleanup on component unmount (no memory leaks)

## Architecture

```typescript
// src/shared/hooks/use-debounce.ts
const useDebouncedCallback = (fn, delayMs) => { ... };
const useThrottledCallback = (fn, intervalMs) => { ... };

// src/shared/hooks/use-interval.ts
const useInterval = (callback, intervalMs, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(callback, intervalMs);
    return () => clearInterval(id);
  }, [callback, intervalMs, enabled]);
};

// Usage:
useInterval(() => refreshCommissions(), 30000);        // every 30s
useInterval(() => checkNotifications(), 60000);         // every 60s
const debouncedSearch = useDebouncedCallback(search, 300);  // 300ms debounce
```

## Implementation Steps
1. Create `useDebouncedCallback` and `useThrottledCallback` hooks
2. Create `useInterval` hook with enable/disable control
3. Apply debounce to all search inputs across portal
4. Apply throttle to scroll-based loading (product grid, network tree)
5. Add periodic commission refresh (30s interval)
6. Add notification polling (60s interval) or replace with Supabase Realtime
7. Ensure all intervals/listeners cleaned up on unmount
8. Add event logging utility for debugging

## Todo
- [ ] Create debounce/throttle hooks
- [ ] Create useInterval hook
- [ ] Apply to search inputs
- [ ] Apply to scroll handlers
- [ ] Periodic commission refresh
- [ ] Notification polling/realtime
- [ ] Cleanup verification (no memory leaks)
- [ ] Tests

## Success Criteria
- Search inputs debounced (no API call per keystroke)
- Commission data auto-refreshes without manual reload
- Zero memory leaks — all intervals cleared on unmount
- React DevTools shows no leaked subscriptions

## Risk Assessment
- **Low:** Standard React patterns — well-documented approach
- **Low:** Interval frequency — 30s/60s is reasonable, not excessive

## Security Considerations
- Throttled API calls prevent accidental DDoS of own backend
- Interval callbacks respect auth state (stop polling on logout)

## Next Steps
- NiceGUI learning series complete
- Apply learnings to other phases from Cal.com and Portkey plans
