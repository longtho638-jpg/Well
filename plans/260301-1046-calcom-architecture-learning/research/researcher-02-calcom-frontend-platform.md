# Cal.com Frontend & Platform Architecture Research

## 1. Next.js App Architecture
**Problem:** Complex SPA with auth, i18n, SSR, dynamic routing needs clear structure.
**Solution:** Next.js App Router with parallel routes, intercepting routes, layout nesting. Server Components for data fetching, Client Components for interactivity. Middleware for auth/locale detection.
**Key decisions:** Colocated route handlers. Loading/error boundaries per route segment. Streaming SSR for fast first paint. Separate apps for booking widget vs dashboard.
**Extensibility:** New pages = new route folders. Layouts cascade without re-rendering parent.
**Well lesson:** Though Well uses Vite SPA (not Next.js), layout nesting pattern is applicable. React Router nested layouts. Suspense boundaries per route. Lazy-loaded route modules. Error boundaries per page section.

## 2. UI Component System (@calcom/ui)
**Problem:** Multiple apps share UI. Design consistency needed across teams.
**Solution:** Dedicated `@calcom/ui` package. Radix UI primitives + Tailwind. Design tokens via CSS variables. Variant-based API (cva/class-variance-authority). Storybook for docs.
**Key decisions:** Compound components (Dialog.Header, Dialog.Content). Slot pattern for composition. Tailwind config shared via preset. Dark mode via CSS variables, not className toggle.
**Extensibility:** Components are headless-first, styled via tokens. Override tokens = new theme.
**Well lesson:** Extract shared components into dedicated module. Use CVA for variant management. Design tokens for Aura Elite theme. Compound component pattern for complex widgets (Modal.Header, Modal.Body).

## 3. Embed SDK & Platform API
**Problem:** Cal.com needs to work inside other websites (embed). Partners need white-label.
**Solution:** Lightweight embed.js (~15KB) injects iframe or inline widget. Communication via postMessage. Platform API (v2) for full white-label — create users, event types, bookings programmatically. API keys + OAuth.
**Key decisions:** Embed is framework-agnostic (vanilla JS). Cal namespace on window. Theme customization via embed config. Platform API uses REST (not tRPC) for external consumers.
**Extensibility:** Embed supports modal, inline, floating button modes. Custom CSS. Platform API = full control.
**Well lesson:** Agent widgets could be embeddable. Sales Copilot as iframe embed for partner sites. Platform API concept for distributor tools. Separate internal (tRPC-like) vs external (REST) API strategies.

## 4. Billing & Subscription (Stripe Integration)
**Problem:** SaaS needs per-seat pricing, feature gating, upgrade/downgrade flows.
**Solution:** Stripe as payment engine. Plans table maps to Stripe Price IDs. Feature flags checked against active subscription. Per-seat billing via quantity updates. Webhook handlers for subscription lifecycle.
**Key decisions:** Feature gating middleware — check plan before allowing action. Graceful degradation (show upgrade prompt, not error). Trial periods. Annual/monthly toggle. Usage-based add-ons.
**Extensibility:** New features gated by adding to plan-feature mapping. No code change for pricing changes (Stripe dashboard).
**Well lesson:** Commission tier system maps to subscription concept. Feature gating per distributor rank (Member→Partner→Founder). Upgrade prompts for premium features. PayOS integration should follow webhook handler patterns.

## 5. Workflow Automation Engine
**Problem:** Users want custom automations without coding (send SMS before meeting, email after).
**Solution:** Workflow model: Trigger (BEFORE_EVENT, AFTER_EVENT, NEW_EVENT) → Steps (EMAIL, SMS, WEBHOOK). User builds workflow via UI. Engine evaluates triggers, executes steps in order. Templates with variables ({{name}}, {{date}}).
**Key decisions:** Step-based execution with retry. Template engine for personalization. Active/inactive toggle. Workflow tied to event types. Cron-based scheduling for time-based triggers.
**Extensibility:** New trigger types = new enum. New step types = new handler. Template variables extensible.
**Well lesson:** Workflow engine for distributor automations: "When new team member joins → send welcome email + assign training quest". Agent workflows as configurable trigger→action chains. Commission alerts as workflow steps.
