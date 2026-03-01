# NiceGUI Developer Experience & Extensibility Research

## 1. Tailwind & Theming
**Problem:** Consistent styling across components. Theme switching without rewriting CSS.
**Solution:** Built-in Tailwind CSS — every element has `.classes()` and `.style()` methods. Dark mode via `ui.dark_mode()`. Custom themes override CSS variables. Design tokens for colors, spacing, typography.
**Key decisions:** Tailwind as utility layer (not custom CSS framework). Theme = CSS variable overrides. Dark mode toggleable at runtime. Per-element style props.
**Well lesson:** Aura Elite theme should use CSS variables for design tokens. Theme switching (dark/light) via variable swap, not class rewrite. Tailwind already used — ensure consistent token usage across all components.

## 2. Event System
**Problem:** Browser events need to reach server. Frequent events (scroll, resize) cause flooding.
**Solution:** Events registered declaratively: `button.on('click', handler)`. Built-in debouncing and throttling. Custom event types via `ui.run_javascript()`. Timer scheduling: `ui.timer(interval, callback)`.
**Key decisions:** Event handlers are async Python functions. Debounce/throttle configurable per event. Timer for polling patterns. JavaScript bridge for custom browser events.
**Extensibility:** Custom events emittable from JS to Python. Event middleware chain.
**Well lesson:** Apply debouncing to search inputs, scroll-based loading, resize handlers. Use Zustand middleware for event logging. Timer pattern for periodic data refresh (commission updates every 30s).

## 3. Storage & State Persistence
**Problem:** State lost on refresh. Users expect continuity. Multi-device state sync needed.
**Solution:** Three storage tiers: `app.storage.user` (server-side, persists across sessions), `app.storage.client` (browser-side, localStorage), `app.storage.general` (shared across all users). Auto-serialization.
**Key decisions:** User storage keyed by auth identity. Client storage for preferences (theme, sidebar state). General storage for app-wide configs. Automatic JSON serialization/deserialization.
**Extensibility:** Custom storage backends. Encrypted storage for sensitive data.
**Well lesson:** Three-tier storage for Well: Supabase (persistent user data), Zustand (session state), localStorage (UI preferences like theme, language, sidebar collapsed). Clear separation prevents confusion about where data lives.

## 4. Custom Element API
**Problem:** Framework needs to be extensible without forking. Third-party components.
**Solution:** `@ui.element` decorator wraps any Vue component as NiceGUI element. Props, events, slots mapped automatically. Published as pip packages. Community elements ecosystem.
**Key decisions:** Standard interface: props in, events out. Auto-generated Python API from Vue component definition. Lazy-loaded (only imported when used). Versioned independently.
**Extensibility:** Any Vue/Web Component integratable. Plugin registry for discovery.
**Well lesson:** Custom React component registry for dashboard widgets. Standard interface: `{ data, config, onAction }`. Widgets lazy-loaded. Could enable admin-configurable dashboards (choose which widgets to show).

## 5. Auto-Documentation
**Problem:** Docs get stale. Examples break. Developers need interactive references.
**Solution:** NiceGUI docs ARE a NiceGUI app — live interactive examples. Each component page shows: API, props, events, live demo, source code. Auto-generated from docstrings + type hints.
**Key decisions:** Docs = running app (dogfooding). Type hints → API docs. Examples are executable. Search across all components.
**Well lesson:** Storybook-like component library for Aura Elite design system. Interactive examples for each component. Auto-generated prop tables from TypeScript interfaces. Living documentation stays in sync with code.
