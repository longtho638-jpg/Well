# NiceGUI Core Architecture Research

## 1. Reactive Binding System
**Problem:** Keeping UI in sync with app state requires manual DOM updates or complex frameworks.
**Solution:** Python-side observable properties auto-push updates to browser via WebSocket. `ui.bind_value()` creates two-way bindings. State change → diff → minimal DOM patch. No manual refresh needed.
**Key decisions:** Server-authoritative state (Python holds truth, browser is view). Bindings are declarative — bind once, auto-sync forever. Granular updates (only changed elements re-render).
**Extensibility:** Custom bindings via `on_value_change` callbacks. Computed properties chain bindings.
**Well lesson:** Zustand store already reactive, but consider finer-grained subscriptions. Use selectors to prevent unnecessary re-renders. Declarative data binding pattern for dashboard widgets — bind widget to store slice, auto-update.

## 2. Component Architecture
**Problem:** UI frameworks need composable, reusable building blocks with predictable lifecycle.
**Solution:** Every UI element = Python class wrapping a Vue component. Composition via context manager (`with ui.card(): ui.label('text')`). Slot system for flexible layouts. 30+ built-in elements (table, chart, 3D, markdown).
**Key decisions:** Context manager pattern = natural nesting. Each element has props, events, slots. Elements self-register with parent. Lifecycle: create → mount → update → destroy.
**Extensibility:** Custom elements via `@ui.element` decorator. Wrap any Vue component.
**Well lesson:** Compound component pattern (like Cal.com's @calcom/ui). Dashboard widgets should be self-contained: `<CommissionWidget period="7d" />` encapsulates data fetching, loading state, error handling, display.

## 3. Client-Server Communication
**Problem:** Traditional REST = request/response latency. Real-time UIs need push updates.
**Solution:** Persistent WebSocket between browser and Python server. Events flow both ways: user click → WebSocket → Python handler → state change → WebSocket → DOM update. ~10ms round-trip on localhost.
**Key decisions:** WebSocket per client session. Binary message protocol for efficiency. Automatic reconnection on disconnect. Batched updates (multiple state changes in one frame).
**Extensibility:** Custom message types. Server-push notifications. Timer-based updates.
**Well lesson:** Supabase Realtime already provides WebSocket channels. Use for live commission updates, team activity feed, agent response streaming. Batch small updates to reduce render cycles.

## 4. Modular Page System
**Problem:** Multi-page apps need routing, shared layouts, per-page state, auth guards.
**Solution:** `@ui.page('/path')` decorator defines routes. Shared header/footer via `ui.header()`. Per-page state isolated by session. Auth middleware via `app.middleware`. 404 handling.
**Key decisions:** Page = function decorated with route. Middleware chain: auth → rate-limit → render. Session state scoped per user. Shared layout components reusable across pages.
**Extensibility:** Dynamic routes with path params. Nested layouts.
**Well lesson:** React Router already handles this, but apply: route-level code splitting (React.lazy per page), auth guards as route wrappers, layout components for consistent page structure. Per-page Zustand slices for isolated state.

## 5. Native App & Deployment
**Problem:** Web apps feel non-native. Deployment options vary (Docker, bare metal, cloud).
**Solution:** NiceGUI wraps in pywebview for desktop app. Docker image provided. Kubernetes-ready with health checks. Static file serving. Auto-reload in dev.
**Key decisions:** Same codebase for web + desktop. Docker = production default. Health endpoint for k8s probes. Environment-based config.
**Well lesson:** Vercel handles deployment, but consider: PWA capabilities for mobile distributors (offline support, push notifications). Health check endpoint for monitoring. Environment-based feature flags.
